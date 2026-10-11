-- 지운 기록을 1년 동안만 두고, 회고를 지운 것도 지운 기록에 남긴다.
-- 결정 배경은 docs/adr/0025-retention-and-ownerless-rules.md 와 docs/adr/0024-retrospectives.md 에 있다.

-- 앞 파일(create_retrospectives)을 먼저 적용해야 한다. 회고를 지울 때 이 파일의 함수를 부르는 trigger 는 그 파일에 있다.
-- 이 파일은 deletion_logs 하나만 잠근다. 다시 실행해도 결과가 같다.
-- 다른 테이블을 함께 잠그면, 무언가를 지우면서 지운 기록을 남기려는 앱의 요청과 서로를 기다리게 된다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 지운 기록을 두는 날수. 앱의 DELETION_LOG_DAYS 와 같은 값이어야 한다.
create or replace function private.deletion_log_days()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 365
$$;

revoke all on function private.deletion_log_days() from public;
grant execute on function private.deletion_log_days() to authenticated;

-- 회고도 지운 기록에 남길 수 있게 종류를 더한다.
alter table public.deletion_logs
  drop constraint if exists deletion_logs_entity_check;
alter table public.deletion_logs
  add constraint deletion_logs_entity_check
  check (entity in ('ai_log', 'session', 'project', 'ai_insight', 'retrospective'));

comment on column public.deletion_logs.entity is 'ai_log, session, project, ai_insight, retrospective 가운데 하나';
comment on column public.deletion_logs.title is '지운 것의 제목. AI Insight 는 정리한 회차의 제목이나 달, 회고는 돌아본 Project 나 회차의 이름이나 달이다.';
comment on column public.deletion_logs.owner_name is '지운 AI Log 나 회고의 작성자 이름. 다른 종류에서는 비어 있다.';

-- 운영자만 보고, 기간이 지난 것은 지워지기 전이라도 보이지 않는다.
drop policy if exists deletion_logs_select_for_admins on public.deletion_logs;
create policy deletion_logs_select_for_admins on public.deletion_logs
  for select
  to authenticated
  using (
    private.is_club_admin(club_id)
    and created_at > now() - make_interval(days => private.deletion_log_days())
  );

-- 지운 것을 기록으로 남긴다. ai_logs, sessions, projects, ai_insights, retrospectives 의 trigger 가 함께 쓴다.
-- 앱이 아니라 데이터베이스가 적으므로 지운 사람이 기록을 건너뛰거나 꾸며 넣을 수 없다.
-- 남길 때마다 그 Club 의 기간이 지난 기록을 지운다. 따로 도는 청소 작업을 두지 않으려는 것이다.
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
  elsif tg_table_name = 'retrospectives' then
    entity_name := 'retrospective';
    -- Project 나 Session 을 지우면서 함께 지워진 회고는 남기지 않는다. 그것을 지운 기록 하나로 충분하다.
    if old.scope = 'project' then
      select p.name into entity_title from public.projects as p where p.id = old.project_id;
      if not found then
        return null;
      end if;
    elsif old.scope = 'session' then
      select s.title into entity_title from public.sessions as s where s.id = old.session_id;
      if not found then
        return null;
      end if;
    else
      entity_title := to_char(old.period_start, 'YYYY"년" FMMM"월"');
    end if;
    select m.display_name
    into entity_owner
    from public.members as m
    where m.club_id = old.club_id
      and m.user_id = old.author_id;
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

  delete from public.deletion_logs as d
  where d.club_id = old.club_id
    and d.created_at <= now() - make_interval(days => private.deletion_log_days());
  return null;
end;
$$;

revoke all on function private.log_deletion() from public;
