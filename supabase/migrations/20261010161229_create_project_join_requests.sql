-- Project 에 참여하고 싶다는 요청.
-- 결정 배경은 docs/adr/0021-project-requests-and-task-details.md 에 있다.

-- 이 파일은 새 테이블만 만든다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 참여자가 아닌 Member 가 함께하고 싶다고 알린 것. 참여자나 운영자가 받아 주면 참여자가 된다.
create table if not exists public.project_join_requests (
  project_id uuid not null,
  club_id uuid not null,
  member_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (project_id, member_id),
  -- 같은 Club 의 Member 만 요청할 수 있다. Member 가 Club 에서 빠지면 요청도 사라진다.
  -- 외래 키는 적힌 순서대로 members, projects 를 잠근다. Club 을 지울 때 앱이 잠그는 순서와 같게 두어야
  -- 그 요청과 서로를 기다리다 멈추지 않는다.
  constraint project_join_requests_member_fkey foreign key (member_id, club_id)
    references public.members (id, club_id) on delete cascade,
  -- Project 가 삭제되면 요청도 함께 삭제된다.
  constraint project_join_requests_project_fkey foreign key (project_id, club_id)
    references public.projects (id, club_id) on delete cascade
);

comment on table public.project_join_requests is 'Project 에 참여하고 싶다는 요청. 받아 주면 지우고 참여자로 넣는다.';

create index if not exists project_join_requests_member_id_club_id_idx
  on public.project_join_requests (member_id, club_id);

alter table public.project_join_requests enable row level security;

-- 요청한 본인과, 그 Project 를 고칠 수 있는 사람이 본다. 다른 Member 에게는 보이지 않는다.
drop policy if exists project_join_requests_select_for_requester_or_editors on public.project_join_requests;
create policy project_join_requests_select_for_requester_or_editors on public.project_join_requests
  for select
  to authenticated
  using (
    private.can_edit_project(project_id)
    or exists (
      select 1
      from public.members as m
      where m.id = member_id
        and m.user_id = (select auth.uid())
    )
  );

-- 자기 이름으로만 요청한다. 이미 참여자인 사람은 요청할 것이 없다.
drop policy if exists project_join_requests_insert_as_self on public.project_join_requests;
create policy project_join_requests_insert_as_self on public.project_join_requests
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.members as m
      where m.id = member_id
        and m.club_id = project_join_requests.club_id
        and m.user_id = (select auth.uid())
    )
    and not private.is_project_participant(project_id)
  );

-- 요청한 본인은 거두고, 그 Project 를 고칠 수 있는 사람은 받아 주거나 거절하면서 지운다.
drop policy if exists project_join_requests_delete_for_requester_or_editors on public.project_join_requests;
create policy project_join_requests_delete_for_requester_or_editors on public.project_join_requests
  for delete
  to authenticated
  using (
    private.can_edit_project(project_id)
    or exists (
      select 1
      from public.members as m
      where m.id = member_id
        and m.user_id = (select auth.uid())
    )
  );

revoke all on table public.project_join_requests from anon, authenticated;

-- 요청은 고치지 않는다. 요청한 시각은 데이터베이스가 정한다.
grant select, delete on table public.project_join_requests to authenticated;
grant insert (project_id, club_id, member_id) on table public.project_join_requests to authenticated;
