-- Club 로고를 두는 Storage 의 저장 공간과 접근 규칙.
-- 결정 배경은 docs/adr/0032-club-directory-and-logos.md 에 있다.

-- 이 파일은 storage 스키마만 건드린다. 다시 실행해도 결과가 같다.
-- 규칙이 쓰는 private.uuid_or_null 과 private.is_club_admin 은 앞선 파일들이 만들었다.

-- 잠금을 오래 기다리지 않는다. 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 공개하지 않는 저장 공간이다. 주소만으로는 볼 수 없고, 로그인한 사용자가 앱을 거쳐 본다.
insert into storage.buckets (id, name, public)
values ('club-logos', 'club-logos', false)
on conflict (id) do nothing;

-- 앱이 브라우저에서 정사각형으로 줄인 그림만 받는다. 세 가지 형식, 한 장에 512KB 까지다.
-- 앱의 club/logo-rules.ts 와 clubs_logo_path_format 제약도 같은 형식이다.
update storage.buckets
set public = false,
    file_size_limit = 524288,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'club-logos';

-- 경로는 Club 과 파일 이름의 두 마디다. (storage.foldername(name))[1] 이 Club 이다.

-- Club 목록은 로그인한 사용자 모두에게 보이므로 로고도 로그인한 사용자 모두가 읽는다.
drop policy if exists club_logos_select_for_signed_in on storage.objects;
create policy club_logos_select_for_signed_in on storage.objects
  for select
  to authenticated
  using (bucket_id = 'club-logos');

-- 그 Club 의 운영자만 자기 Club 의 자리에 올린다. 더 깊은 경로에는 올릴 수 없다.
drop policy if exists club_logos_insert_by_admin on storage.objects;
create policy club_logos_insert_by_admin on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'club-logos'
    and array_length(storage.foldername(name), 1) = 1
    and private.is_club_admin(private.uuid_or_null((storage.foldername(name))[1]))
  );

-- 그 Club 의 운영자가 지운다. 로고를 바꾸거나 지울 때와 Club 을 지우기 전이다.
drop policy if exists club_logos_delete_by_admin on storage.objects;
create policy club_logos_delete_by_admin on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'club-logos'
    and private.is_club_admin(private.uuid_or_null((storage.foldername(name))[1]))
  );

-- 고치는 규칙은 두지 않는다. 같은 자리에 덮어쓸 수 없고, 바꿀 때는 새 이름으로 올린다.
