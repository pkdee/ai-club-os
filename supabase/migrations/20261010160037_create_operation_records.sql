-- 운영 규칙에 쓰는 기록 세 가지. 참여를 막은 사람, 지운 기록, AI Insight 를 만든 횟수.
-- 결정 배경은 docs/adr/0020-operation-rules.md 에 있다.

-- 이 파일은 새 테이블과 함수만 만든다. 외래 키가 기존 테이블에 거는 잠금은 조회를 막지 않아서
-- 앱이 켜져 있는 데이터베이스에 통째로 적용해도 된다. 다시 실행해도 결과가 같다.
-- 기존 테이블에 trigger 를 다는 일은 테이블마다 다음 파일들로 나눴다.

-- ---------------------------------------------------------------------------
-- 참여를 막은 사람
-- ---------------------------------------------------------------------------

-- 운영자가 내보내면서 다시 들어오지 못하게 한 사람. 초대 링크가 있어도 참여할 수 없다.
create table if not exists public.club_bans (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null default '',
  banned_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

comment on table public.club_bans is '내보내면서 다시 들어오지 못하게 막은 사람';
comment on column public.club_bans.display_name is '막을 때 Club 안에서 쓰던 이름. Member 행이 지워진 뒤에도 누구인지 알 수 있게 옮겨 적는다.';

create index if not exists club_bans_user_id_idx on public.club_bans (user_id);
create index if not exists club_bans_banned_by_idx on public.club_bans (banned_by);

-- 막을 수 있는 사람은 지금 그 Club 의 Member 뿐이다. 이름은 Member 행에서 옮겨 적는다.
-- 운영자가 이름을 마음대로 적어 넣지 못하게 데이터베이스가 채운다.
create or replace function private.fill_club_ban()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select m.display_name
  into new.display_name
  from public.members as m
  where m.club_id = new.club_id
    and m.user_id = new.user_id;

  if not found then
    raise exception '이 Club 의 Member 만 막을 수 있습니다.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.fill_club_ban() from public;

drop trigger if exists club_bans_fill on public.club_bans;
create trigger club_bans_fill
  before insert on public.club_bans
  for each row
  execute function private.fill_club_ban();

alter table public.club_bans enable row level security;

-- 운영자만 보고, 막고, 풀어 준다. 막힌 사람 본인에게도 보이지 않는다.
drop policy if exists club_bans_select_for_admins on public.club_bans;
create policy club_bans_select_for_admins on public.club_bans
  for select
  to authenticated
  using (private.is_club_admin(club_id));

-- 자기 자신은 막을 수 없다.
drop policy if exists club_bans_insert_for_admins on public.club_bans;
create policy club_bans_insert_for_admins on public.club_bans
  for insert
  to authenticated
  with check (
    private.is_club_admin(club_id)
    and banned_by = (select auth.uid())
    and user_id <> (select auth.uid())
  );

drop policy if exists club_bans_delete_for_admins on public.club_bans;
create policy club_bans_delete_for_admins on public.club_bans
  for delete
  to authenticated
  using (private.is_club_admin(club_id));

revoke all on table public.club_bans from anon, authenticated;

-- 넣을 수 있는 열은 Club 과 사용자뿐이다. 이름과 막은 사람은 데이터베이스가 정한다.
grant select, delete on table public.club_bans to authenticated;
grant insert (club_id, user_id) on table public.club_bans to authenticated;

-- ---------------------------------------------------------------------------
-- 지운 기록
-- ---------------------------------------------------------------------------

-- 누가 언제 무엇을 지웠는지. 지운 내용은 남기지 않고 종류와 제목만 남긴다.
create table if not exists public.deletion_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  entity text not null,
  title text not null default '',
  owner_name text,
  deleted_by uuid references auth.users (id) on delete set null,
  deleted_by_name text not null default '',
  created_at timestamptz not null default now(),
  constraint deletion_logs_entity_check check (entity in ('ai_log', 'session', 'project', 'ai_insight'))
);

comment on table public.deletion_logs is '누가 언제 무엇을 지웠는지 남기는 기록. 지운 내용은 담지 않는다.';
comment on column public.deletion_logs.entity is 'ai_log, session, project, ai_insight 가운데 하나';
comment on column public.deletion_logs.title is '지운 것의 제목. AI Insight 는 정리한 회차의 제목이나 달이다.';
comment on column public.deletion_logs.owner_name is '지운 AI Log 의 작성자 이름. 다른 종류에서는 비어 있다.';
comment on column public.deletion_logs.deleted_by_name is '지운 사람이 그때 Club 안에서 쓰던 이름';

create index if not exists deletion_logs_club_id_created_at_idx on public.deletion_logs (club_id, created_at desc);
create index if not exists deletion_logs_deleted_by_idx on public.deletion_logs (deleted_by);

-- 지운 것을 기록으로 남긴다. ai_logs, sessions, projects, ai_insights 의 trigger 가 함께 쓴다.
-- 앱이 아니라 데이터베이스가 적으므로 지운 사람이 기록을 건너뛰거나 꾸며 넣을 수 없다.
create or replace function private.log_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  entity_name text;
  entity_title text;
  entity_owner text;
