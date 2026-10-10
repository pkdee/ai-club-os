-- Project 의 구조와 접근 규칙.
-- 결정 배경은 docs/adr/0019-project-structure-and-participants.md 에 있다.

-- Project 는 여러 AI Log 와 할 일, 결과물 링크를 하나의 결과물로 묶는다.
-- Member 는 누구나 만들고, 그 Project 의 참여자와 운영자가 고친다. 지우는 것은 만든 사람과 운영자다.

-- 앱이 켜져 있는 데이터베이스에 손으로 적용할 때는 아래 두 묶음을 하나씩 따로 실행한다.
-- 묶음 1 은 새 테이블만 만들어서 앱의 조회와 부딪히지 않는다.
-- 묶음 2 는 ai_logs 하나만 잠근다. 묶음 1 과 한 번에 실행하면 여러 테이블을 함께 잠그게 되어
-- 앱의 조회와 서로를 기다리다 멈출 수 있다(deadlock, 40P01).

-- ===========================================================================
-- 묶음 1. Project 와 참여자, 결과물 링크, 할 일
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  goal text not null default '',
  status text not null default 'planning',
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint projects_goal_length check (char_length(goal) <= 2000),
  constraint projects_status_check check (status in ('planning', 'active', 'done')),
  -- 다른 테이블이 같은 Club 의 Project 만 가리키도록 묶어서 참조할 때 쓴다.
  constraint projects_id_club_id_key unique (id, club_id)
);

comment on table public.projects is '여러 AI Log 와 할 일, 결과물 링크를 하나로 묶는 결과물';
comment on column public.projects.goal is '무엇을 만들려는지 적은 글';
comment on column public.projects.status is 'planning 은 준비, active 는 진행 중, done 은 완료';

-- Club 의 Project 를 최신순으로 읽는 색인. club_id 외래 키의 색인도 겸한다.
create index projects_club_id_created_at_idx on public.projects (club_id, created_at desc);
create index projects_created_by_idx on public.projects (created_by);

create trigger projects_set_updated_at
  before update of name, goal, status on public.projects
  for each row
  when (old.* is distinct from new.*)
  execute function private.set_updated_at();

-- Project 에 참여하는 Member. 참여자는 그 Project 를 고칠 수 있다.
create table public.project_members (
  project_id uuid not null,
  club_id uuid not null,
  member_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (project_id, member_id),
  -- Project 가 삭제되면 함께 삭제된다.
  constraint project_members_project_fkey foreign key (project_id, club_id)
    references public.projects (id, club_id) on delete cascade,
  -- 같은 Club 의 Member 만 참여할 수 있다. Member 가 Club 에서 빠지면 참여도 끝난다.
  constraint project_members_member_fkey foreign key (member_id, club_id)
    references public.members (id, club_id) on delete cascade
);

comment on table public.project_members is 'Project 에 참여하는 Member';

create index project_members_member_id_club_id_idx on public.project_members (member_id, club_id);

-- Project 의 결과물로 가는 주소. 저장소, 발표 자료, 데모 같은 것을 둔다.
create table public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  club_id uuid not null,
  label text not null,
  url text not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint project_links_label_length check (char_length(btrim(label)) between 1 and 60),
  -- http 와 https 주소만 받는다. 누르면 실행되는 다른 모양의 주소를 막는다.
  constraint project_links_url_check check (
    url ~ '^https?://[^[:space:]]+$'
    and char_length(url) <= 500
  ),
  constraint project_links_project_fkey foreign key (project_id, club_id)
    references public.projects (id, club_id) on delete cascade
);

comment on table public.project_links is 'Project 의 결과물로 가는 주소';

create index project_links_project_id_created_at_idx on public.project_links (project_id, created_at);
create index project_links_created_by_idx on public.project_links (created_by);

-- Project 안의 할 일.
create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  club_id uuid not null,
  title text not null,
  done boolean not null default false,
  done_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint project_tasks_title_length check (char_length(btrim(title)) between 1 and 120),
  constraint project_tasks_project_fkey foreign key (project_id, club_id)
    references public.projects (id, club_id) on delete cascade
);

comment on table public.project_tasks is 'Project 안의 할 일';
comment on column public.project_tasks.done_at is '끝냈다고 표시한 시각. 데이터베이스가 정한다.';

create index project_tasks_project_id_created_at_idx on public.project_tasks (project_id, created_at);
create index project_tasks_created_by_idx on public.project_tasks (created_by);

-- 끝낸 시각은 데이터베이스가 정한다. 끝냈다고 표시하면 그 시각을 적고, 되돌리면 비운다.
create function private.set_project_task_done_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.done and not old.done then
    new.done_at = now();
  elsif not new.done then
    new.done_at = null;
  end if;
  return new;
end;
$$;

revoke all on function private.set_project_task_done_at() from public;

create trigger project_tasks_set_done_at
  before update of done on public.project_tasks
  for each row
  execute function private.set_project_task_done_at();

-- ---------------------------------------------------------------------------
-- 접근 규칙에 쓰는 함수
-- ---------------------------------------------------------------------------

