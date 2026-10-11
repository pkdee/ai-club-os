-- 운영자가 없어진 Club 은 먼저 참여한 구성원이 이어받고, 역할이 바뀐 시각을 남긴다.
-- 결정 배경은 docs/adr/0025-retention-and-ownerless-rules.md 에 있다.

-- 이 파일은 기존 테이블 가운데 members 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 역할이 마지막으로 바뀐 시각. 알림에서 새로 운영자가 된 것을 알리는 데 쓴다.
-- Club 을 만들거나 참여하면서 정해진 역할에는 비어 있다.
alter table public.members
  add column if not exists role_changed_at timestamptz;

comment on column public.members.role_changed_at is '역할이 마지막으로 바뀐 시각. 데이터베이스가 정한다. 바뀐 적이 없으면 비어 있다.';

-- Club 에는 운영자가 한 명 이상 남아야 한다.
-- 운영자를 구성원으로 내리거나 지우려 할 때, 다른 운영자가 없으면 막는다.
-- 사용자 계정이 지워지면서 마지막 운영자가 사라지는 것은 막을 수 없으므로, 그때는 먼저 참여한 구성원이 이어받는다.
-- clubs 와 auth.users 를 읽어야 해서 만든 사람의 권한으로 실행한다.
create or replace function private.keep_one_club_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 역할이 바뀌면 바뀐 시각을 적는다.
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    new.role_changed_at := now();
  end if;

  -- 운영자가 아니었거나, 고친 뒤에도 운영자이면 확인할 것이 없다.
  if old.role <> 'admin' or (tg_op = 'UPDATE' and new.role = 'admin') then
    return coalesce(new, old);
  end if;

  -- 같은 Club 의 운영자를 동시에 바꾸는 요청이 서로를 보지 못하고 지나가지 않게 Club 행을 잠근다.
  -- Club 이 삭제되면서 Member 가 함께 지워지는 경우에는 Club 행이 이미 없으므로 그대로 둔다.
  perform 1 from public.clubs where id = old.club_id for update;
  if not found then
    return coalesce(new, old);
  end if;

  -- 사용자 계정이 삭제되면서 함께 지워지는 경우는 막지 않는다. 막으면 계정을 지울 수 없게 된다.
  -- 그 사람이 마지막 운영자였다면 남은 구성원 가운데 가장 먼저 참여한 사람이 운영자가 된다.
  -- 계정이 함께 지워지고 있는 사람은 고르지 않는다.
  if tg_op = 'DELETE'
    and not exists (select 1 from auth.users where id = old.user_id) then
    if not exists (
      select 1
      from public.members
      where club_id = old.club_id
        and role = 'admin'
        and id <> old.id
    ) then
      update public.members as m
      set role = 'admin'
      where m.id = (
        select candidate.id
        from public.members as candidate
        where candidate.club_id = old.club_id
          and candidate.id <> old.id
          and exists (select 1 from auth.users as u where u.id = candidate.user_id)
        order by candidate.created_at, candidate.id
        limit 1
      );
    end if;
    return old;
  end if;

  if not exists (
    select 1
    from public.members
    where club_id = old.club_id
      and role = 'admin'
      and id <> old.id
  ) then
    raise exception 'Club 에는 운영자가 한 명 이상 있어야 합니다.'
      using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function private.keep_one_club_admin() from public;
