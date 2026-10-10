-- AI Log, Session, Club 을 지우는 접근 규칙.
-- 결정 배경은 docs/adr/0015-delete-rules.md 에 있다.

-- 지우면 바로 없어지고 되살릴 수 없다. 숨겨 두는 열이나 보관 기간은 두지 않는다.
-- 함께 지워지거나 남는 것은 이미 외래 키에 정해져 있어 이 파일에서는 바꾸지 않는다.
--   Session 을 지우면 그 회차의 Attendance 는 함께 지워지고, AI Log 는 Session 연결만 비워진 채 남는다.
--   Club 을 지우면 Member, Session, Attendance, AI Log, 초대 링크가 모두 함께 지워진다.

-- 앱이 켜져 있는 데이터베이스에 손으로 적용할 때는 아래 세 묶음을 하나씩 따로 실행한다.
-- 접근 규칙을 만드는 동안 그 테이블은 잠긴다. 세 테이블을 한 번에 잠근 채로 앱의 조회와 마주치면
-- 서로가 가진 것을 기다리다 멈추고(deadlock, 40P01), 데이터베이스가 이 파일 쪽을 취소한다.
-- 한 번에 한 테이블만 잠그면 잠깐 기다릴 뿐 멈추지 않는다.
-- 묶음마다 먼저 지우고 만들기 때문에 몇 번을 다시 실행해도 결과가 같다.

-- ---------------------------------------------------------------------------
-- 1. AI Log
-- ---------------------------------------------------------------------------

-- 작성자 본인과 그 Club 의 운영자가 지운다.
-- 작성자가 Club 에서 빠진 기록은 작성자가 비어 있으므로 운영자만 지울 수 있다.
drop policy if exists ai_logs_delete_by_author_or_admin on public.ai_logs;
create policy ai_logs_delete_by_author_or_admin on public.ai_logs
  for delete
  to authenticated
  using (
    (
      author_id = (select auth.uid())
      and private.is_club_member(club_id)
    )
    or private.is_club_admin(club_id)
  );
grant delete on table public.ai_logs to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Session
-- ---------------------------------------------------------------------------

-- 그 Club 의 운영자가 지운다.
drop policy if exists sessions_delete_for_admins on public.sessions;
create policy sessions_delete_for_admins on public.sessions
  for delete
  to authenticated
  using (private.is_club_admin(club_id));
grant delete on table public.sessions to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Club
-- ---------------------------------------------------------------------------

-- 그 Club 의 운영자가 지운다. 운영자는 모두 같은 권한을 가진다.
-- Club 이름을 입력해 확인하는 절차는 앱이 맡는다.
drop policy if exists clubs_delete_for_admins on public.clubs;
create policy clubs_delete_for_admins on public.clubs
  for delete
  to authenticated
  using (private.is_club_admin(id));
grant delete on table public.clubs to authenticated;
