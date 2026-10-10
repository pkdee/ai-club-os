-- 알림을 어디까지 봤는지와 AI Log 의 수정 기록, 그리고 이름 고치기와 도구 표기 합치기에 쓰는 함수.
-- 결정 배경은 docs/adr/0023-notifications-names-and-revisions.md 에 있다.

-- 이 파일은 새 테이블과 함수만 만든다. 다시 실행해도 결과가 같다.
-- 기존 테이블에 trigger 와 열을 더하는 일은 테이블마다 다음 파일들로 나눴다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- ---------------------------------------------------------------------------
-- 알림을 어디까지 봤는지
-- ---------------------------------------------------------------------------

-- 알림은 따로 쌓지 않고 지금의 기록에서 읽어 낸다. 여기에는 사람마다 마지막으로 알림을 본 시각만 둔다.
-- 그 시각보다 뒤에 생긴 것을 새 알림으로 센다.
create table if not exists public.notification_reads (
  club_id uuid not null,
  user_id uuid not null,
  seen_at timestamptz not null default now(),
  primary key (club_id, user_id),
  -- 외래 키는 적힌 순서대로 잠근다. Club 을 지울 때 앱이 잠그는 순서와 같게 clubs 를 먼저 둔다.
  constraint notification_reads_club_fkey foreign key (club_id)
    references public.clubs (id) on delete cascade,
  constraint notification_reads_user_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
);

comment on table public.notification_reads is '사람마다 그 Club 의 알림을 마지막으로 본 시각';

create index if not exists notification_reads_user_id_idx on public.notification_reads (user_id);

alter table public.notification_reads enable row level security;

-- 자기 것만 본다. 넣고 고치는 것은 아래 함수로만 한다.
drop policy if exists notification_reads_select_own on public.notification_reads;
create policy notification_reads_select_own on public.notification_reads
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.notification_reads from anon, authenticated;
grant select on table public.notification_reads to authenticated;

