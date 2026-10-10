-- 초대 링크의 구조와 접근 규칙, 그리고 링크로 Club 에 참여하는 함수.
-- 결정 배경은 docs/adr/0007-club-invite-link.md 에 있다.

-- ---------------------------------------------------------------------------
-- Member 표시 이름
-- ---------------------------------------------------------------------------

-- Google 계정의 정보에서 Club 안에 보일 이름을 고른다. 이름이 없으면 이메일을 쓴다.
-- Club 을 만들 때와 초대로 참여할 때 같은 규칙을 쓰도록 한 곳에 둔다.
create function private.display_name_from(meta jsonb, email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(btrim(meta ->> 'full_name'), ''),
    nullif(btrim(meta ->> 'name'), ''),
    email,
    ''
  );
$$;

revoke all on function private.display_name_from(jsonb, text) from public;

create or replace function private.add_club_creator_as_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.members (club_id, user_id, role, display_name, email)
    select
      new.id,
      u.id,
      'admin',
      private.display_name_from(u.raw_user_meta_data, u.email),
      u.email
    from auth.users as u
    where u.id = new.created_by;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

-- Club 마다 쓸 수 있는 초대는 하나뿐이다. 새로 만들려면 이전 것을 지우고 넣는다.
create table public.club_invites (
  club_id uuid primary key references public.clubs (id) on delete cascade,
  token text not null default replace(gen_random_uuid()::text, '-', ''),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint club_invites_token_key unique (token)
);

comment on table public.club_invites is 'Club 에 참여할 수 있는 초대 링크. Club 마다 하나만 둔다.';
comment on column public.club_invites.token is '링크에 들어가는 값. 데이터베이스가 무작위로 만든다.';
comment on column public.club_invites.expires_at is '이 시각이 지나면 쓸 수 없다. 만든 때부터 7일이다.';

create index club_invites_created_by_idx on public.club_invites (created_by);

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

alter table public.club_invites enable row level security;

-- 초대 링크는 운영자만 보고, 만들고, 지운다. 구성원에게는 보이지 않는다.
create policy club_invites_select_for_admins on public.club_invites
  for select
  to authenticated
  using (private.is_club_admin(club_id));

create policy club_invites_insert_for_admins on public.club_invites
  for insert
  to authenticated
  with check (
    private.is_club_admin(club_id)
    and created_by = (select auth.uid())
  );

create policy club_invites_delete_for_admins on public.club_invites
  for delete
  to authenticated
  using (private.is_club_admin(club_id));

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

revoke all on table public.club_invites from anon, authenticated;

-- 넣을 수 있는 열은 club_id 뿐이다. 링크 값과 만료 시각은 데이터베이스가 정하고, 고칠 수 없다.
grant select, delete on table public.club_invites to authenticated;
grant insert (club_id) on table public.club_invites to authenticated;

-- ---------------------------------------------------------------------------
-- 초대 링크로 참여하기
-- ---------------------------------------------------------------------------

-- 아직 Member 가 아닌 사람은 clubs 와 members 를 읽거나 쓸 수 없다.
-- 그래서 아래 두 함수만 만든 사람의 권한으로 실행하고, 안에서 로그인 여부와 링크 값을 직접 확인한다.

-- 링크가 가리키는 Club 을 미리 보여 준다. 링크가 틀렸거나 만료됐으면 아무 행도 돌려주지 않는다.
create function public.preview_club_invite(invite_token text)
returns table (
  club_id uuid,
  club_name text,
  club_description text,
  member_count bigint,
  already_member boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.name,
    c.description,
    (select count(*) from public.members as m where m.club_id = c.id),
    exists (
      select 1
      from public.members as m
      where m.club_id = c.id
        and m.user_id = (select auth.uid())
    )
  from public.club_invites as i
  join public.clubs as c on c.id = i.club_id
  where i.token = invite_token
    and i.expires_at > now()
    and (select auth.uid()) is not null;
$$;

-- 로그인한 사용자를 링크가 가리키는 Club 의 구성원으로 넣고 그 Club 의 식별자를 돌려준다.
-- 이미 Member 이면 그대로 두고 식별자만 돌려준다. 링크가 틀렸거나 만료됐으면 null 을 돌려준다.
create function public.join_club(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  joining_user_id uuid := (select auth.uid());
  target_club_id uuid;
begin
  if joining_user_id is null then
    return null;
  end if;

  select i.club_id
  into target_club_id
  from public.club_invites as i
  where i.token = invite_token
    and i.expires_at > now();

  if target_club_id is null then
    return null;
  end if;

  insert into public.members (club_id, user_id, role, display_name, email)
  select
    target_club_id,
    u.id,
    'member',
    private.display_name_from(u.raw_user_meta_data, u.email),
    u.email
  from auth.users as u
  where u.id = joining_user_id
  on conflict (club_id, user_id) do nothing;

  return target_club_id;
end;
$$;

-- 로그인한 사용자만 부를 수 있다.
revoke all on function public.preview_club_invite(text) from public, anon;
revoke all on function public.join_club(text) from public, anon;
grant execute on function public.preview_club_invite(text) to authenticated;
grant execute on function public.join_club(text) to authenticated;
