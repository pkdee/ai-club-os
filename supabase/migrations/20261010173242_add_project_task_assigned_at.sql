-- Project 의 할 일을 언제 맡겼는지 적어 둔다. 맡게 된 것을 새 알림으로 세는 데 쓴다.
-- 결정 배경은 docs/adr/0023-notifications-names-and-revisions.md 에 있다.

-- 이 파일은 기존 테이블 가운데 project_tasks 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

alter table public.project_tasks
  add column if not exists assigned_at timestamptz;

comment on column public.project_tasks.assigned_at is '지금의 담당자에게 맡긴 시각. 데이터베이스가 정한다. 맡은 사람이 없으면 비어 있다.';

-- 맡길 때 참여자인지 확인하던 함수가 맡긴 시각도 함께 적는다.
-- 맡은 사람이 바뀔 때만 적으므로, 다른 내용을 고쳐도 맡긴 시각은 그대로다.
create or replace function private.check_project_task_assignee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.assignee_member_id is not distinct from old.assignee_member_id then
    return new;
  end if;

  if new.assignee_member_id is null then
    new.assigned_at := null;
    return new;
  end if;

  if not exists (
    select 1
    from public.project_members as pm
    where pm.project_id = new.project_id
      and pm.member_id = new.assignee_member_id
  ) then
    raise exception '이 Project 의 참여자에게만 할 일을 맡길 수 있습니다.'
      using errcode = '23514';
  end if;

  new.assigned_at := now();
  return new;
end;
$$;

revoke all on function private.check_project_task_assignee() from public;
