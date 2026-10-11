-- AI Log 에 붙인 이미지의 목록. 파일 자체는 Storage 에 있고 여기에는 어디에 있는지만 적는다.
-- 결정 배경은 docs/adr/0028-ai-log-images-in-storage.md 에 있다.

-- 이 파일은 새 테이블과 함수만 만든다. 다시 실행해도 결과가 같다.
-- 외래 키를 걸면서 clubs 와 ai_logs 를 잠깐 잠근다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 한 기록에 붙일 수 있는 이미지의 수. 앱의 AI_LOG_IMAGE_LIMIT 과 같은 값이어야 한다.
create or replace function private.ai_log_image_limit()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 4
$$;

revoke all on function private.ai_log_image_limit() from public;

create table if not exists public.ai_log_attachments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null,
  log_id uuid not null,
  path text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  constraint ai_log_attachments_path_key unique (path),
  constraint ai_log_attachments_mime_type_check check (
    mime_type in ('image/png', 'image/jpeg', 'image/webp', 'image/gif')
  ),
  -- 한 장에 5MB 까지다. Storage 의 저장 공간 설정과 같은 값이다.
  constraint ai_log_attachments_size_check check (size_bytes between 1 and 5242880),
  -- 경로는 Club, 기록, 파일 이름의 세 마디다. 앞의 두 마디는 이 줄의 Club 과 기록이어야 하고,
  -- 파일 이름은 앱이 만든 식별자와 확장자다. 사용자가 올린 파일의 이름은 쓰지 않는다.
  constraint ai_log_attachments_path_check check (
    path ~ ('^' || club_id::text || '/' || log_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif)$')
  ),
  constraint ai_log_attachments_club_fkey foreign key (club_id)
    references public.clubs (id) on delete cascade,
  -- 기록을 지우면 목록도 함께 지운다. Storage 의 파일은 앱이 먼저 지운다.
  -- 파일이 남아 있으면 아래의 trigger 가 막아서 기록도 지워지지 않는다.
  constraint ai_log_attachments_log_fkey foreign key (log_id)
    references public.ai_logs (id) on delete cascade,
  constraint ai_log_attachments_created_by_fkey foreign key (created_by)
    references auth.users (id) on delete set null
);

comment on table public.ai_log_attachments is 'AI Log 에 붙인 이미지. 파일은 Storage 의 ai-log-images 에 있다.';
comment on column public.ai_log_attachments.path is 'Storage 안의 경로. Club, 기록, 파일 이름의 세 마디다.';

create index if not exists ai_log_attachments_log_id_created_at_idx
  on public.ai_log_attachments (log_id, created_at);
create index if not exists ai_log_attachments_club_id_idx on public.ai_log_attachments (club_id);
create index if not exists ai_log_attachments_created_by_idx on public.ai_log_attachments (created_by);

-- 한 기록에 붙이는 수를 넘지 못하게 한다. 동시에 들어온 요청이 서로를 지나치지 않도록 세기 전에 그 기록의 행을 잠근다.
create or replace function private.check_ai_log_attachment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.ai_logs where id = new.log_id for update;

  if (
    select count(*) from public.ai_log_attachments where log_id = new.log_id
  ) >= private.ai_log_image_limit() then
    raise exception '한 기록에 이미지는 %장까지 붙일 수 있습니다.', private.ai_log_image_limit()
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.check_ai_log_attachment() from public;

drop trigger if exists ai_log_attachments_check_limit on public.ai_log_attachments;
create trigger ai_log_attachments_check_limit
  before insert on public.ai_log_attachments
  for each row
  execute function private.check_ai_log_attachment();

-- 파일이 Storage 에 남아 있는 동안에는 목록의 줄을 지우지 못하게 한다.
-- 줄이 먼저 사라지면 그 파일을 찾을 길이 없어져 아무도 지울 수 없는 파일이 남는다.
-- 기록이나 Club 이 지워지면서 줄이 함께 지워질 때와 계정을 지울 때도 이 규칙이 적용된다.
-- 그래서 앱은 언제나 파일을 먼저 지우고, 빠뜨리면 지우는 일 전체가 되돌려진다.
-- storage.objects 를 읽어야 해서 만든 사람의 권한으로 실행한다. 읽기만 한다.
create or replace function private.keep_attachment_until_file_is_gone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from storage.objects as o
    where o.bucket_id = 'ai-log-images'
      and o.name = old.path
  ) then
    raise exception '파일이 Storage 에 남아 있는 이미지는 목록에서 지울 수 없습니다. 파일을 먼저 지워야 합니다.'
      using errcode = '23503';
  end if;
  return old;
end;
$$;

revoke all on function private.keep_attachment_until_file_is_gone() from public;

drop trigger if exists ai_log_attachments_keep_until_file_is_gone on public.ai_log_attachments;
create trigger ai_log_attachments_keep_until_file_is_gone
  before delete on public.ai_log_attachments
  for each row
  execute function private.keep_attachment_until_file_is_gone();

alter table public.ai_log_attachments enable row level security;

-- Club 의 Member 는 그 Club 의 기록에 붙은 이미지를 모두 본다.
-- 붙인 사람은 Club 에서 나간 뒤에도 자기가 붙인 줄을 본다. 계정을 지우기 전에 자기가 올린 파일을 찾아 지워야 하기 때문이다.
drop policy if exists ai_log_attachments_select_for_members on public.ai_log_attachments;
create policy ai_log_attachments_select_for_members on public.ai_log_attachments
  for select
  to authenticated
  using (
    private.is_club_member(club_id)
    or created_by = (select auth.uid())
  );

-- 기록의 작성자만 자기 기록에 붙인다.
drop policy if exists ai_log_attachments_insert_by_log_author on public.ai_log_attachments;
create policy ai_log_attachments_insert_by_log_author on public.ai_log_attachments
  for insert
  to authenticated
  with check (
    private.is_club_member(club_id)
    and created_by = (select auth.uid())
    and exists (
      select 1
      from public.ai_logs as l
      where l.id = ai_log_attachments.log_id
        and l.club_id = ai_log_attachments.club_id
        and l.author_id = (select auth.uid())
    )
  );

-- 기록의 작성자와 운영자가 뗀다. 기록을 지울 수 있는 사람과 같다.
drop policy if exists ai_log_attachments_delete_by_log_author_or_admin on public.ai_log_attachments;
create policy ai_log_attachments_delete_by_log_author_or_admin on public.ai_log_attachments
  for delete
  to authenticated
  using (
    private.is_club_admin(club_id)
    or (
      private.is_club_member(club_id)
      and exists (
        select 1
        from public.ai_logs as l
        where l.id = ai_log_attachments.log_id
          and l.author_id = (select auth.uid())
      )
    )
  );

revoke all on table public.ai_log_attachments from anon, authenticated;

-- 고치는 권한은 주지 않는다. 붙이거나 뗄 뿐이다.
grant select, delete on table public.ai_log_attachments to authenticated;
grant insert (club_id, log_id, path, mime_type, size_bytes)
  on table public.ai_log_attachments to authenticated;
