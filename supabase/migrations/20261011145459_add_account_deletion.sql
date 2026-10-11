-- 자기 계정을 지우는 함수와, Member 가 한 명도 남지 않은 Club 을 지우는 규칙.
-- 결정 배경은 docs/adr/0027-account-deletion-and-privacy.md 에 있다.

-- 이 파일은 기존 테이블 가운데 members 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- ---------------------------------------------------------------------------
-- Member 가 한 명도 남지 않은 Club
-- ---------------------------------------------------------------------------

-- 계정이 지워지면서 마지막 Member 가 사라지면 그 Club 을 지운다. 아무도 볼 수 없는 기록을 남기지 않으려는 것이다.
-- 스스로 나가거나 내보내지는 경우에는 마지막 운영자 규칙 때문에 Club 이 비지 않는다.
-- clubs 와 auth.users 를 읽고 clubs 를 지워야 해서 만든 사람의 권한으로 실행한다.
create or replace function private.remove_club_without_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 계정이 그대로 있으면 나가거나 내보내진 것이다.
  if exists (select 1 from auth.users where id = old.user_id) then
    return null;
  end if;
  -- Club 이 지워지는 중이면 할 일이 없다.
  if not exists (select 1 from public.clubs where id = old.club_id) then
    return null;
  end if;
  if exists (select 1 from public.members where club_id = old.club_id) then
    return null;
  end if;

  delete from public.clubs where id = old.club_id;
  return null;
end;
$$;

revoke all on function private.remove_club_without_members() from public;

drop trigger if exists members_remove_empty_club on public.members;
create trigger members_remove_empty_club
  after delete on public.members
  for each row
  execute function private.remove_club_without_members();

-- ---------------------------------------------------------------------------
-- 자기 계정 지우기
-- ---------------------------------------------------------------------------

-- 지금 로그인한 사용자의 계정을 지운다. 되돌릴 수 없다.
-- delete_content 가 true 이면 내가 쓴 AI Log, 회고, 댓글을 먼저 지운다. false 이면 Club 에서 나갈 때처럼 작성자 없이 남는다.
-- 내가 붙인 이미지의 목록은 어느 쪽이든 지운다. 파일은 앱이 이 함수를 부르기 전에 Storage 에서 지운다.
-- 파일이 남아 있으면 Supabase 가 계정을 지우지 못하게 막고, 그때는 아무것도 바뀌지 않는다.
-- 계정이 지워지면 소속이 함께 지워지고, 마지막 운영자였던 Club 은 먼저 참여한 구성원이 이어받고,
-- 혼자 있던 Club 은 함께 지워진다.
create or replace function public.delete_my_account(delete_content boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception '로그인한 사용자만 계정을 지울 수 있습니다.'
      using errcode = '42501';
  end if;

  -- 떠나는 사람이 지운 것은 지운 기록에 남기지 않는다. 그 표시를 지운 기록 함수가 읽는다.
  perform set_config('app.account_deletion', 'on', true);

  delete from public.ai_log_attachments where created_by = me;

  if delete_content then
    delete from public.ai_log_comments where author_id = me;
    delete from public.retrospectives where author_id = me;
    delete from public.ai_logs where author_id = me;
  end if;

  perform set_config('app.account_deletion', 'off', true);

  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account(boolean) from public, anon;
grant execute on function public.delete_my_account(boolean) to authenticated;
