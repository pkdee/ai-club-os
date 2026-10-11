-- 회고. Project, Session, 한 달을 사람마다 하나씩 돌아보는 글이다.
-- 결정 배경은 docs/adr/0024-retrospectives.md 에 있다.

-- 이 파일은 새 테이블과 함수만 만든다. 다시 실행해도 결과가 같다.
-- 외래 키를 걸면서 clubs, members, sessions, projects 를 잠깐 잠근다.
-- 앱이 Club 을 지울 때 잠그는 순서(members, sessions, projects)와 같게 적었다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

-- scope 가 무엇을 돌아보는지 정한다.
--   project: Project 하나. project_id 가 있다.
--   session: 회차 하나. session_id 가 있다.
--   month:   한 달 동안의 내 활동. period_start 가 그 달의 첫날이다. 달은 한국 시간으로 나눈다.
create table if not exists public.retrospectives (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  scope text not null,
  session_id uuid,
  project_id uuid,
  period_start date,
  author_id uuid default auth.uid(),
  went_well text not null default '',
  to_improve text not null default '',
  to_try text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint retrospectives_scope_check check (scope in ('project', 'session', 'month')),
  -- 돌아보는 대상은 scope 에 맞는 것 하나만 적는다.
  constraint retrospectives_target_check check (
    (scope = 'project' and project_id is not null and session_id is null and period_start is null)
    or (scope = 'session' and session_id is not null and project_id is null and period_start is null)
    or (scope = 'month' and period_start is not null and project_id is null and session_id is null)
  ),
  constraint retrospectives_period_start_check check (
    period_start is null or extract(day from period_start) = 1
  ),
  constraint retrospectives_went_well_length check (char_length(went_well) <= 2000),
  constraint retrospectives_to_improve_length check (char_length(to_improve) <= 2000),
  constraint retrospectives_to_try_length check (char_length(to_try) <= 2000),
  -- 세 칸 가운데 하나는 적어야 한다. 공백과 줄바꿈만 있는 것은 적은 것으로 치지 않는다.
  constraint retrospectives_not_empty check ((went_well || to_improve || to_try) ~ '\S'),
  constraint retrospectives_club_fkey foreign key (club_id)
    references public.clubs (id) on delete cascade,
  -- 작성자는 그 Club 의 Member 여야 한다. Member 가 빠지면 회고는 작성자 없이 남는다. AI Log 와 같은 규칙이다.
  constraint retrospectives_author_fkey foreign key (club_id, author_id)
    references public.members (club_id, user_id) on delete set null (author_id),
  -- 대상은 같은 Club 의 것이어야 한다. 대상을 지우면 그 회고도 함께 지운다.
  constraint retrospectives_session_fkey foreign key (session_id, club_id)
    references public.sessions (id, club_id) on delete cascade,
  constraint retrospectives_project_fkey foreign key (project_id, club_id)
    references public.projects (id, club_id) on delete cascade
);

comment on table public.retrospectives is 'Project, Session, 한 달을 돌아보는 글. 한 사람이 한 대상에 하나를 쓴다.';
comment on column public.retrospectives.scope is 'project, session, month 가운데 하나';
comment on column public.retrospectives.period_start is '한 달 회고일 때 그 달의 첫날. 달은 한국 시간으로 나눈다.';
comment on column public.retrospectives.author_id is '작성자. Member 가 Club 에서 빠지면 비운다.';
comment on column public.retrospectives.went_well is '좋았던 것';
comment on column public.retrospectives.to_improve is '아쉬운 것';
comment on column public.retrospectives.to_try is '다음에 해 볼 것';

-- 한 사람이 한 대상에 하나만 쓴다. 작성자가 비워진 회고는 여러 개가 남을 수 있다.
create unique index if not exists retrospectives_project_author_key
  on public.retrospectives (project_id, author_id) where scope = 'project';
create unique index if not exists retrospectives_session_author_key
  on public.retrospectives (session_id, author_id) where scope = 'session';
create unique index if not exists retrospectives_month_author_key
  on public.retrospectives (club_id, author_id, period_start) where scope = 'month';

-- Club 의 회고를 최신순으로 읽는 색인. club_id 외래 키의 색인도 겸한다.
create index if not exists retrospectives_club_id_created_at_idx
  on public.retrospectives (club_id, created_at desc);
