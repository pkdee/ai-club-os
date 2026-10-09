-- Attendance 의 구조와 접근 규칙, 그리고 Member 이름 표시에 필요한 열.
-- 결정 배경은 docs/adr/0005-attendance-and-member-display-name.md 에 있다.

-- ---------------------------------------------------------------------------
-- Member 표시 정보
-- ---------------------------------------------------------------------------

-- 다른 Member 의 이름을 보여 주려면 members 에 이름이 있어야 한다.
-- auth.users 는 Data API 에 노출되지 않아서 앱이 직접 읽을 수 없다.
alter table public.members
  add column display_name text not null default '',
  add column email text;

comment on column public.members.display_name is 'Club 안에서 보이는 이름. 참여할 때 Google 계정의 이름을 옮겨 적는다.';
comment on column public.members.email is '참여할 때의 이메일. 같은 Club 의 Member 에게만 보인다.';

-- 이미 있는 Member 에게 이름과 이메일을 채운다.
update public.members as m
set
  display_name = coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    u.email,
    ''
  ),
  email = u.email
from auth.users as u
where u.id = m.user_id;

-- Club 을 만든 사용자를 운영자 Member 로 넣을 때 이름과 이메일도 함께 넣는다.
create or replace function private.add_club_creator_as_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is not null then
    insert into public.members (club_id, user_id, role, display_name, email)
    select
      new.id,
      u.id,
      'admin',
      coalesce(
        nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
        u.email,
        ''
      ),
      u.email
    from auth.users as u
    where u.id = new.created_by;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

-- Attendance 가 같은 Club 의 Session 과 Member 만 잇도록, 두 테이블에 (id, club_id) 묶음을 유일하게 둔다.
alter table public.sessions
  add constraint sessions_id_club_id_key unique (id, club_id);
alter table public.members
  add constraint members_id_club_id_key unique (id, club_id);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  session_id uuid not null,
  member_id uuid not null,
  status text not null,
  recorded_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_status_check check (status in ('present', 'late', 'absent', 'excused')),
  constraint attendance_session_member_unique unique (session_id, member_id),
  -- Session 과 Member 가 모두 club_id 의 Club 에 속해야 한다.
  constraint attendance_session_fkey foreign key (session_id, club_id)
    references public.sessions (id, club_id) on delete cascade,
  constraint attendance_member_fkey foreign key (member_id, club_id)
    references public.members (id, club_id) on delete cascade
);

comment on table public.attendance is 'Member 와 Session 사이의 참여 기록. 행이 없으면 미기록이다.';
comment on column public.attendance.status is 'present 출석, late 지각, absent 결석, excused 공결';
comment on column public.attendance.recorded_by is '마지막으로 기록한 사용자';

-- 외래 키와 접근 규칙이 쓰는 열의 색인. session_id 는 unique 제약의 색인이 맡는다.
create index attendance_member_id_club_id_idx on public.attendance (member_id, club_id);
create index attendance_club_id_idx on public.attendance (club_id);
create index attendance_recorded_by_idx on public.attendance (recorded_by);

-- 고칠 때 고친 시각과 고친 사람을 남긴다.
create function private.touch_attendance()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.recorded_by = (select auth.uid());
  return new;
end;
$$;

revoke all on function private.touch_attendance() from public;

create trigger attendance_touch
  before update on public.attendance
  for each row
  execute function private.touch_attendance();

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

alter table public.attendance enable row level security;

-- Club 의 Member 는 그 Club 의 Attendance 를 본다.
create policy attendance_select_for_members on public.attendance
  for select
  to authenticated
  using (private.is_club_member(club_id));

-- 운영자만 기록한다.
create policy attendance_insert_for_admins on public.attendance
  for insert
  to authenticated
  with check (
    private.is_club_admin(club_id)
    and recorded_by = (select auth.uid())
  );

create policy attendance_update_for_admins on public.attendance
  for update
  to authenticated
  using (private.is_club_admin(club_id))
  with check (private.is_club_admin(club_id));

-- 기록을 지우면 미기록으로 돌아간다.
create policy attendance_delete_for_admins on public.attendance
  for delete
  to authenticated
  using (private.is_club_admin(club_id));

-- ---------------------------------------------------------------------------
-- 권한
-- ---------------------------------------------------------------------------

revoke all on table public.attendance from anon, authenticated;

-- 고칠 수 있는 열은 상태뿐이다. 누구의 어느 회차 기록인지는 바꿀 수 없다.
grant select, delete on table public.attendance to authenticated;
grant insert (club_id, session_id, member_id, status)
  on table public.attendance to authenticated;
grant update (status) on table public.attendance to authenticated;