begin
  -- Club 이 통째로 지워지는 중이면 기록을 남길 곳이 없다.
  if not exists (select 1 from public.clubs where id = old.club_id) then
    return null;
  end if;

  if tg_table_name = 'ai_logs' then
    entity_name := 'ai_log';
    entity_title := old.title;
    select m.display_name
    into entity_owner
    from public.members as m
    where m.club_id = old.club_id
      and m.user_id = old.author_id;
  elsif tg_table_name = 'sessions' then
    entity_name := 'session';
    entity_title := old.title;
  elsif tg_table_name = 'projects' then
    entity_name := 'project';
    entity_title := old.name;
  elsif tg_table_name = 'ai_insights' then
    entity_name := 'ai_insight';
    if old.session_id is not null then
      select s.title into entity_title from public.sessions as s where s.id = old.session_id;
      -- Session 을 지우면서 함께 지워진 것은 남기지 않는다. 그때는 Session 을 지운 기록 하나로 충분하다.
      if not found then
        return null;
      end if;
    else
      entity_title := to_char(old.period_start at time zone 'Asia/Seoul', 'YYYY"년" FMMM"월"');
    end if;
  else
    return null;
  end if;

  insert into public.deletion_logs (club_id, entity, title, owner_name, deleted_by, deleted_by_name)
  values (
    old.club_id,
    entity_name,
    coalesce(entity_title, ''),
    entity_owner,
    actor,
    coalesce(
      (
        select m.display_name
        from public.members as m
        where m.club_id = old.club_id
          and m.user_id = actor
      ),
      ''
    )
  );
  return null;
end;
$$;

revoke all on function private.log_deletion() from public;

alter table public.deletion_logs enable row level security;

-- 운영자만 본다. 넣고 고치고 지우는 권한은 아무에게도 주지 않는다.
drop policy if exists deletion_logs_select_for_admins on public.deletion_logs;
create policy deletion_logs_select_for_admins on public.deletion_logs
  for select
  to authenticated
  using (private.is_club_admin(club_id));

revoke all on table public.deletion_logs from anon, authenticated;
grant select on table public.deletion_logs to authenticated;

-- ---------------------------------------------------------------------------
-- AI Insight 를 만든 횟수
-- ---------------------------------------------------------------------------

-- AI 를 부를 때마다 한 줄을 남긴다. 실패한 시도도 비용이 들 수 있어 함께 센다.
create table if not exists public.ai_insight_runs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.ai_insight_runs is 'AI Insight 를 만들려고 AI 를 부른 기록. 하루 횟수를 세는 데 쓴다.';

create index if not exists ai_insight_runs_club_id_created_at_idx on public.ai_insight_runs (club_id, created_at desc);
create index if not exists ai_insight_runs_created_by_idx on public.ai_insight_runs (created_by);

-- 한 Club 이 하루에 만들 수 있는 횟수. 앱의 INSIGHT_DAILY_LIMIT 과 같은 값이어야 한다.
create or replace function private.ai_insight_daily_limit()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 10
$$;

revoke all on function private.ai_insight_daily_limit() from public;

-- 하루는 한국 시간의 날짜로 나눈다. 횟수를 다 썼으면 줄을 넣지 못하게 막는다.
-- 동시에 들어온 요청이 서로를 지나치지 않도록 세기 전에 그 Club 의 행을 잠근다.
create or replace function private.check_ai_insight_run_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  day_start timestamptz := date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
begin
  perform 1 from public.clubs where id = new.club_id for update;

  if (
    select count(*)
    from public.ai_insight_runs as r
    where r.club_id = new.club_id
      and r.created_at >= day_start
  ) >= private.ai_insight_daily_limit() then
    raise exception '오늘 만들 수 있는 AI Insight 횟수를 다 썼습니다.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.check_ai_insight_run_limit() from public;

drop trigger if exists ai_insight_runs_check_limit on public.ai_insight_runs;
create trigger ai_insight_runs_check_limit
  before insert on public.ai_insight_runs
  for each row
  execute function private.check_ai_insight_run_limit();

alter table public.ai_insight_runs enable row level security;

-- AI Insight 는 운영자만 만들므로 횟수도 운영자만 보고 남긴다.
drop policy if exists ai_insight_runs_select_for_admins on public.ai_insight_runs;
create policy ai_insight_runs_select_for_admins on public.ai_insight_runs
  for select
  to authenticated
  using (private.is_club_admin(club_id));

drop policy if exists ai_insight_runs_insert_for_admins on public.ai_insight_runs;
create policy ai_insight_runs_insert_for_admins on public.ai_insight_runs
  for insert
  to authenticated
  with check (
    private.is_club_admin(club_id)
    and created_by = (select auth.uid())
  );

revoke all on table public.ai_insight_runs from anon, authenticated;

-- 넣을 수 있는 열은 Club 뿐이다. 지울 수 없어서 횟수를 되돌리지 못한다.
grant select on table public.ai_insight_runs to authenticated;
grant insert (club_id) on table public.ai_insight_runs to authenticated;