-- 작성자 외래 키와 한 사람의 회고를 읽는 데 쓰는 색인.
create index if not exists retrospectives_club_id_author_id_idx
  on public.retrospectives (club_id, author_id);

-- ---------------------------------------------------------------------------
-- 쓸 수 있는 때
-- ---------------------------------------------------------------------------

-- 아직 시작하지 않은 Session 과 아직 오지 않은 달은 돌아볼 것이 없다.
-- sessions 를 읽어야 해서 만든 사람의 권한으로 실행한다.
create or replace function private.check_retrospective_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.scope = 'session' then
    if not exists (
      select 1
      from public.sessions as s
      where s.id = new.session_id
        and s.club_id = new.club_id
        and s.starts_at <= now()
    ) then
      raise exception '아직 시작하지 않은 Session 에는 회고를 쓸 수 없습니다.'
        using errcode = '23514';
    end if;
  elsif new.scope = 'month' then
    if new.period_start > date_trunc('month', now() at time zone 'Asia/Seoul')::date then
      raise exception '아직 오지 않은 달의 회고는 쓸 수 없습니다.'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.check_retrospective_target() from public;

drop trigger if exists retrospectives_check_target on public.retrospectives;
create trigger retrospectives_check_target
  before insert on public.retrospectives
  for each row
  execute function private.check_retrospective_target();

-- 내용을 실제로 고쳤을 때만 고친 시각을 바꾼다.
drop trigger if exists retrospectives_set_updated_at on public.retrospectives;
create trigger retrospectives_set_updated_at
  before update of went_well, to_improve, to_try on public.retrospectives
  for each row
  when (
    (old.went_well, old.to_improve, old.to_try)
      is distinct from (new.went_well, new.to_improve, new.to_try)
  )
  execute function private.set_updated_at();

-- 회고를 지우면 지운 기록을 남긴다. 함수는 이미 있는 것을 쓴다.
-- 다음 파일(log_and_expire_deletions)이 그 함수를 회고를 아는 것으로 바꾸기 전에는 아무것도 남기지 않는다.
-- trigger 를 여기서 거는 것은 이 테이블이 아직 아무에게도 보이지 않아 잠금을 기다릴 일이 없기 때문이다.
drop trigger if exists retrospectives_log_deletion on public.retrospectives;
create trigger retrospectives_log_deletion
  after delete on public.retrospectives
  for each row
  execute function private.log_deletion();

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

alter table public.retrospectives enable row level security;

-- Club 의 Member 는 그 Club 의 회고를 모두 본다. 세 가지 모두 그렇다.
drop policy if exists retrospectives_select_for_members on public.retrospectives;
create policy retrospectives_select_for_members on public.retrospectives
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- Member 는 자기 이름으로만 쓴다. Project 회고는 그 Project 의 참여자만 쓴다.
drop policy if exists retrospectives_insert_as_author on public.retrospectives;
create policy retrospectives_insert_as_author on public.retrospectives
  for insert
  to authenticated
  with check (
    private.is_club_member(club_id)
    and author_id = (select auth.uid())
    and (scope <> 'project' or private.is_project_participant(project_id))
  );

-- 작성자 본인만 고친다. Club 에서 빠진 뒤에는 고칠 수 없다.
drop policy if exists retrospectives_update_by_author on public.retrospectives;
create policy retrospectives_update_by_author on public.retrospectives
  for update
  to authenticated
  using (
    author_id = (select auth.uid())
    and private.is_club_member(club_id)
  )
  with check (
    author_id = (select auth.uid())
    and private.is_club_member(club_id)
  );

-- 작성자 본인과 운영자가 지운다. 작성자가 빠진 회고는 운영자만 지운다.
drop policy if exists retrospectives_delete_by_author_or_admin on public.retrospectives;
create policy retrospectives_delete_by_author_or_admin on public.retrospectives
  for delete
  to authenticated
  using (
    (
      author_id = (select auth.uid())
      and private.is_club_member(club_id)
    )
    or private.is_club_admin(club_id)
  );

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

revoke all on table public.retrospectives from anon, authenticated;

-- 대상과 작성자는 고칠 수 없다. 작성자는 만들 때 로그인한 사용자로 정해진다.
grant select, delete on table public.retrospectives to authenticated;
grant insert (club_id, scope, session_id, project_id, period_start, went_well, to_improve, to_try)
  on table public.retrospectives to authenticated;
grant update (went_well, to_improve, to_try)
  on table public.retrospectives to authenticated;
