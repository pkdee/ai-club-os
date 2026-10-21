-- Session 에 Docs 의 문서를 참고 자료로 이어 둔다.
-- 결정 배경은 docs/adr/0033-session-reference-docs.md 에 있다.

-- 이 파일은 새 테이블만 만든다. 다시 실행해도 결과가 같다.
-- 외래 키를 걸면서 clubs, sessions 를 잠깐 잠근다. 앱이 Club 을 지울 때 잠그는 순서와 같게 적었다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 줄이 있으면 이어 둔 것이다. 빼면 줄을 지운다.
-- Docs 의 문서는 데이터베이스가 아닌 저장소의 파일이라 slug 로만 가리킨다. 목록에 있는 문서인지는 앱이 확인한다.
create table if not exists public.session_docs (
  session_id uuid not null,
  doc_slug text not null,
  club_id uuid not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (session_id, doc_slug),
  -- 앱의 Docs 목록과 같은 모양이다. 영어 소문자와 숫자를 하이픈으로 잇는다.
  constraint session_docs_doc_slug_format check (
    char_length(doc_slug) <= 100
    and doc_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint session_docs_club_fkey foreign key (club_id)
    references public.clubs (id) on delete cascade,
  -- Session 과 같은 Club 이어야 한다. Session 을 지우면 이어 둔 줄도 지운다.
  constraint session_docs_session_fkey foreign key (session_id, club_id)
    references public.sessions (id, club_id) on delete cascade,
  constraint session_docs_created_by_fkey foreign key (created_by)
    references auth.users (id) on delete set null
);

comment on table public.session_docs is 'Session 에 참고 자료로 이어 둔 Docs 의 문서';

create index if not exists session_docs_club_id_idx on public.session_docs (club_id);
create index if not exists session_docs_created_by_idx on public.session_docs (created_by);

alter table public.session_docs enable row level security;

-- Club 의 Member 는 모두 본다.
drop policy if exists session_docs_select_for_members on public.session_docs;
create policy session_docs_select_for_members on public.session_docs
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- Session 을 꾸리는 운영자가 잇는다.
drop policy if exists session_docs_insert_for_admins on public.session_docs;
create policy session_docs_insert_for_admins on public.session_docs
  for insert
  to authenticated
  with check (private.is_club_admin(club_id));

-- 빼는 것도 운영자가 한다.
drop policy if exists session_docs_delete_for_admins on public.session_docs;
create policy session_docs_delete_for_admins on public.session_docs
  for delete
  to authenticated
  using (private.is_club_admin(club_id));

revoke all on table public.session_docs from anon, authenticated;

-- 고치는 권한은 주지 않는다. 잇거나 뺄 뿐이다.
grant select, delete on table public.session_docs to authenticated;
grant insert (session_id, doc_slug, club_id) on table public.session_docs to authenticated;