-- 지금까지의 알림을 본 것으로 적는다. 시각은 데이터베이스가 정한다. Member 가 아니면 아무 일도 하지 않는다.
create or replace function public.mark_notifications_seen(target_club_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notification_reads (club_id, user_id, seen_at)
  select target_club_id, (select auth.uid()), now()
  where private.is_club_member(target_club_id)
  on conflict (club_id, user_id) do update set seen_at = now();
$$;

revoke all on function public.mark_notifications_seen(uuid) from public, anon;
grant execute on function public.mark_notifications_seen(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- AI Log 의 수정 기록
-- ---------------------------------------------------------------------------

-- AI Log 를 고칠 때마다 고치기 전의 내용을 한 줄로 남긴다. 기록을 지우면 함께 지워진다.
create table if not exists public.ai_log_revisions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  log_id uuid not null,
  title text not null,
  tools text[] not null default '{}',
  attempt text not null,
  result text not null default '',
  learned text not null default '',
  next_action text not null default '',
  replaced_at timestamptz not null default now(),
  replaced_by uuid,
  -- clubs 를 먼저 잠그고 ai_logs 를 잠근다. Club 을 지울 때 앱이 잠그는 순서와 같다.
  constraint ai_log_revisions_club_fkey foreign key (club_id)
    references public.clubs (id) on delete cascade,
  constraint ai_log_revisions_log_fkey foreign key (log_id)
    references public.ai_logs (id) on delete cascade,
  constraint ai_log_revisions_replaced_by_fkey foreign key (replaced_by)
    references auth.users (id) on delete set null
);

comment on table public.ai_log_revisions is 'AI Log 를 고치기 전의 내용. 고칠 때마다 한 줄이 남는다.';
comment on column public.ai_log_revisions.replaced_at is '이 내용이 고쳐져 지난 것이 된 시각';
comment on column public.ai_log_revisions.replaced_by is '고친 사용자';

create index if not exists ai_log_revisions_log_id_replaced_at_idx
  on public.ai_log_revisions (log_id, replaced_at desc);
create index if not exists ai_log_revisions_club_id_idx on public.ai_log_revisions (club_id);
create index if not exists ai_log_revisions_replaced_by_idx on public.ai_log_revisions (replaced_by);

-- 한 기록에 남겨 두는 지난 내용의 수. 넘으면 오래된 것부터 지운다.
create or replace function private.ai_log_revision_limit()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 20
$$;

revoke all on function private.ai_log_revision_limit() from public;

-- 고치기 전의 내용을 남긴다. ai_logs 의 trigger 가 쓴다.
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
  return null;
end;
$$;

revoke all on function private.keep_ai_log_revision() from public;

alter table public.ai_log_revisions enable row level security;

-- 그 기록의 작성자와 운영자만 본다. 다른 Member 에게는 고쳤다는 사실과 시각만 지금처럼 보인다.
drop policy if exists ai_log_revisions_select_for_author_or_admin on public.ai_log_revisions;
create policy ai_log_revisions_select_for_author_or_admin on public.ai_log_revisions
  for select
  to authenticated
  using (
    private.is_club_admin(club_id)
    or exists (
      select 1
      from public.ai_logs as l
      where l.id = log_id
        and l.author_id = (select auth.uid())
    )
  );

-- 넣고 고치고 지우는 권한은 아무에게도 주지 않는다. 데이터베이스의 trigger 만 적는다.
revoke all on table public.ai_log_revisions from anon, authenticated;
grant select on table public.ai_log_revisions to authenticated;

-- ---------------------------------------------------------------------------
-- 자기 이름 고치기
-- ---------------------------------------------------------------------------

-- 지금 로그인한 사용자가 그 Club 안에서 쓰는 이름을 고친다. 고친 이름을 돌려주고, Member 가 아니면 null 을 돌려준다.
-- members 의 수정 권한은 운영자가 역할을 바꾸는 데만 열려 있어서, 자기 이름은 이 함수로만 고친다.
-- 이름에 @ 를 쓸 수 없게 해서 이메일이 이름으로 보이는 일을 줄인다.
create or replace function public.set_my_display_name(target_club_id uuid, new_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned text := btrim(regexp_replace(coalesce(new_name, ''), '\s+', ' ', 'g'));
begin
  if char_length(cleaned) < 1 or char_length(cleaned) > 40 then
    raise exception '이름은 1자 이상 40자 이하로 적어 주세요.'
      using errcode = '22023';
  end if;
  if position('@' in cleaned) > 0 then
    raise exception '이름에는 @ 를 쓸 수 없습니다.'
      using errcode = '22023';
  end if;

  update public.members
  set display_name = cleaned
  where club_id = target_club_id
    and user_id = (select auth.uid());

  if not found then
    return null;
  end if;
  return cleaned;
end;
$$;

revoke all on function public.set_my_display_name(uuid, text) from public, anon;
grant execute on function public.set_my_display_name(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 도구 표기 합치기
-- ---------------------------------------------------------------------------

-- 그 Club 의 기록에 쓰인 도구 이름을 적힌 그대로, 쓴 횟수와 함께 돌려준다.
-- club_tool_counts 는 표기만 다른 이름을 하나로 합쳐 보여 주지만, 여기서는 합치지 않는다.
-- 부른 사람의 권한으로 실행하므로 ai_logs 의 접근 규칙이 그대로 적용된다.
create or replace function public.club_tool_spellings(target_club_id uuid)
returns table (tool text, log_count bigint)
language sql
stable
set search_path = ''
as $$
  select used.tool, count(*)::bigint as log_count
  from public.ai_logs as l
  cross join lateral unnest(l.tools) as used (tool)
  where l.club_id = target_club_id
  group by used.tool
  order by log_count desc, used.tool
  limit 300;
$$;

revoke all on function public.club_tool_spellings(uuid) from public, anon;
grant execute on function public.club_tool_spellings(uuid) to authenticated;

-- 그 Club 의 모든 기록에서 도구 이름 하나를 다른 표기로 바꾸고, 바뀐 기록의 수를 돌려준다. 운영자만 부를 수 있다.
-- 바꾼 결과 같은 도구가 두 번 들어가면 하나만 남긴다.
-- 작성자가 내용을 고친 것이 아니므로 고친 시각을 바꾸지 않고 수정 기록도 남기지 않는다.
-- 그 표시를 ai_logs 의 trigger 가 읽도록 이 요청 안에서만 켜 둔다.
create or replace function public.rename_club_tool(target_club_id uuid, from_name text, to_name text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned text := btrim(regexp_replace(coalesce(to_name, ''), '\s+', ' ', 'g'));
  changed integer;
begin
  if not private.is_club_admin(target_club_id) then
    raise exception '운영자만 도구 표기를 합칠 수 있습니다.'
      using errcode = '42501';
  end if;
  if char_length(cleaned) < 1 or char_length(cleaned) > 30 or position(',' in cleaned) > 0 then
    raise exception '도구 이름은 쉼표 없이 1자 이상 30자 이하로 적어 주세요.'
      using errcode = '22023';
  end if;
  if from_name is null or from_name = cleaned then
    return 0;
  end if;

  perform set_config('app.bulk_tool_rename', 'on', true);

  update public.ai_logs as l
  set tools = (
    select coalesce(array_agg(kept.tool order by kept.position), '{}')
    from (
      select distinct on (private.search_key(renamed.tool))
        renamed.tool,
        renamed.position
      from (
        select
          case when used.tool = from_name then cleaned else used.tool end as tool,
          used.position
        from unnest(l.tools) with ordinality as used (tool, position)
      ) as renamed
      order by private.search_key(renamed.tool), renamed.position
    ) as kept
  )
  where l.club_id = target_club_id
    and from_name = any (l.tools);
  get diagnostics changed = row_count;

  perform set_config('app.bulk_tool_rename', 'off', true);
  return changed;
end;
$$;

revoke all on function public.rename_club_tool(uuid, text, text) from public, anon;
grant execute on function public.rename_club_tool(uuid, text, text) to authenticated;
