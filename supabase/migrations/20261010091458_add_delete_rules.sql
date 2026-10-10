-- AI Log, Session, Club 을 지우는 접근 규칙.
-- 결정 배경은 docs/adr/0015-delete-rules.md 에 있다.

-- 지우면 바로 없어지고 되살릴 수 없다. 숨겨 두는 열이나 보관 기간은 두지 않는다.
-- 함께 지워지거나 남는 것은 이미 외래 키에 정해져 있어 이 파일에서는 바꾸지 않는다.
--   Session 을 지우면 그 회차의 Attendance 는 함께 지워지고, AI Log 는 Session 연결만 비워진 채 남는다.
--   Club 을 지우면 Member, Session, Attendance, AI Log, 초대 링크가 모두 함께 지워진다.

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

-- AI Log 는 작성자 본인과 그 Club 의 운영자가 지운다.
-- 작성자가 Club 에서 빠진 기록은 작성자가 비어 있으므로 운영자만 지울 수 있다.
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

-- Session 은 그 Club 의 운영자가 지운다.
create policy sessions_delete_for_admins on public.sessions
  for delete
  to authenticated
  using (private.is_club_admin(club_id));

-- Club 은 그 Club 의 운영자가 지운다. 운영자는 모두 같은 권한을 가진다.
-- Club 이름을 입력해 확인하는 절차는 앱이 맡는다.
create policy clubs_delete_for_admins on public.clubs
  for delete
  to authenticated
  using (private.is_club_admin(id));

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

grant delete on table public.ai_logs to authenticated;
grant delete on table public.sessions to authenticated;
grant delete on table public.clubs to authenticated;
