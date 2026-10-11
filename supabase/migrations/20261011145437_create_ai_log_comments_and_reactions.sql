-- AI Log 에 다는 댓글과 "도움이 됐어요" 표시.
-- 결정 배경은 docs/adr/0026-comments-and-helpful-marks.md 에 있다.

-- 이 파일은 새 테이블과 함수만 만든다. 다시 실행해도 결과가 같다.
-- 외래 키를 걸면서 clubs, members, ai_logs 를 잠깐 잠근다. 앱이 Club 을 지울 때 잠그는 순서와 같게 적었다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- ---------------------------------------------------------------------------
-- 댓글
-- ---------------------------------------------------------------------------

create table if not exists public.ai_log_comments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  log_id uuid not null,
  author_id uuid default auth.uid(),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 공백과 줄바꿈만 있는 것은 적은 것으로 치지 않는다.
  constraint ai_log_comments_body_check check (body ~ '\S' and char_length(body) <= 1000),
  constraint ai_log_comments_club_fkey foreign key (club_id)
    references public.clubs (id) on delete cascade,
  -- 작성자는 그 Club 의 Member 여야 한다. Member 가 빠지면 댓글은 작성자 없이 남는다. AI Log 와 같은 규칙이다.
  constraint ai_log_comments_author_fkey foreign key (club_id, author_id)
    references public.members (club_id, user_id) on delete set null (author_id),
  -- 기록을 지우면 댓글도 함께 지운다.
  constraint ai_log_comments_log_fkey foreign key (log_id)
    references public.ai_logs (id) on delete cascade
);

comment on table public.ai_log_comments is 'AI Log 에 Member 가 단 댓글';
comment on column public.ai_log_comments.author_id is '작성자. Member 가 Club 에서 빠지면 비운다.';

-- 한 기록의 댓글을 쓴 순서로 읽는 색인. log_id 외래 키의 색인도 겸한다.
create index if not exists ai_log_comments_log_id_created_at_idx
  on public.ai_log_comments (log_id, created_at);
-- Club 과 작성자 외래 키의 색인.
create index if not exists ai_log_comments_club_id_author_id_idx
  on public.ai_log_comments (club_id, author_id);

-- 내용을 실제로 고쳤을 때만 고친 시각을 바꾼다.
drop trigger if exists ai_log_comments_set_updated_at on public.ai_log_comments;
create trigger ai_log_comments_set_updated_at
  before update of body on public.ai_log_comments
  for each row
  when (old.body is distinct from new.body)
  execute function private.set_updated_at();

-- 댓글을 지우면 지운 기록을 남긴다. 함수는 이미 있는 것을 쓴다.
-- 다음 파일(log_comment_deletions)이 그 함수를 댓글을 아는 것으로 바꾸기 전에는 아무것도 남기지 않는다.
-- trigger 를 여기서 거는 것은 이 테이블이 아직 아무에게도 보이지 않아 잠금을 기다릴 일이 없기 때문이다.
drop trigger if exists ai_log_comments_log_deletion on public.ai_log_comments;
create trigger ai_log_comments_log_deletion
  after delete on public.ai_log_comments
  for each row
  execute function private.log_deletion();

alter table public.ai_log_comments enable row level security;

-- Club 의 Member 는 그 Club 의 댓글을 모두 본다.
drop policy if exists ai_log_comments_select_for_members on public.ai_log_comments;
create policy ai_log_comments_select_for_members on public.ai_log_comments
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- Member 는 자기 이름으로만 단다. 기록은 같은 Club 의 것이어야 한다.
drop policy if exists ai_log_comments_insert_as_author on public.ai_log_comments;
create policy ai_log_comments_insert_as_author on public.ai_log_comments
  for insert
  to authenticated
  with check (
    private.is_club_member(club_id)
    and author_id = (select auth.uid())
    and exists (
      select 1
      from public.ai_logs as l
      where l.id = ai_log_comments.log_id
        and l.club_id = ai_log_comments.club_id
    )
  );

-- 작성자 본인만 고친다. Club 에서 빠진 뒤에는 고칠 수 없다.
drop policy if exists ai_log_comments_update_by_author on public.ai_log_comments;
create policy ai_log_comments_update_by_author on public.ai_log_comments
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

-- 작성자 본인과 운영자가 지운다. 작성자가 빠진 댓글은 운영자만 지운다.
drop policy if exists ai_log_comments_delete_by_author_or_admin on public.ai_log_comments;
create policy ai_log_comments_delete_by_author_or_admin on public.ai_log_comments
  for delete
  to authenticated
  using (
    (
      author_id = (select auth.uid())
      and private.is_club_member(club_id)
    )
    or private.is_club_admin(club_id)
  );

revoke all on table public.ai_log_comments from anon, authenticated;

-- 어느 기록의 댓글인지와 작성자는 고칠 수 없다. 작성자는 만들 때 로그인한 사용자로 정해진다.
grant select, delete on table public.ai_log_comments to authenticated;
grant insert (club_id, log_id, body) on table public.ai_log_comments to authenticated;
grant update (body) on table public.ai_log_comments to authenticated;

-- ---------------------------------------------------------------------------
-- 도움이 됐어요 표시
-- ---------------------------------------------------------------------------

-- 한 사람이 한 기록에 한 번만 표시한다. 줄이 있으면 표시한 것이고, 거두면 줄을 지운다.
-- 표시는 한 가지뿐이라 종류를 두지 않는다.
create table if not exists public.ai_log_reactions (
  log_id uuid not null,
  user_id uuid not null default auth.uid(),
  club_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (log_id, user_id),
  constraint ai_log_reactions_club_fkey foreign key (club_id)
    references public.clubs (id) on delete cascade,
  -- 표시한 사람이 Club 에서 빠지면 표시도 함께 지운다.
  constraint ai_log_reactions_member_fkey foreign key (club_id, user_id)
    references public.members (club_id, user_id) on delete cascade,
  constraint ai_log_reactions_log_fkey foreign key (log_id)
    references public.ai_logs (id) on delete cascade
);

comment on table public.ai_log_reactions is 'AI Log 가 도움이 됐다는 Member 의 표시';

create index if not exists ai_log_reactions_club_id_user_id_idx
  on public.ai_log_reactions (club_id, user_id);

alter table public.ai_log_reactions enable row level security;

-- Club 의 Member 는 누가 표시했는지 모두 본다.
drop policy if exists ai_log_reactions_select_for_members on public.ai_log_reactions;
create policy ai_log_reactions_select_for_members on public.ai_log_reactions
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- 자기 이름으로만 표시한다. 같은 Club 의 기록이어야 하고, 자기가 쓴 기록에는 표시하지 못한다.
drop policy if exists ai_log_reactions_insert_own on public.ai_log_reactions;
create policy ai_log_reactions_insert_own on public.ai_log_reactions
  for insert
  to authenticated
  with check (
    private.is_club_member(club_id)
    and user_id = (select auth.uid())
    and exists (
      select 1
      from public.ai_logs as l
      where l.id = ai_log_reactions.log_id
        and l.club_id = ai_log_reactions.club_id
        and l.author_id is distinct from (select auth.uid())
    )
  );

-- 자기 표시만 거둔다.
drop policy if exists ai_log_reactions_delete_own on public.ai_log_reactions;
create policy ai_log_reactions_delete_own on public.ai_log_reactions
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.ai_log_reactions from anon, authenticated;

-- 고치는 권한은 주지 않는다. 표시하거나 거둘 뿐이다.
grant select, delete on table public.ai_log_reactions to authenticated;
grant insert (log_id, club_id) on table public.ai_log_reactions to authenticated;