-- 지금 로그인한 사용자가 그 Project 의 참여자인지 확인한다.
-- project_members 의 접근 규칙이 project_members 를 다시 읽으면 무한 반복이 되므로 security definer 로 둔다.
create function private.is_project_participant(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members as pm
    join public.members as m on m.id = pm.member_id
    where pm.project_id = target_project_id
      and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_project_participant(uuid) from public;
grant execute on function private.is_project_participant(uuid) to authenticated;

-- 지금 로그인한 사용자가 그 Project 를 고칠 수 있는지 확인한다. 참여자이거나 그 Club 의 운영자다.
create function private.can_edit_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_project_participant(target_project_id)
    or exists (
      select 1
      from public.projects as p
      where p.id = target_project_id
        and private.is_club_admin(p.club_id)
    );
$$;

revoke all on function private.can_edit_project(uuid) from public;
grant execute on function private.can_edit_project(uuid) to authenticated;

-- Project 를 만든 사람을 첫 참여자로 넣는다.
-- created_by 는 아래 insert 규칙이 로그인한 사용자와 같은 값으로 강제한다.
create function private.add_project_creator_as_participant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_members (project_id, club_id, member_id)
  select new.id, new.club_id, m.id
  from public.members as m
  where m.club_id = new.club_id
    and m.user_id = new.created_by;
  return null;
end;
$$;

revoke all on function private.add_project_creator_as_participant() from public;

create trigger projects_add_creator_as_participant
  after insert on public.projects
  for each row
  execute function private.add_project_creator_as_participant();

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_links enable row level security;
alter table public.project_tasks enable row level security;

-- Club 의 Member 는 그 Club 의 Project 를 모두 본다.
create policy projects_select_for_members on public.projects
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- Member 는 누구나 자기 이름으로 Project 를 만든다.
create policy projects_insert_as_creator on public.projects
  for insert
  to authenticated
  with check (
    private.is_club_member(club_id)
    and created_by = (select auth.uid())
  );

-- 참여자와 운영자가 고친다.
create policy projects_update_for_editors on public.projects
  for update
  to authenticated
  using (private.can_edit_project(id))
  with check (private.can_edit_project(id));

-- 만든 사람과 운영자가 지운다. 참여자라도 만든 사람이 아니면 지우지 못한다.
create policy projects_delete_for_creator_or_admin on public.projects
  for delete
  to authenticated
  using (
    private.is_club_admin(club_id)
    or (
      created_by = (select auth.uid())
      and private.is_club_member(club_id)
    )
  );

create policy project_members_select_for_members on public.project_members
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- 참여자와 운영자가 다른 Member 를 참여자로 넣는다. 스스로 끼어들 수는 없다.
create policy project_members_insert_for_editors on public.project_members
  for insert
  to authenticated
  with check (private.can_edit_project(project_id));

-- 참여자와 운영자가 참여자를 빼고, 누구나 스스로 빠질 수 있다.
create policy project_members_delete_for_editors_or_self on public.project_members
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

create policy project_links_select_for_members on public.project_links
  for select
  to authenticated
  using (private.is_club_member(club_id));

create policy project_links_insert_for_editors on public.project_links
  for insert
  to authenticated
  with check (
    private.can_edit_project(project_id)
    and created_by = (select auth.uid())
  );

create policy project_links_delete_for_editors on public.project_links
  for delete
  to authenticated
  using (private.can_edit_project(project_id));

create policy project_tasks_select_for_members on public.project_tasks
  for select
  to authenticated
  using (private.is_club_member(club_id));

create policy project_tasks_insert_for_editors on public.project_tasks
  for insert
  to authenticated
  with check (
    private.can_edit_project(project_id)
    and created_by = (select auth.uid())
  );

create policy project_tasks_update_for_editors on public.project_tasks
  for update
  to authenticated
  using (private.can_edit_project(project_id))
  with check (private.can_edit_project(project_id));

create policy project_tasks_delete_for_editors on public.project_tasks
  for delete
  to authenticated
  using (private.can_edit_project(project_id));

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

revoke all on table public.projects from anon, authenticated;
revoke all on table public.project_members from anon, authenticated;
revoke all on table public.project_links from anon, authenticated;
revoke all on table public.project_tasks from anon, authenticated;

-- 만든 사람과 진행 상태는 넣을 수 없다. 만들면 로그인한 사용자의 준비 상태 Project 가 된다.
-- Project 를 다른 Club 으로 옮길 수 없다.
grant select, delete on table public.projects to authenticated;
grant insert (club_id, name, goal) on table public.projects to authenticated;
grant update (name, goal, status) on table public.projects to authenticated;

grant select, delete on table public.project_members to authenticated;
grant insert (project_id, club_id, member_id) on table public.project_members to authenticated;

-- 링크는 고치지 않는다. 바꾸려면 지우고 다시 넣는다.
grant select, delete on table public.project_links to authenticated;
grant insert (project_id, club_id, label, url) on table public.project_links to authenticated;

-- 끝낸 시각은 넣거나 고칠 수 없다.
grant select, delete on table public.project_tasks to authenticated;
grant insert (project_id, club_id, title) on table public.project_tasks to authenticated;
grant update (title, done) on table public.project_tasks to authenticated;

-- ===========================================================================
-- 묶음 2. AI Log 를 Project 에 묶기
-- ===========================================================================

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
