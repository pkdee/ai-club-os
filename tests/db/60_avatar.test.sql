-- 프로필 사진 주소. A 와 B 는 Google 사진이 있고, D 는 없고, E 는 엉뚱한 주소를 넣어 두었다.

select test.sudo_is($$ select private.avatar_url_from('{"avatar_url":"https://lh3.googleusercontent.com/a/x"}') $$, 'https://lh3.googleusercontent.com/a/x', 'Google 의 사진 주소는 그대로 받는다');
select test.sudo_is($$ select private.avatar_url_from('{"avatar_url":"  ","picture":"https://lh4.googleusercontent.com/p"}') $$, 'https://lh4.googleusercontent.com/p', 'avatar_url 이 비어 있으면 picture 를 쓴다');
select test.sudo_is($$ select (private.avatar_url_from('{"avatar_url":"http://lh3.googleusercontent.com/a/x"}') is null)::text $$, 'true', 'http 주소는 버린다');
select test.sudo_is($$ select (private.avatar_url_from('{"avatar_url":"https://lh3.googleusercontent.com.evil.example/a"}') is null)::text $$, 'true', '뒤에 다른 주소가 붙은 것은 버린다');
select test.sudo_is($$ select (private.avatar_url_from('{"avatar_url":"https://lh3.googleusercontent.com@evil.example/a"}') is null)::text $$, 'true', '계정 표기로 속인 주소는 버린다');
select test.sudo_is($$ select (private.avatar_url_from('{"avatar_url":"https://evil.example/https://lh3.googleusercontent.com/a"}') is null)::text $$, 'true', '경로에 Google 주소를 끼운 것은 버린다');
select test.sudo_is($$ select (private.avatar_url_from('{"avatar_url":"javascript:alert(1)"}') is null)::text $$, 'true', '스크립트 주소는 버린다');
select test.sudo_is($$ select (private.avatar_url_from('{}') is null)::text $$, 'true', '사진 정보가 없으면 비운다');
select test.sudo_is($$ select (private.avatar_url_from(jsonb_build_object('avatar_url', 'https://lh3.googleusercontent.com/' || repeat('a', 1100))) is null)::text $$, 'true', '너무 긴 주소는 버린다');

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
insert into public.clubs (name) values ('두 번째 Club');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
select test.is($$ select avatar_url from public.members where club_id = test.get('club')::uuid $$, 'https://lh3.googleusercontent.com/a/AAA=s96-c', 'Club 을 만들면 사진 주소도 들어간다');

select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.is($$ select avatar_url from public.members where user_id = test.uid('b') $$, 'https://lh5.googleusercontent.com/a-/BBB', '초대로 참여하면 사진 주소도 들어간다');
select test.is($$ select count(*) from public.members where avatar_url is not null $$, '2', '같은 Club 의 Member 는 서로의 사진 주소를 읽는다');
select test.throws($$ update public.members set avatar_url = 'https://lh3.googleusercontent.com/a/FAKE' where user_id = test.uid('b') $$, '42501', '사진 주소를 직접 고칠 수 없다');

select test.login('d');
select public.join_club(test.get('token')) is not null;
select test.is($$ select (avatar_url is null)::text from public.members where user_id = test.uid('d') $$, 'true', '사진이 없는 사람은 비어 있다');
select test.login('e');
select public.join_club(test.get('token')) is not null;
select test.is($$ select (avatar_url is null)::text from public.members where user_id = test.uid('e') $$, 'true', '엉뚱한 주소를 넣어 둔 사람은 비어 있다');
select public.sync_my_avatar();
select test.is($$ select (avatar_url is null)::text from public.members where user_id = test.uid('e') $$, 'true', '엉뚱한 주소는 맞추기를 불러도 들어가지 않는다');

-- 사진을 새로 넣거나 바꾸거나 지운 뒤 로그인하는 경우.
select test.sudo($$ update auth.users set raw_user_meta_data = raw_user_meta_data || '{"avatar_url":"https://lh3.googleusercontent.com/a/DDD"}' where id = test.uid('d') $$);
select test.login('d');
select public.sync_my_avatar();
select test.is($$ select avatar_url from public.members where user_id = test.uid('d') $$, 'https://lh3.googleusercontent.com/a/DDD', '사진이 생긴 뒤 맞추면 들어간다');
select test.sudo($$ update auth.users set raw_user_meta_data = raw_user_meta_data || '{"avatar_url":"https://lh3.googleusercontent.com/a/NEW=s96-c"}' where id = test.uid('a') $$);
select test.login('a');
select public.sync_my_avatar();
select test.sudo_is($$ select count(*) from public.members where user_id = test.uid('a') and avatar_url = 'https://lh3.googleusercontent.com/a/NEW=s96-c' $$, '2', '사진을 바꾼 뒤 맞추면 속한 Club 두 곳이 모두 바뀐다');
select test.sudo_is($$ select avatar_url from public.members where user_id = test.uid('b') $$, 'https://lh5.googleusercontent.com/a-/BBB', '남의 사진 주소는 그대로다');
select test.sudo($$ update auth.users set raw_user_meta_data = raw_user_meta_data - 'avatar_url' where id = test.uid('d') $$);
select test.login('d');
select public.sync_my_avatar();
select test.is($$ select (avatar_url is null)::text from public.members where user_id = test.uid('d') $$, 'true', '사진을 지운 뒤 맞추면 비워진다');

select test.throws($$ select test.sudo($q$ update public.members set avatar_url = 'https://evil.example/pixel.png' where user_id = test.uid('b') $q$) $$, '23514', '관리자 권한으로도 엉뚱한 주소는 넣을 수 없다');

select test.anon();
select test.throws($$ select public.sync_my_avatar() $$, '42501', '로그인하지 않으면 맞추기 함수를 부르지 못한다');
select test.throws($$ select public.join_club(test.get('token')) $$, '42501', '함수를 바꾼 뒤에도 로그인하지 않으면 참여 함수를 부르지 못한다');

select test.login_without_claims();
select public.sync_my_avatar();
select test.sudo_is($$ select count(*) from public.members where avatar_url is not null $$, '3', '로그인 정보가 비어 있으면 맞추기를 불러도 아무것도 바뀌지 않는다');
