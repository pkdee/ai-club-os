-- AI Log 를 고치면 고치기 전의 내용을 남기고, 고친 시각은 내용이 바뀔 때만 바꾼다.
-- 결정 배경은 docs/adr/0023-notifications-names-and-revisions.md 에 있다.

-- 앞 파일(create_notification_reads_and_revisions)을 먼저 적용해야 한다.
-- 이 파일은 기존 테이블 가운데 ai_logs 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 고친 시각은 작성자가 적은 내용이나 Session, Project 연결을 바꿨을 때만 바꾼다.
-- 전에는 행의 어느 값이든 달라지면 바뀌어서, AI Insight 에 쓰지 않기 같은 선택만 바꿔도 고친 것으로 보였다.
-- 운영자가 도구 표기를 한꺼번에 합칠 때(app.bulk_tool_rename)도 바꾸지 않는다. 작성자가 고친 것이 아니기 때문이다.
drop trigger if exists ai_logs_set_updated_at on public.ai_logs;
create trigger ai_logs_set_updated_at
  before update of title, tools, attempt, result, learned, next_action on public.ai_logs
  for each row
  when (
    (old.session_id, old.project_id, old.title, old.tools, old.attempt, old.result, old.learned, old.next_action)
      is distinct from
      (new.session_id, new.project_id, new.title, new.tools, new.attempt, new.result, new.learned, new.next_action)
    and coalesce(current_setting('app.bulk_tool_rename', true), '') <> 'on'
  )
  execute function private.set_updated_at();

-- 적은 내용이 바뀌었을 때 고치기 전의 내용을 수정 기록으로 남긴다. 연결만 바꾼 것은 남기지 않는다.
drop trigger if exists ai_logs_keep_revision on public.ai_logs;
create trigger ai_logs_keep_revision
  after update of title, tools, attempt, result, learned, next_action on public.ai_logs
  for each row
  when (
    (old.title, old.tools, old.attempt, old.result, old.learned, old.next_action)
      is distinct from (new.title, new.tools, new.attempt, new.result, new.learned, new.next_action)
    and coalesce(current_setting('app.bulk_tool_rename', true), '') <> 'on'
  )
  execute function private.keep_ai_log_revision();
