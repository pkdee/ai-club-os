-- AI Log 에 작성자가 정하는 선택 두 가지를 더하고, 지운 기록을 남긴다.
-- 결정 배경은 docs/adr/0020-operation-rules.md 와 docs/adr/0022-web-presentation-by-link.md 에 있다.

-- 앞 파일(create_operation_records)을 먼저 적용해야 한다. 이 파일은 기존 테이블 가운데 ai_logs 하나만 잠근다.
-- 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- AI Insight 를 만들 때 이 기록을 AI 로 보내지 않는다.
alter table public.ai_logs
  add column if not exists exclude_from_insight boolean not null default false;

-- Project 의 발표에 이 기록을 넣어도 된다. 켜 두어야 Club 밖에서 볼 수 있다.
alter table public.ai_logs
  add column if not exists share_in_presentation boolean not null default false;

comment on column public.ai_logs.exclude_from_insight is '켜면 AI Insight 를 만들 때 이 기록을 AI 로 보내지 않는다. 작성자가 정한다.';
comment on column public.ai_logs.share_in_presentation is '켜면 이 기록이 묶인 Project 의 발표에 들어간다. 작성자가 정하고 기본은 꺼짐이다.';

-- 고칠 수 있는 사람은 지금처럼 작성자뿐이다.
grant insert (exclude_from_insight, share_in_presentation),
  update (exclude_from_insight, share_in_presentation)
  on table public.ai_logs to authenticated;

drop trigger if exists ai_logs_log_deletion on public.ai_logs;
create trigger ai_logs_log_deletion
  after delete on public.ai_logs
  for each row
  execute function private.log_deletion();
