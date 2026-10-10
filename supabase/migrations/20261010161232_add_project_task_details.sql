-- Project 의 할 일에 담당자와 기한을 더한다.
-- 결정 배경은 docs/adr/0021-project-requests-and-task-details.md 에 있다.

-- 이 파일은 project_tasks 를 고치고, 담당자의 외래 키 때문에 members 도 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- members 를 먼저 잠근다. Club 을 지우거나 Member 가 나갈 때 앱은 members 를 잠근 뒤 project_tasks 를 잠그므로,
-- 같은 순서로 잠가야 그 요청과 서로를 기다리다 멈추지 않는다. 이 잠금은 조회를 막지 않는다.
lock table public.members in share row exclusive mode;

-- 맡은 사람. 비어 있으면 아직 맡은 사람이 없다.
alter table public.project_tasks
  add column if not exists assignee_member_id uuid;

-- 끝내기로 한 날. 시각 없이 날짜만 두고 한국 시간의 날짜로 읽는다.
alter table public.project_tasks
  add column if not exists due_on date;

comment on column public.project_tasks.assignee_member_id is '맡은 Member. 비어 있으면 맡은 사람이 없다.';
comment on column public.project_tasks.due_on is '끝내기로 한 날. 한국 시간의 날짜다.';

-- 같은 Club 의 Member 만 맡을 수 있다. Member 가 Club 에서 빠지면 맡은 사람만 비워진다.
alter table public.project_tasks
  drop constraint if exists project_tasks_assignee_fkey;
alter table public.project_tasks
  add constraint project_tasks_assignee_fkey foreign key (assignee_member_id, club_id)
    references public.members (id, club_id) on delete set null (assignee_member_id);

-- 외래 키가 쓰는 색인.
create index if not exists project_tasks_assignee_member_id_club_id_idx
  on public.project_tasks (assignee_member_id, club_id)
  where assignee_member_id is not null;

-- 그 Project 의 참여자에게만 맡길 수 있다.
-- 맡은 사람을 바꿀 때만 확인한다. 참여를 그만둔 사람이 맡았던 일은 그대로 두고 다른 내용을 고칠 수 있다.
create or replace function private.check_project_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.assignee_member_id is not null
    and (tg_op = 'INSERT' or new.assignee_member_id is distinct from old.assignee_member_id)
    and not exists (
      select 1
      from public.project_members as pm
      where pm.project_id = new.project_id
        and pm.member_id = new.assignee_member_id
    ) then
    raise exception '이 Project 의 참여자에게만 할 일을 맡길 수 있습니다.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.check_project_task_assignee() from public;

drop trigger if exists project_tasks_check_assignee on public.project_tasks;
create trigger project_tasks_check_assignee
  before insert or update of assignee_member_id on public.project_tasks
  for each row
  execute function private.check_project_task_assignee();

grant insert (assignee_member_id, due_on), update (assignee_member_id, due_on)
  on table public.project_tasks to authenticated;
