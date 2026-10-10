-- Member 의 프로필 사진. Google 계정의 사진 주소를 옮겨 적는다.
-- 결정 배경은 docs/adr/0008-member-avatar-from-google.md 에 있다.

-- ---------------------------------------------------------------------------
-- 사진 주소 고르기
-- ---------------------------------------------------------------------------

-- Google 계정의 정보에서 사진 주소를 고른다. Google 이 사진을 올려 두는 주소가 아니면 null 이다.
-- 이 정보는 사용자가 직접 고칠 수 있어서, 아무 주소나 받으면 다른 Member 의 화면이 엉뚱한 곳에서 그림을 불러오게 된다.
create function private.avatar_url_from(meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when picked.url ~ '^https://lh[0-9]+\.googleusercontent\.com/'
      and char_length(picked.url) <= 1024
    then picked.url
  end
  from (
    select coalesce(
      nullif(btrim(meta ->> 'avatar_url'), ''),
      nullif(btrim(meta ->> 'picture'), '')
    ) as url
  ) as picked;
$$;

revoke all on function private.avatar_url_from(jsonb) from public;

-- ---------------------------------------------------------------------------
-- 열
-- ---------------------------------------------------------------------------

alter table public.members
  add column avatar_url text,
  add constraint members_avatar_url_check check (
    avatar_url is null
    or (
      avatar_url ~ '^https://lh[0-9]+\.googleusercontent\.com/'
      and char_length(avatar_url) <= 1024
    )
  );

comment on column public.members.avatar_url is 'Google 계정의 프로필 사진 주소. 없으면 화면은 이름의 첫 글자를 보여 준다.';

-- 이미 있는 Member 에게 사진 주소를 채운다.
update public.members as m
set avatar_url = private.avatar_url_from(u.raw_user_meta_data)
from auth.users as u
where u.id = m.user_id;

-- ---------------------------------------------------------------------------
-- Member 가 될 때 사진 주소도 함께 넣기
-- ---------------------------------------------------------------------------

create or replace function private.add_club_creator_as_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.members (club_id, user_id, role, display_name, email, avatar_url)
    select
      new.id,
      u.id,
      'admin',
      private.display_name_from(u.raw_user_meta_data, u.email),
      u.email,
      private.avatar_url_from(u.raw_user_meta_data)
    from auth.users as u
    where u.id = new.created_by;
  end if;
  return null;
end;
$$;

-- 함수를 바꿔 써도 실행 권한은 그대로 남는다. 로그인한 사용자만 부를 수 있다.
create or replace function public.join_club(invite_token text)
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

  insert into public.members (club_id, user_id, role, display_name, email, avatar_url)
  select
    target_club_id,
    u.id,
    'member',
    private.display_name_from(u.raw_user_meta_data, u.email),
    u.email,
    private.avatar_url_from(u.raw_user_meta_data)
  from auth.users as u
  where u.id = joining_user_id
  on conflict (club_id, user_id) do nothing;

  return target_club_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 로그인할 때 사진 주소 맞추기
-- ---------------------------------------------------------------------------

-- 부른 사용자가 속한 모든 Club 의 사진 주소를 지금의 Google 계정 정보로 맞춘다.
-- 사용자는 members 를 고칠 수 없으므로 만든 사람의 권한으로 실행하고, 자기 행의 사진 주소만 바꾼다.
create function public.sync_my_avatar()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.members as m
  set avatar_url = private.avatar_url_from(u.raw_user_meta_data)
  from auth.users as u
  where u.id = (select auth.uid())
    and m.user_id = u.id
    and m.avatar_url is distinct from private.avatar_url_from(u.raw_user_meta_data);
$$;

revoke all on function public.sync_my_avatar() from public, anon;
grant execute on function public.sync_my_avatar() to authenticated;
