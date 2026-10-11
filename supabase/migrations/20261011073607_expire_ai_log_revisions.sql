-- AI Log 의 수정 기록을 90일 동안만 둔다.
-- 결정 배경은 docs/adr/0025-retention-and-ownerless-rules.md 에 있다.

-- 이 파일은 기존 테이블 가운데 ai_log_revisions 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 수정 기록을 두는 날수. 앱의 AI_LOG_REVISION_DAYS 와 같은 값이어야 한다.
create or replace function private.ai_log_revision_days()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 90
$$;

revoke all on function private.ai_log_revision_days() from public;
grant execute on function private.ai_log_revision_days() to authenticated;

-- 그 기록의 작성자와 운영자만 보고, 기간이 지난 것은 지워지기 전이라도 보이지 않는다.
drop policy if exists ai_log_revisions_select_for_author_or_admin on public.ai_log_revisions;
create policy ai_log_revisions_select_for_author_or_admin on public.ai_log_revisions
  for select
  to authenticated
  using (
    replaced_at > now() - make_interval(days => private.ai_log_revision_days())
    and (
      private.is_club_admin(club_id)
      or exists (
        select 1
        from public.ai_logs as l
        where l.id = log_id
          and l.author_id = (select auth.uid())
      )
    )
  );

-- 고치기 전의 내용을 남긴다. ai_logs 의 trigger 가 쓴다.
-- 남길 때마다 그 기록의 오래된 것(최근 20개 밖)과 그 Club 의 기간이 지난 것을 지운다.
create or replace function private.keep_ai_log_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.ai_log_revisions (
    club_id, log_id, title, tools, attempt, result, learned, next_action, replaced_by
  )
  values (
    old.club_id, old.id, old.title, old.tools, old.attempt, old.result, old.learned, old.next_action,
    (select auth.uid())
  );

  delete from public.ai_log_revisions as r
  where r.log_id = old.id
    and r.id not in (
      select kept.id
      from public.ai_log_revisions as kept
      where kept.log_id = old.id
      order by kept.replaced_at desc, kept.id desc
      limit private.ai_log_revision_limit()
    );

  delete from public.ai_log_revisions as r
  where r.club_id = old.club_id
    and r.replaced_at <= now() - make_interval(days => private.ai_log_revision_days());
  return null;
end;
$$;

revoke all on function private.keep_ai_log_revision() from public;
