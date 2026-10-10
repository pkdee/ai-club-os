-- Project 을 지우면 지운 기록을 남긴다.
-- 결정 배경은 docs/adr/0020-operation-rules.md 에 있다.

-- 앞 파일(create_operation_records)을 먼저 적용해야 한다. 이 파일은 기존 테이블 가운데 projects 하나만 잠근다.
-- 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

drop trigger if exists projects_log_deletion on public.projects;
create trigger projects_log_deletion
  after delete on public.projects
  for each row
  execute function private.log_deletion();
