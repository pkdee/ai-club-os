-- Session 에서 다룰 Project 를 직접 잇는다.
-- 결정 배경은 docs/adr/0021-project-requests-and-task-details.md 에 있다.

-- 이 파일은 새 테이블만 만든다. 다시 실행해도 결과가 같다.
-- 외래 키를 걸면서 clubs, sessions, projects 를 잠깐 잠근다. 앱이 Club 을 지울 때 잠그는 순서와 같게 적었다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 줄이 있으면 이어진 것이다. 끊으면 줄을 지운다.
create table if not exists public.session_projects (
  session_id uuid not null,
  project_id uuid not null,
  club_id uuid not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (session_id, project_id),
  constraint session_projects_club_fkey foreign key (club_id)
    references public.clubs (id) on delete cascade,
  -- 둘 다 같은 Club 의 것이어야 한다. 어느 한쪽을 지우면 이어진 줄도 지운다.
  constraint session_projects_session_fkey foreign key (session_id, club_id)
    references public.sessions (id, club_id) on delete cascade,
  constraint session_projects_project_fkey foreign key (project_id, club_id)
    references public.projects (id, club_id) on delete cascade,
  constraint session_projects_created_by_fkey foreign key (created_by)
    references auth.users (id) on delete set null
);

comment on table public.session_projects is 'Session 에서 다루기로 한 Project';

create index if not exists session_projects_project_id_idx on public.session_projects (project_id);
create index if not exists session_projects_club_id_idx on public.session_projects (club_id);
create index if not exists session_projects_created_by_idx on public.session_projects (created_by);

alter table public.session_projects enable row level security;

-- Club 의 Member 는 모두 본다.
drop policy if exists session_projects_select_for_members on public.session_projects;
create policy session_projects_select_for_members on public.session_projects
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- 운영자는 어느 Project 든 잇고, Project 의 참여자는 자기 Project 를 잇는다.
drop policy if exists session_projects_insert_for_admin_or_participant on public.session_projects;
create policy session_projects_insert_for_admin_or_participant on public.session_projects
  for insert
  to authenticated
  with check (
    private.is_club_admin(club_id)
    or (
      private.is_club_member(club_id)
      and private.is_project_participant(project_id)
    )
  );

-- 끊는 것도 같은 사람이 한다.
drop policy if exists session_projects_delete_for_admin_or_participant on public.session_projects;
create policy session_projects_delete_for_admin_or_participant on public.session_projects
  for delete
  to authenticated
  using (
    private.is_club_admin(club_id)
    or (
      private.is_club_member(club_id)
      and private.is_project_participant(project_id)
    )
  );

revoke all on table public.session_projects from anon, authenticated;

-- 고치는 권한은 주지 않는다. 잇거나 끊을 뿐이다.
grant select, delete on table public.session_projects to authenticated;
grant insert (session_id, project_id, club_id) on table public.session_projects to authenticated;
