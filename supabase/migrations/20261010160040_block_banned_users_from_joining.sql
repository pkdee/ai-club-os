-- 참여를 막은 사람은 초대 링크가 있어도 들어오지 못하게 한다.
-- 결정 배경은 docs/adr/0020-operation-rules.md 에 있다.

-- 앞 파일(create_operation_records)을 먼저 적용해야 한다. 함수만 바꾸므로 테이블을 잠그지 않는다.
-- 다시 실행해도 결과가 같다.

-- 미리 보기에 막혔는지를 더한다. 돌려주는 열이 바뀌므로 지우고 다시 만든다.
drop function if exists public.preview_club_invite(text);

create function public.preview_club_invite(invite_token text)
returns table (
  club_id uuid,
  club_name text,
  club_description text,
  member_count bigint,
  already_member boolean,
  blocked boolean
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
    ),
    exists (
      select 1
      from public.club_bans as b
      where b.club_id = c.id
        and b.user_id = (select auth.uid())
    )
  from public.club_invites as i
  join public.clubs as c on c.id = i.club_id
  where i.token = invite_token
    and i.expires_at > now()
    and (select auth.uid()) is not null;
$$;

-- 막힌 사람에게는 링크가 틀렸을 때와 같이 null 을 돌려준다.
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

  if exists (
    select 1
    from public.club_bans as b
    where b.club_id = target_club_id
      and b.user_id = joining_user_id
  ) then
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

-- 로그인한 사용자만 부를 수 있다.
revoke all on function public.preview_club_invite(text) from public, anon;
revoke all on function public.join_club(text) from public, anon;
grant execute on function public.preview_club_invite(text) to authenticated;
grant execute on function public.join_club(text) to authenticated;
