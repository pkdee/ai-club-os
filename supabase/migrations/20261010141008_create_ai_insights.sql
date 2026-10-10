-- AI Insight 의 구조와 접근 규칙.
-- 결정 배경은 docs/adr/0017-ai-insight-draft-and-publish.md 에 있다.

-- AI Insight 는 여러 AI Log 를 AI 가 읽고 정리한 것이다. 사용자가 쓴 원본인 ai_logs 와 따로 둔다.
-- 운영자가 만들면 초안으로 저장되고, 운영자가 확인해 공개해야 구성원에게 보인다.

-- 이 파일은 새 테이블 하나와 거기에 딸린 것만 만든다. 한 묶음으로 실행하면 된다.

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  -- session 은 한 회차의 기록을, period 는 한 기간의 Club 전체 기록을 정리한 것이다.
  scope text not null,
  session_id uuid,
  period_start timestamptz,
  period_end timestamptz,
  status text not null default 'draft',
  content jsonb not null,
  source_log_ids uuid[] not null default '{}',
  provider text not null,
  model text not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint ai_insights_scope_check check (scope in ('session', 'period')),
  constraint ai_insights_status_check check (status in ('draft', 'published')),
  -- 회차를 정리한 것은 Session 만, 기간을 정리한 것은 시작과 끝만 가진다.
  constraint ai_insights_target_check check (
    (
      scope = 'session'
      and session_id is not null
      and period_start is null
      and period_end is null
    )
    or (
      scope = 'period'
      and session_id is null
      and period_start is not null
      and period_end is not null
      and period_start < period_end
    )
  ),
  constraint ai_insights_content_check check (
    jsonb_typeof(content) = 'object'
    and octet_length(content::text) <= 40000
  ),
  constraint ai_insights_source_count_check check (cardinality(source_log_ids) <= 500),
  constraint ai_insights_provider_length check (char_length(btrim(provider)) between 1 and 40),
  constraint ai_insights_model_length check (char_length(btrim(model)) between 1 and 80),
  -- Session 은 같은 Club 의 것이어야 한다. Session 이 삭제되면 그 회차의 AI Insight 도 함께 삭제된다.
  constraint ai_insights_session_fkey foreign key (session_id, club_id)
    references public.sessions (id, club_id) on delete cascade
);

comment on table public.ai_insights is '여러 AI Log 를 AI 가 읽고 정리한 것. 사용자가 쓴 원본이 아니다.';
comment on column public.ai_insights.scope is 'session 은 한 회차, period 는 한 기간의 Club 전체 기록을 정리한 것';
comment on column public.ai_insights.status is 'draft 는 운영자에게만 보이는 초안, published 는 Member 에게 공개된 것';
comment on column public.ai_insights.content is '정리한 내용. 모양은 앱이 정하고 읽을 때마다 확인한다.';
comment on column public.ai_insights.source_log_ids is 'AI 에 보낸 AI Log 의 식별자. 그 뒤에 기록이 지워져도 고치지 않는다.';
comment on column public.ai_insights.provider is '정리한 AI Provider';
comment on column public.ai_insights.model is '정리한 모델';
comment on column public.ai_insights.published_at is '공개한 시각. 데이터베이스가 정한다.';

-- 한 회차에는 AI Insight 를 하나만 둔다. 다시 만들면 그 행을 고쳐 쓴다. Session 외래 키의 색인도 겸한다.
create unique index ai_insights_session_key on public.ai_insights (session_id)
  where scope = 'session';
-- 한 Club 의 같은 기간에도 하나만 둔다.
create unique index ai_insights_period_key on public.ai_insights (club_id, period_start, period_end)
  where scope = 'period';
-- Club 의 AI Insight 를 최신순으로 읽는 색인. club_id 외래 키의 색인도 겸한다.
create index ai_insights_club_id_created_at_idx on public.ai_insights (club_id, created_at desc);
create index ai_insights_created_by_idx on public.ai_insights (created_by);

-- 내용이나 공개 상태를 바꾸면 고친 시각을 바꾼다.
create trigger ai_insights_set_updated_at
  before update of content, status, source_log_ids, provider, model on public.ai_insights
  for each row
  when (old.* is distinct from new.*)
  execute function private.set_updated_at();

-- 공개한 시각은 데이터베이스가 정한다. 공개하면 그 시각을 적고, 초안으로 되돌리면 비운다.
create function private.set_ai_insight_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and old.status <> 'published' then
    new.published_at = now();
  elsif new.status <> 'published' then
    new.published_at = null;
  end if;
  return new;
end;
$$;

revoke all on function private.set_ai_insight_published_at() from public;

create trigger ai_insights_set_published_at
  before update of status on public.ai_insights
  for each row
  execute function private.set_ai_insight_published_at();

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

alter table public.ai_insights enable row level security;

-- 운영자는 초안까지 모두 보고, 구성원은 공개된 것만 본다.
create policy ai_insights_select_for_admins_or_published on public.ai_insights
  for select
  to authenticated
  using (
    private.is_club_admin(club_id)
    or (
      status = 'published'
      and private.is_club_member(club_id)
    )
  );

-- 운영자만 만든다. 만들 때는 항상 초안이다.
create policy ai_insights_insert_for_admins on public.ai_insights
  for insert
  to authenticated
  with check (
    private.is_club_admin(club_id)
    and created_by = (select auth.uid())
    and status = 'draft'
  );

-- 운영자만 내용을 고치고 공개하거나 초안으로 되돌린다.
create policy ai_insights_update_for_admins on public.ai_insights
  for update
  to authenticated
  using (private.is_club_admin(club_id))
  with check (private.is_club_admin(club_id));

create policy ai_insights_delete_for_admins on public.ai_insights
  for delete
  to authenticated
  using (private.is_club_admin(club_id));

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

revoke all on table public.ai_insights from anon, authenticated;

-- 만든 사람, 공개 상태, 공개한 시각은 넣을 수 없다. 만들면 로그인한 운영자의 초안이 된다.
-- 다시 만들 때는 같은 행의 내용과 보낸 기록, 모델을 고쳐 쓴다. 대상인 Club 과 Session, 기간은 고칠 수 없다.
grant select, delete on table public.ai_insights to authenticated;
grant insert (club_id, scope, session_id, period_start, period_end, content, source_log_ids, provider, model)
  on table public.ai_insights to authenticated;
grant update (content, status, source_log_ids, provider, model)
  on table public.ai_insights to authenticated;
