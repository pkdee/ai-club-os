-- AI Log 에 붙이는 이미지를 두는 Storage 의 저장 공간과 접근 규칙.
-- 결정 배경은 docs/adr/0028-ai-log-images-in-storage.md 에 있다.

-- 이 파일은 storage 스키마만 건드린다. 다시 실행해도 결과가 같다.
-- 올리는 규칙이 ai_log_attachments 를 읽으므로 앞 파일(create_ai_log_attachments) 뒤에 실행한다.

-- 잠금을 오래 기다리지 않는다. 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 공개하지 않는 저장 공간이다. 주소만으로는 볼 수 없고, 앱이 Member 에게 잠깐 쓰는 주소를 만들어 준다.
insert into storage.buckets (id, name, public)
values ('ai-log-images', 'ai-log-images', false)
on conflict (id) do nothing;

-- 이미지 네 가지 형식만, 한 장에 5MB 까지 받는다. 앱과 ai_log_attachments 의 제약도 같은 값이다.
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
where id = 'ai-log-images';

-- 경로의 마디를 식별자로 읽는다. 모양이 틀리면 오류를 내지 않고 null 을 돌려준다.
-- 접근 규칙 안에서 틀린 경로 때문에 요청 전체가 오류로 끝나지 않게 하려는 것이다.
create or replace function private.uuid_or_null(value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return value::uuid;
exception when others then
  return null;
end;
$$;

revoke all on function private.uuid_or_null(text) from public;
grant execute on function private.uuid_or_null(text) to authenticated;

-- 경로는 Club, 기록, 파일 이름의 세 마디다. (storage.foldername(name))[1] 이 Club, [2] 가 기록이다.
-- owner_id 는 Storage 가 올린 사람의 식별자를 글자로 적어 두는 열이다.

-- 그 Club 의 Member 만 읽는다. 잠깐 쓰는 주소를 만들 때도 이 규칙이 적용된다.
-- 올린 사람은 Club 에서 나간 뒤에도 자기 파일을 읽는다. Storage 는 지우기 전에 먼저 읽기 때문에, 읽지 못하면 지우지도 못한다.
drop policy if exists ai_log_images_select_for_members on storage.objects;
create policy ai_log_images_select_for_members on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'ai-log-images'
    and (
      private.is_club_member(private.uuid_or_null((storage.foldername(name))[1]))
      or owner_id = (select auth.uid())::text
    )
  );

-- 기록의 작성자만 자기 기록의 자리에 올린다.
-- 앱이 ai_log_attachments 에 먼저 적어 둔 경로에만 올릴 수 있다. 그래서 목록에 없는 파일이 Storage 에 생기지 않는다.
drop policy if exists ai_log_images_insert_by_log_author on storage.objects;
create policy ai_log_images_insert_by_log_author on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'ai-log-images'
    and private.is_club_member(private.uuid_or_null((storage.foldername(name))[1]))
    and exists (
      select 1
      from public.ai_logs as l
      where l.id = private.uuid_or_null((storage.foldername(name))[2])
        and l.club_id = private.uuid_or_null((storage.foldername(name))[1])
        and l.author_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.ai_log_attachments as a
      where a.path = objects.name
        and a.created_by = (select auth.uid())
    )
  );

-- 기록의 작성자와 그 Club 의 운영자가 지운다.
-- 올린 사람은 Club 에서 나간 뒤에도 자기 파일을 지울 수 있다. 올린 파일이 남아 있으면 계정을 지울 수 없기 때문이다.
drop policy if exists ai_log_images_delete_by_log_author_or_admin on storage.objects;
create policy ai_log_images_delete_by_log_author_or_admin on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'ai-log-images'
    and (
      owner_id = (select auth.uid())::text
      or private.is_club_admin(private.uuid_or_null((storage.foldername(name))[1]))
      or (
        private.is_club_member(private.uuid_or_null((storage.foldername(name))[1]))
        and exists (
          select 1
          from public.ai_logs as l
          where l.id = private.uuid_or_null((storage.foldername(name))[2])
            and l.author_id = (select auth.uid())
        )
      )
    )
  );

-- 고치는 규칙은 두지 않는다. 같은 자리에 덮어쓸 수 없다.
