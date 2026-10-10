-- AI Insight 를 지우면 지운 기록을 남긴다.
-- 결정 배경은 docs/adr/0020-operation-rules.md 에 있다.

-- 앞 파일(create_operation_records)을 먼저 적용해야 한다. 이 파일은 기존 테이블 가운데 ai_insights 하나만 잠근다.
-- 다시 실행해도 결과가 같다.

drop trigger if exists ai_insights_log_deletion on public.ai_insights;
create trigger ai_insights_log_deletion
  after delete on public.ai_insights
  for each row
  execute function private.log_deletion();
