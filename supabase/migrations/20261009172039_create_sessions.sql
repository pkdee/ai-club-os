-- Session 의 기본 구조와 접근 규칙.
-- 시각은 timestamptz 로 저장하고 화면에서는 한국 시간으로 해석한다.
-- 결정 배경은 docs/adr/0004-session-time-in-korea-standard-time.md 에 있다.

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  title text not null,
  description text not null default '',
  location text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_title_length check (char_length(btrim(title)) between 1 and 80),
  constraint sessions_description_length check (char_length(description) <= 2000),
  constraint sessions_location_length check (char_length(location) <= 80),
  constraint sessions_time_order check (ends_at > starts_at)
);

comment on table public.sessions is '학습과 실험이 일어나는 회차';
comment on column public.sessions.starts_at is '시작 시각. 화면에서는 한국 시간으로 보여 준다.';
comment on column public.sessions.ends_at is '종료 시각. 시작 시각보다 뒤여야 한다.';

-- Club 의 Session 을 시간 순서로 읽는 색인. club_id 외래 키의 색인도 겸한다.
create index sessions_club_id_starts_at_idx on public.sessions (club_id, starts_at);
create index sessions_created_by_idx on public.sessions (created_by);

-- ---------------------------------------------------------------------------
-- 접근 규칙에 쓰는 함수
-- ---------------------------------------------------------------------------

-- 지금 로그인한 사용자가 해당 Club 의 운영자인지 확인한다.
create function private.is_club_admin(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.members
    where club_id = target_club_id
      and user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_club_admin(uuid) from public;
grant execute on function private.is_club_admin(uuid) to authenticated;

-- 행을 고칠 때 updated_at 을 지금 시각으로 맞춘다. 여러 테이블이 함께 쓴다.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row
  execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

alter table public.sessions enable row level security;

-- Club 의 Member 는 그 Club 의 Session 을 본다.
create policy sessions_select_for_members on public.sessions
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- 운영자만 Session 을 만든다. 만든 사람은 로그인한 사용자여야 한다.
create policy sessions_insert_for_admins on public.sessions
  for insert
  to authenticated
  with check (
    private.is_club_admin(club_id)
    and created_by = (select auth.uid())
  );

-- 운영자만 Session 을 고친다.
create policy sessions_update_for_admins on public.sessions
  for update
  to authenticated
  using (private.is_club_admin(club_id))
  with check (private.is_club_admin(club_id));

-- 삭제 규칙은 삭제 정책이 정해진 뒤에 추가한다. 규칙이 없으면 거부된다.

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

revoke all on table public.sessions from anon, authenticated;

-- 만들 때와 고칠 때 넣을 수 있는 열을 정해 둔다.
-- 고칠 때 club_id 를 뺐으므로 Session 을 다른 Club 으로 옮길 수 없다.
grant select on table public.sessions to authenticated;
grant insert (club_id, title, description, location, starts_at, ends_at)
  on table public.sessions to authenticated;
grant update (title, description, location, starts_at, ends_at)
  on table public.sessions to authenticated;
