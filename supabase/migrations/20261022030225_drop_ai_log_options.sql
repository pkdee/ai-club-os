-- AI Log 를 AI Insight 에 쓸지와 발표에 넣을지를 작성자가 고르던 두 선택을 없앤다. 이제 모든 기록을 쓴다.
-- 결정 배경은 docs/adr/0036-ai-logs-always-in-insight-and-presentation.md 에 있다.

-- 앞 파일(use_all_ai_logs_in_presentation)을 먼저 적용해야 한다. 발표 함수가 아직 이 열을 읽으면 발표가 열리지 않는다.
-- 앱도 이 열을 쓰지 않는 코드로 배포한 뒤에 적용한다.
-- 이 파일은 기존 테이블 가운데 ai_logs 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 열을 지우면 열마다 준 쓰기 권한도 함께 사라진다.
alter table public.ai_logs
  drop column if exists exclude_from_insight,
  drop column if exists share_in_presentation;
