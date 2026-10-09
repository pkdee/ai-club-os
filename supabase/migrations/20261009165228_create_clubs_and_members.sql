-- Club 과 Member 의 기본 구조와 접근 규칙.
-- 결정 배경은 docs/adr/0003-club-membership-and-rls.md 에 있다.

-- 접근 규칙이 쓰는 내부 함수를 두는 schema. Data API 에 노출되지 않는다.
create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint clubs_name_length check (char_length(btrim(name)) between 1 and 50),
  constraint clubs_description_length check (char_length(description) <= 200)
);

comment on table public.clubs is '활동이 이루어지는 작업 공간';
comment on column public.clubs.created_by is 'Club 을 만든 사용자. 만든 사람은 자동으로 운영자 Member 가 된다.';

create table public.members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  constraint members_role_check check (role in ('admin', 'member')),
  constraint members_club_user_unique unique (club_id, user_id)
);

comment on table public.members is '사용자와 Club 사이의 소속과 역할';
comment on column public.members.role is 'admin 은 운영자, member 는 구성원';

-- 외래 키와 접근 규칙이 쓰는 열의 색인. club_id 는 unique 제약의 색인이 맡는다.
create index clubs_created_by_idx on public.clubs (created_by);
create index members_user_id_idx on public.members (user_id);

-- ---------------------------------------------------------------------------
-- 접근 규칙에 쓰는 함수
-- ---------------------------------------------------------------------------

-- 지금 로그인한 사용자가 해당 Club 의 Member 인지 확인한다.
-- members 의 접근 규칙이 members 를 다시 읽으면 무한 반복이 되므로 security definer 로 둔다.
create function private.is_club_member(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.members
    where club_id = target_club_id
      and user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_club_member(uuid) from public;
grant execute on function private.is_club_member(uuid) to authenticated;

-- Club 을 만든 사용자를 운영자 Member 로 넣는다.
-- created_by 는 아래 insert 규칙이 로그인한 사용자와 같은 값으로 강제한다.
create function private.add_club_creator_as_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.members (club_id, user_id, role)
    values (new.id, new.created_by, 'admin');
  end if;
  return null;
end;
$$;

revoke all on function private.add_club_creator_as_admin() from public;

create trigger clubs_add_creator_as_admin
  after insert on public.clubs
  for each row
  execute function private.add_club_creator_as_admin();

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

alter table public.clubs enable row level security;
alter table public.members enable row level security;

-- Member 만 자신의 Club 을 본다.
create policy clubs_select_for_members on public.clubs
  for select
  to authenticated
  using (private.is_club_member(id));

-- 로그인한 사용자는 자신을 만든 사람으로 하는 Club 을 만들 수 있다.
create policy clubs_insert_as_creator on public.clubs
  for insert
  to authenticated
  with check (created_by = (select auth.uid()));

-- 같은 Club 의 Member 끼리만 서로를 본다.
create policy members_select_for_same_club on public.members
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- 수정과 삭제 규칙은 해당 기능을 만들 때 추가한다. 규칙이 없으면 모두 거부된다.

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

-- 로그인하지 않은 요청에는 아무 권한도 주지 않는다.
revoke all on table public.clubs from anon, authenticated;
revoke all on table public.members from anon, authenticated;

-- Club 을 만들 때는 이름과 소개만 넣을 수 있다. 나머지 열은 기본값과 trigger 가 채운다.
grant select on table public.clubs to authenticated;
grant insert (name, description) on table public.clubs to authenticated;
grant select on table public.members to authenticated;
