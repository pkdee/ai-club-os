-- 날짜를 정하지 않은 Session 을 받는다. 날짜가 없으면 시작과 종료 시각도 함께 비운다.
-- 결정 배경은 docs/adr/0037-session-date-undecided-and-time-picker.md 에 있다.

-- 이 파일은 기존 테이블 가운데 sessions 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 이미 비울 수 있는 열이면 아무 일도 하지 않는다.
alter table public.sessions
  alter column starts_at drop not null,
  alter column ends_at drop not null;

-- 시작과 종료는 함께 있거나 함께 비어 있다. 한쪽만 있는 회차는 받지 않는다.
-- 둘 다 있을 때의 순서는 지금처럼 sessions_time_order 가 본다. 비어 있으면 그 검사는 통과한다.
alter table public.sessions
  drop constraint if exists sessions_time_both_or_neither;
alter table public.sessions
  add constraint sessions_time_both_or_neither check ((starts_at is null) = (ends_at is null));

comment on column public.sessions.starts_at is '시작 시각. 화면에서는 한국 시간으로 보여 준다. 날짜를 정하지 않은 회차는 비어 있다.';
comment on column public.sessions.ends_at is '종료 시각. 시작 시각보다 뒤여야 한다. 시작 시각과 함께 비어 있거나 함께 있다.';
