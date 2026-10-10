-- Club 정보 수정, Member 역할 바꾸기, 내보내기와 나가기에 필요한 접근 규칙.
-- 결정 배경은 docs/adr/0009-member-management-and-last-admin.md 에 있다.

-- ---------------------------------------------------------------------------
-- 마지막 운영자 지키기
-- ---------------------------------------------------------------------------

-- Club 에는 운영자가 한 명 이상 남아야 한다.
-- 운영자를 구성원으로 내리거나 지우려 할 때, 다른 운영자가 없으면 막는다.
-- clubs 와 auth.users 를 읽어야 해서 만든 사람의 권한으로 실행한다.
create function private.keep_one_club_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
  if tg_op = 'DELETE'
    and not exists (select 1 from auth.users where id = old.user_id) then
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

create trigger members_keep_one_admin_on_update
  before update of role on public.members
  for each row
  execute function private.keep_one_club_admin();

create trigger members_keep_one_admin_on_delete
  before delete on public.members
  for each row
  execute function private.keep_one_club_admin();

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

-- 운영자만 Club 의 이름과 소개를 고친다.
create policy clubs_update_for_admins on public.clubs
  for update
  to authenticated
  using (private.is_club_admin(id))
  with check (private.is_club_admin(id));

-- 운영자는 같은 Club 의 Member 의 역할을 바꾼다. 운영자는 모두 같은 권한을 가진다.
create policy members_update_for_admins on public.members
  for update
  to authenticated
  using (private.is_club_admin(club_id))
  with check (private.is_club_admin(club_id));

-- 운영자는 Member 를 내보내고, 누구나 스스로 나갈 수 있다.
-- 나간 사람의 Attendance 는 함께 삭제되고 AI Log 는 작성자 없이 남는다.
create policy members_delete_for_admins_or_self on public.members
  for delete
  to authenticated
  using (
    private.is_club_admin(club_id)
    or user_id = (select auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

-- 고칠 수 있는 열을 정해 둔다. Member 는 역할만 바꿀 수 있고 다른 Club 으로 옮기거나 사람을 바꿀 수 없다.
grant update (name, description) on table public.clubs to authenticated;
grant update (role) on table public.members to authenticated;
grant delete on table public.members to authenticated;
