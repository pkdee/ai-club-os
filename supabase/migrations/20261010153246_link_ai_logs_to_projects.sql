-- AI Log 를 Project 에 묶는다.
-- 결정 배경은 docs/adr/0019-project-structure-and-participants.md 에 있다.

-- 앞 파일(create_projects)을 먼저 적용해야 한다. 이 파일은 기존 테이블 가운데 ai_logs 하나만 잠근다.
-- 다시 실행해도 결과가 같다.

-- AI Log 하나는 Project 하나에만 속한다. 비어 있으면 어느 Project 에도 속하지 않는다.
-- 같은 Club 의 Project 만 가리킬 수 있고, Project 가 삭제되면 기록은 남고 연결만 비워진다.
alter table public.ai_logs
  add column if not exists project_id uuid;

alter table public.ai_logs
  drop constraint if exists ai_logs_project_fkey;
alter table public.ai_logs
  add constraint ai_logs_project_fkey foreign key (project_id, club_id)
    references public.projects (id, club_id) on delete set null (project_id);

comment on column public.ai_logs.project_id is '기록이 속한 Project. 비어 있으면 어느 Project 에도 속하지 않는다.';

-- 외래 키와 Project 별 목록이 쓰는 색인.
create index if not exists ai_logs_project_id_club_id_idx on public.ai_logs (project_id, club_id)
  where project_id is not null;

-- 작성자는 자기가 참여하는 Project 에만 기록을 묶는다.
-- 묶는 Project 를 바꿀 때만 확인한다. 참여를 그만둔 뒤에도 이미 묶어 둔 기록의 다른 내용은 고칠 수 있다.
create or replace function private.check_ai_log_project()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.project_id is not null
    and (tg_op = 'INSERT' or new.project_id is distinct from old.project_id)
    and not private.is_project_participant(new.project_id) then
    raise exception '참여하는 Project 에만 AI Log 를 묶을 수 있습니다.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.check_ai_log_project() from public;

drop trigger if exists ai_logs_check_project on public.ai_logs;
create trigger ai_logs_check_project
  before insert or update of project_id on public.ai_logs
  for each row
  execute function private.check_ai_log_project();

grant insert (project_id), update (project_id) on table public.ai_logs to authenticated;
