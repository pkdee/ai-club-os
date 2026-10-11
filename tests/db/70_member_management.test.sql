-- 역할 바꾸기, 내보내기와 나가기, 마지막 운영자 규칙. A 는 운영자, B 와 C 는 초대로 들어온 구성원, D 는 Member 가 아니다.

select test.login('a');
insert into public.clubs (name, description) values ('AI 모각코', '매주 목요일');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '3회차', now(), now() + interval '1 hour');
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.remember('member_a', $$ select id from public.members where user_id = test.uid('a') $$);
select test.remember('member_b', $$ select id from public.members where user_id = test.uid('b') $$);
select test.remember('member_c', $$ select id from public.members where user_id = test.uid('c') $$);
-- B 의 출석과 AI Log 를 남겨 둔다.
select test.login('a');
insert into public.attendance (club_id, session_id, member_id, status) select test.get('club')::uuid, id, test.get('member_b')::uuid, 'present' from public.sessions;
select test.login('b');
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'B 의 기록', 'x');

select test.login('c');
select test.affects($$ update public.members set role = 'admin' where id = test.get('member_c')::uuid $$, 0, '구성원 C 는 자기 역할을 올리지 못한다');
select test.affects($$ delete from public.members where id = test.get('member_b')::uuid $$, 0, '구성원 C 는 남을 내보내지 못한다');
select test.affects($$ update public.clubs set name = '구성원이 고침' $$, 0, '구성원 C 는 Club 을 고치지 못한다');

select test.login('d');
select test.affects($$ update public.members set role = 'admin' $$, 0, 'Member 가 아닌 D 는 역할을 바꾸지 못한다');
select test.affects($$ delete from public.members $$, 0, 'Member 가 아닌 D 는 아무도 내보내지 못한다');

select test.login('a');
select test.affects($$ update public.members set role = 'admin' where id = test.get('member_b')::uuid $$, 1, '운영자 A 가 B 를 운영자로 지정한다');
select test.throws($$ update public.members set role = 'owner' where id = test.get('member_c')::uuid $$, '23514', '없는 역할은 넣을 수 없다');
select test.throws($$ update public.members set display_name = '바꿈' where id = test.get('member_c')::uuid $$, '42501', '역할 말고 이름은 고칠 수 없다');
select test.throws($$ update public.members set user_id = test.uid('d') where id = test.get('member_c')::uuid $$, '42501', 'Member 의 사람을 바꿀 수 없다');
select test.throws($$ update public.members set club_id = gen_random_uuid() where id = test.get('member_c')::uuid $$, '42501', 'Member 를 다른 Club 으로 옮길 수 없다');

select test.login('b');
select test.affects($$ update public.members set role = 'member' where id = test.get('member_a')::uuid $$, 1, '운영자 B 가 다른 운영자 A 를 구성원으로 내린다');
select test.login('a');
select test.affects($$ update public.members set role = 'admin' where id = test.get('member_a')::uuid $$, 0, '구성원이 된 A 는 자기 역할을 되돌리지 못한다');

select test.login('b');
select test.throws($$ update public.members set role = 'member' where id = test.get('member_b')::uuid $$, 'P0001', '마지막 운영자 B 는 스스로 내려올 수 없다');
select test.throws($$ delete from public.members where id = test.get('member_b')::uuid $$, 'P0001', '마지막 운영자 B 는 나갈 수 없다');
select test.affects($$ update public.members set role = 'admin' where id = test.get('member_a')::uuid $$, 1, 'B 가 A 를 다시 운영자로 지정한다');
select test.affects($$ update public.members set role = 'member' where id = test.get('member_b')::uuid $$, 1, '다른 운영자가 있으면 스스로 내려올 수 있다');

select test.login('a');
select test.is($$ with removed as (delete from public.members where id = test.get('member_b')::uuid returning id) select count(*) from removed $$, '1', '운영자 A 가 B 를 내보내고 지운 행을 돌려받는다');
select test.sudo_is($$ select count(*) from public.attendance $$, '0', '내보낸 사람의 출석은 함께 삭제된다');
select test.sudo_is($$ select (author_id is null)::text from public.ai_logs where title = 'B 의 기록' $$, 'true', '내보낸 사람의 AI Log 는 작성자 없이 남는다');
select test.login('b');
select test.is($$ select count(*) from public.clubs $$, '0', '내보내진 B 에게는 Club 이 보이지 않는다');

select test.login('c');
select test.affects($$ delete from public.members where user_id = test.uid('c') $$, 1, '구성원 C 가 스스로 나간다');
select test.is($$ select count(*) from public.clubs $$, '0', '나간 C 에게는 Club 이 보이지 않는다');

select test.login('a');
select test.throws($$ delete from public.members where user_id = test.uid('a') $$, 'P0001', '혼자 남은 운영자 A 는 나갈 수 없다');
select test.throws($$ select test.sudo($q$ delete from public.members where user_id = test.uid('a') $q$) $$, 'P0001', '관리자 권한으로도 마지막 운영자의 행만 지울 수는 없다');

select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.is($$ select role from public.members where user_id = test.uid('c') $$, 'member', '나갔던 C 가 초대 링크로 다시 들어오면 구성원이다');

select test.anon();
select test.throws($$ delete from public.members $$, '42501', '로그인하지 않으면 Member 를 지우지 못한다');
select test.throws($$ update public.clubs set name = '몰래 고침' $$, '42501', '로그인하지 않으면 Club 을 고치지 못한다');

-- 계정이나 Club 이 삭제되면서 함께 지워지는 경우는 막지 않는다.
select test.sudo($$ delete from auth.users where id = test.uid('a') $$);
select test.sudo_is($$ select string_agg(display_name, ',') from public.members where role = 'admin' $$, 'other@example.com', '마지막 운영자의 계정이 삭제되면 남아 있던 구성원 C 가 운영자가 된다');
select test.sudo_is($$ select count(*) from public.clubs $$, '1', '그때도 Club 은 남는다');
select test.sudo($$ delete from public.clubs $$);
select test.sudo_is($$ select count(*) from public.members $$, '0', 'Club 이 삭제되면 Member 도 함께 삭제된다');
