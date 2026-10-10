-- Session 에 시간표를 더한다.
-- 결정 배경은 docs/adr/0023-notifications-names-and-revisions.md 에 있다.

-- 이 파일은 기존 테이블 가운데 sessions 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 한 줄에 하나씩 적는 글이다. 줄 앞에 시각이 있으면 화면이 그 시각을 따로 보여 준다.
-- 표로 나누지 않고 글 그대로 두어서 운영자가 한 칸에서 쉽게 고칠 수 있게 했다.
alter table public.sessions
  add column if not exists agenda text not null default '';

alter table public.sessions
  drop constraint if exists sessions_agenda_length;
alter table public.sessions
  add constraint sessions_agenda_length check (char_length(agenda) <= 2000);

comment on column public.sessions.agenda is '시간표. 한 줄에 하나씩 적고, 줄 앞의 시각(예: 19:00)은 화면이 따로 보여 준다.';

-- 고칠 수 있는 사람은 지금처럼 운영자뿐이다.
grant insert (agenda), update (agenda) on table public.sessions to authenticated;
