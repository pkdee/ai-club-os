-- AI Log 의 구조와 접근 규칙.
-- 결정 배경은 docs/adr/0006-ai-log-structure-and-authorship.md 에 있다.

-- ---------------------------------------------------------------------------
-- 입력 확인에 쓰는 함수
-- ---------------------------------------------------------------------------

-- 사용한 도구 목록의 형식을 확인한다. 10개 이하이고, 각 이름은 앞뒤 공백 없이 1자 이상 30자 이하다.
create function private.is_valid_tool_list(tools text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_ndims(tools), 1) = 1
    and cardinality(tools) <= 10
    and not exists (
      select 1
      from unnest(tools) as tool
      where tool is null
        or tool <> btrim(tool)
        or char_length(tool) not between 1 and 30
    );
$$;

revoke all on function private.is_valid_tool_list(text[]) from public;
grant execute on function private.is_valid_tool_list(text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

create table public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  session_id uuid,
  author_id uuid default auth.uid(),
  title text not null,
  tools text[] not null default '{}',
  attempt text not null,
  result text not null default '',
  learned text not null default '',
  next_action text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_logs_title_length check (char_length(btrim(title)) between 1 and 100),
  constraint ai_logs_attempt_length check (char_length(btrim(attempt)) between 1 and 5000),
  constraint ai_logs_result_length check (char_length(result) <= 5000),
  constraint ai_logs_learned_length check (char_length(learned) <= 5000),
  constraint ai_logs_next_action_length check (char_length(next_action) <= 5000),
  constraint ai_logs_tools_valid check (private.is_valid_tool_list(tools)),
  -- Session 은 같은 Club 의 것이어야 한다. Session 이 삭제되면 기록은 Club 의 기록으로 남는다.
  constraint ai_logs_session_fkey foreign key (session_id, club_id)
    references public.sessions (id, club_id) on delete set null (session_id),
  -- 작성자는 그 Club 의 Member 여야 한다. Member 가 빠지면 기록은 작성자 없이 남는다.
  constraint ai_logs_author_fkey foreign key (club_id, author_id)
    references public.members (club_id, user_id) on delete set null (author_id)
);

comment on table public.ai_logs is '구성원이 남긴 AI 활용 기록. 사용자가 쓴 원본이다.';
comment on column public.ai_logs.session_id is '기록이 속한 회차. 비어 있으면 Club 의 기록이다.';
comment on column public.ai_logs.author_id is '작성자. Member 가 Club 에서 빠지면 비운다.';
comment on column public.ai_logs.tools is '사용한 도구 이름';
comment on column public.ai_logs.attempt is '시도한 내용';
comment on column public.ai_logs.result is '결과';
comment on column public.ai_logs.learned is '배운 점';
comment on column public.ai_logs.next_action is '다음 행동';

-- Club 의 기록을 최신순으로 읽는 색인. club_id 외래 키의 색인도 겸한다.
create index ai_logs_club_id_created_at_idx on public.ai_logs (club_id, created_at desc);
-- 외래 키와 Session 별 목록, 작성자별 목록이 쓰는 색인.
create index ai_logs_session_id_club_id_idx on public.ai_logs (session_id, club_id);
create index ai_logs_club_id_author_id_idx on public.ai_logs (club_id, author_id);

-- 내용을 실제로 고쳤을 때만 고친 시각을 바꾼다.
-- Session 이나 Member 가 삭제되어 연결만 비워질 때는 바뀌지 않는다.
create trigger ai_logs_set_updated_at
  before update of title, tools, attempt, result, learned, next_action on public.ai_logs
  for each row
  when (old.* is distinct from new.*)
  execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

alter table public.ai_logs enable row level security;

-- Club 의 Member 는 그 Club 의 AI Log 를 모두 본다.
create policy ai_logs_select_for_members on public.ai_logs
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- Member 는 자기 이름으로만 기록을 남긴다.
create policy ai_logs_insert_as_author on public.ai_logs
  for insert
  to authenticated
  with check (
    private.is_club_member(club_id)
    and author_id = (select auth.uid())
  );

-- 작성자 본인만 고친다. Club 에서 빠진 뒤에는 고칠 수 없다.
create policy ai_logs_update_by_author on public.ai_logs
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

-- 삭제 규칙은 삭제 정책이 정해진 뒤에 추가한다. 규칙이 없으면 거부된다.

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

revoke all on table public.ai_logs from anon, authenticated;

-- 작성자와 Club 은 고칠 수 없다. 작성자는 만들 때 로그인한 사용자로 정해진다.
grant select on table public.ai_logs to authenticated;
grant insert (club_id, session_id, title, tools, attempt, result, learned, next_action)
  on table public.ai_logs to authenticated;
grant update (session_id, title, tools, attempt, result, learned, next_action)
  on table public.ai_logs to authenticated;
