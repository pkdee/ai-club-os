-- 로그인한 사용자 모두가 보는 Club 목록과 Club 로고.
-- A 는 운영자, B 는 초대로 들어온 구성원, D 는 어느 Club 의 Member 도 아니고, E 는 혼자 있는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name, description) values ('AI 모각코', '매주 모여 AI 로 만든다');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.login('e');
insert into public.clubs (name) values ('혼자 있는 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '혼자 있는 Club' $$);

-- 로고 경로를 만드는 도우미. Club 과 파일 이름의 두 마디다.
select test.sudo($sudo$
  create function test.logo_path(club_key text, file text)
  returns text
  language sql
  as $fn$
    select test.get(club_key) || '/' || file
  $fn$
$sudo$);

-- ---------------------------------------------------------------------------
-- 로그인한 사용자 모두가 보는 Club 목록
-- ---------------------------------------------------------------------------

select test.login('d');
select test.is($$ select count(*) from public.list_clubs() $$, '2', 'Member 가 아닌 D 도 등록된 Club 을 모두 본다');
select test.is($$ select count(*) from public.list_clubs() where my_role is null $$, '2', 'D 의 역할은 어느 Club 에서나 비어 있다');
select test.is($$ select name || ' / ' || description || ' / ' || member_count from public.list_clubs() where id = test.get('club')::uuid $$, 'AI 모각코 / 매주 모여 AI 로 만든다 / 2', '이름, 소개, Member 수를 본다');
select test.is($$ select count(*) from public.clubs $$, '0', 'Club 의 줄은 지금처럼 Member 만 읽는다');
select test.is($$ select count(*) from public.members $$, '0', 'Member 의 줄도 지금처럼 같은 Club 끼리만 읽는다');
select test.login('b');
select test.is($$ select my_role from public.list_clubs() where id = test.get('club')::uuid $$, 'member', 'B 는 자기 역할을 본다');
select test.is($$ select coalesce(my_role, '없음') from public.list_clubs() where id = test.get('other_club')::uuid $$, '없음', 'B 는 E 의 Club 에서 역할이 없다');
select test.login('a');
select test.is($$ select my_role from public.list_clubs() where id = test.get('club')::uuid $$, 'admin', 'A 는 운영자로 보인다');
select test.anon();
select test.throws($$ select count(*) from public.list_clubs() $$, '42501', '로그인하지 않으면 Club 목록을 읽을 수 없다');

-- ---------------------------------------------------------------------------
-- 로고 경로
-- ---------------------------------------------------------------------------

select test.login('a');
select test.affects($$ update public.clubs set logo_path = test.logo_path('club', '11111111-1111-4111-8111-111111111111.png') where id = test.get('club')::uuid $$, 1, '운영자 A 는 로고 경로를 정한다');
select test.throws($$ update public.clubs set logo_path = test.logo_path('other_club', '22222222-2222-4222-8222-222222222222.png') where id = test.get('club')::uuid $$, '23514', '다른 Club 의 자리는 가리킬 수 없다');
select test.throws($$ update public.clubs set logo_path = test.logo_path('club', '../../secret.png') where id = test.get('club')::uuid $$, '23514', '앱이 만든 이름이 아닌 파일은 가리킬 수 없다');
select test.throws($$ update public.clubs set logo_path = test.logo_path('club', '22222222-2222-4222-8222-222222222222.svg') where id = test.get('club')::uuid $$, '23514', '정해진 세 가지 형식이 아니면 받지 않는다');
select test.login('b');
select test.affects($$ update public.clubs set logo_path = null where id = test.get('club')::uuid $$, 0, '구성원 B 는 로고를 바꿀 수 없다');
select test.login('d');
select test.is($$ select logo_path from public.list_clubs() where id = test.get('club')::uuid $$, test.get('club') || '/11111111-1111-4111-8111-111111111111.png', 'Member 가 아닌 D 도 로고 경로를 본다');

-- ---------------------------------------------------------------------------
-- Storage 의 로고 파일
-- ---------------------------------------------------------------------------

select test.login('a');
select test.affects($$ insert into storage.objects (bucket_id, name) values ('club-logos', test.logo_path('club', '11111111-1111-4111-8111-111111111111.png')) $$, 1, '운영자 A 가 자기 Club 의 자리에 로고를 올린다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('club-logos', test.logo_path('other_club', '33333333-3333-4333-8333-333333333333.png')) $$, '42501', 'A 는 다른 Club 의 자리에 올릴 수 없다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('club-logos', test.logo_path('club', 'deeper/33333333-3333-4333-8333-333333333333.png')) $$, '42501', '더 깊은 경로에는 올릴 수 없다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('club-logos', 'not-a-club/x.png') $$, '42501', '식별자가 아닌 마디는 오류 없이 거절된다');
select test.affects($$ update storage.objects set name = name || 'x' where bucket_id = 'club-logos' $$, 0, '로고 파일은 고칠 수 없다');
select test.login('b');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('club-logos', test.logo_path('club', '44444444-4444-4444-8444-444444444444.png')) $$, '42501', '구성원 B 는 로고를 올릴 수 없다');
select test.affects($$ delete from storage.objects where bucket_id = 'club-logos' $$, 0, '구성원 B 는 로고를 지울 수 없다');
select test.login('d');
select test.is($$ select count(*) from storage.objects where bucket_id = 'club-logos' $$, '1', 'Member 가 아닌 D 도 로고 파일을 읽는다');
select test.affects($$ delete from storage.objects where bucket_id = 'club-logos' $$, 0, 'D 는 로고를 지울 수 없다');
select test.login('e');
select test.affects($$ delete from storage.objects where bucket_id = 'club-logos' $$, 0, '다른 Club 의 운영자 E 도 지울 수 없다');
select test.anon();
select test.is($$ select count(*) from storage.objects where bucket_id = 'club-logos' $$, '0', '로그인하지 않으면 로고 파일을 읽을 수 없다');

-- ---------------------------------------------------------------------------
-- 로고 파일이 남은 Club 은 지우지 못한다
-- ---------------------------------------------------------------------------

select test.login('a');
select test.throws($$ delete from public.clubs where id = test.get('club')::uuid $$, '23503', '로고 파일이 남아 있으면 Club 을 지우지 못한다');
select test.affects($$ update public.clubs set logo_path = null where id = test.get('club')::uuid $$, 1, '로고 경로를 비운다');
select test.throws($$ delete from public.clubs where id = test.get('club')::uuid $$, '23503', '경로를 비워도 자리에 파일이 남아 있으면 지우지 못한다');
select test.affects($$ delete from storage.objects where bucket_id = 'club-logos' $$, 1, '운영자 A 가 로고 파일을 지운다');
select test.affects($$ delete from public.clubs where id = test.get('club')::uuid $$, 1, '파일을 지운 뒤에는 Club 을 지운다');

-- 계정을 지우면서 함께 지워지는 Club 에도 같은 규칙이 적용된다.
select test.login('e');
select test.affects($$ insert into storage.objects (bucket_id, name) values ('club-logos', test.logo_path('other_club', '55555555-5555-4555-8555-555555555555.webp')) $$, 1, 'E 가 혼자 있는 Club 에 로고를 올린다');
select test.throws($$ select public.delete_my_account(false) $$, '23503', '함께 지워질 Club 의 로고 파일이 남아 있으면 계정을 지우지 못한다');
select test.is($$ select count(*) from public.clubs $$, '1', '계정을 지우지 못했으니 Club 도 그대로다');
select test.affects($$ delete from storage.objects where bucket_id = 'club-logos' $$, 1, 'E 가 로고 파일을 지운다');
select test.affects($$ select public.delete_my_account(false) $$, 1, '그 뒤에는 계정을 지운다');
select test.sudo_is($$ select count(*) from public.clubs $$, '0', '혼자 있던 Club 도 함께 지워진다');
