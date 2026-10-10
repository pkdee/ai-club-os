-- AI Log, Session, Club 을 지우는 규칙. A 는 운영자, B 와 C 는 초대로 들어온 구성원, D 는 Member 가 아니고, E 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '3회차', now(), now() + interval '1 hour');
select test.remember('session', $$ select id from public.sessions where title = '3회차' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.remember('member_b', $$ select id from public.members where user_id = test.uid('b') $$);
select test.login('e');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('other_club')::uuid, '다른 회차', now(), now() + interval '1 hour');
insert into public.ai_logs (club_id, title, attempt) values (test.get('other_club')::uuid, 'E 의 기록', 'x');

-- 출석과 기록을 남겨 둔다.
select test.login('a');
insert into public.attendance (club_id, session_id, member_id, status) values (test.get('club')::uuid, test.get('session')::uuid, test.get('member_b')::uuid, 'present');
insert into public.ai_logs (club_id, session_id, title, attempt) values (test.get('club')::uuid, test.get('session')::uuid, 'A 의 기록', 'x');
select test.remember('log_a', $$ select id from public.ai_logs where title = 'A 의 기록' $$);
select test.login('b');
insert into public.ai_logs (club_id, session_id, title, attempt) values (test.get('club')::uuid, test.get('session')::uuid, 'B 의 기록', 'x');
select test.remember('log_b', $$ select id from public.ai_logs where title = 'B 의 기록' $$);
select test.login('c');
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'C 의 기록', 'x');
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'C 가 나가기 전에 남긴 기록', 'x');
select test.remember('log_c', $$ select id from public.ai_logs where title = 'C 의 기록' $$);
select test.remember('log_left', $$ select id from public.ai_logs where title = 'C 가 나가기 전에 남긴 기록' $$);

-- AI Log.
select test.affects($$ delete from public.ai_logs where id = test.get('log_b')::uuid $$, 0, '구성원 C 는 남의 기록을 지우지 못한다');
select test.affects($$ delete from public.ai_logs where id = test.get('log_a')::uuid $$, 0, '구성원 C 는 운영자의 기록도 지우지 못한다');
select test.login('d');
select test.affects($$ delete from public.ai_logs $$, 0, 'Member 가 아닌 D 는 기록을 지우지 못한다');
select test.login('e');
select test.affects($$ delete from public.ai_logs where club_id = test.get('club')::uuid $$, 0, '다른 Club 의 운영자 E 는 이 Club 의 기록을 지우지 못한다');
select test.anon();
select test.throws($$ delete from public.ai_logs $$, '42501', '로그인하지 않으면 기록을 지우지 못한다');

select test.login('b');
select test.is($$ with removed as (delete from public.ai_logs where id = test.get('log_b')::uuid returning id) select count(*) from removed $$, '1', '작성자 B 가 자기 기록을 지우고 지운 행을 돌려받는다');
select test.login('a');
select test.is($$ with removed as (delete from public.ai_logs where id = test.get('log_c')::uuid returning id) select count(*) from removed $$, '1', '운영자 A 가 구성원 C 의 기록을 지운다');
select test.login('c');
select test.affects($$ delete from public.members where user_id = test.uid('c') $$, 1, 'C 가 Club 에서 나간다');
select test.affects($$ delete from public.ai_logs where id = test.get('log_left')::uuid $$, 0, '나간 C 는 남기고 간 기록을 지우지 못한다');
select test.sudo_is($$ select (author_id is null)::text from public.ai_logs where id = test.get('log_left')::uuid $$, 'true', '그 기록은 작성자 없이 남아 있다');
select test.login('b');
select test.affects($$ delete from public.ai_logs where id = test.get('log_left')::uuid $$, 0, '구성원 B 는 작성자 없는 기록을 지우지 못한다');
select test.login('a');
select test.affects($$ delete from public.ai_logs where id = test.get('log_left')::uuid $$, 1, '작성자 없는 기록은 운영자가 지운다');
select test.sudo_is($$ select count(*) from public.ai_logs where club_id = test.get('other_club')::uuid $$, '1', '다른 Club 의 기록은 그대로다');

-- Session.
select test.login('b');
select test.affects($$ delete from public.sessions where id = test.get('session')::uuid $$, 0, '구성원 B 는 Session 을 지우지 못한다');
select test.login('e');
select test.affects($$ delete from public.sessions where id = test.get('session')::uuid $$, 0, '다른 Club 의 운영자 E 는 이 Club 의 Session 을 지우지 못한다');
select test.anon();
select test.throws($$ delete from public.sessions $$, '42501', '로그인하지 않으면 Session 을 지우지 못한다');

select test.login('a');
select test.remember('before', $$ select updated_at::text from public.ai_logs where id = test.get('log_a')::uuid $$);
select test.is($$ with removed as (delete from public.sessions where id = test.get('session')::uuid returning id) select count(*) from removed $$, '1', '운영자 A 가 Session 을 지우고 지운 행을 돌려받는다');
select test.sudo_is($$ select count(*) from public.attendance $$, '0', 'Session 을 지우면 그 회차의 Attendance 는 함께 지워진다');
select test.is($$ select (session_id is null)::text || '|' || (updated_at::text = test.get('before'))::text from public.ai_logs where id = test.get('log_a')::uuid $$, 'true|true', '그 회차의 AI Log 는 남고 연결만 비며 고친 시각은 그대로다');
select test.sudo_is($$ select count(*) from public.sessions where club_id = test.get('other_club')::uuid $$, '1', '다른 Club 의 Session 은 그대로다');

-- Club.
select test.login('b');
select test.affects($$ delete from public.clubs where id = test.get('club')::uuid $$, 0, '구성원 B 는 Club 을 지우지 못한다');
select test.login('d');
select test.affects($$ delete from public.clubs $$, 0, 'Member 가 아닌 D 는 Club 을 지우지 못한다');
select test.login('e');
select test.affects($$ delete from public.clubs where id = test.get('club')::uuid $$, 0, '다른 Club 의 운영자 E 는 이 Club 을 지우지 못한다');
select test.anon();
select test.throws($$ delete from public.clubs $$, '42501', '로그인하지 않으면 Club 을 지우지 못한다');

-- 지우기 전에 다시 채워 둔다. 운영자는 모두 같은 권한이므로 나중에 운영자가 된 B 도 지울 수 있다.
select test.login('a');
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '4회차', now(), now() + interval '1 hour');
insert into public.attendance (club_id, session_id, member_id, status) select test.get('club')::uuid, id, test.get('member_b')::uuid, 'late' from public.sessions where title = '4회차';
select test.affects($$ update public.members set role = 'admin' where id = test.get('member_b')::uuid $$, 1, 'A 가 B 를 운영자로 지정한다');
select test.affects($$ delete from public.clubs where id = test.get('other_club')::uuid $$, 0, '운영자 A 는 다른 Club 을 지우지 못한다');
select test.login('b');
select test.is($$ with removed as (delete from public.clubs where id = test.get('club')::uuid returning id) select count(*) from removed $$, '1', '나중에 운영자가 된 B 가 Club 을 지우고 지운 행을 돌려받는다');
select test.sudo_is($$ select (select count(*) from public.members where club_id = test.get('club')::uuid) || '|' || (select count(*) from public.sessions where club_id = test.get('club')::uuid) || '|' || (select count(*) from public.attendance where club_id = test.get('club')::uuid) || '|' || (select count(*) from public.ai_logs where club_id = test.get('club')::uuid) || '|' || (select count(*) from public.club_invites where club_id = test.get('club')::uuid) $$, '0|0|0|0|0', 'Club 을 지우면 Member, Session, Attendance, AI Log, 초대 링크가 모두 함께 지워진다');
select test.sudo_is($$ select count(*) from public.clubs $$, '1', '다른 Club 은 그대로다');
select test.login('a');
select test.is($$ select count(*) from public.clubs $$, '0', '지워진 Club 은 운영자였던 A 에게도 보이지 않는다');

-- 운영자가 혼자여도 Club 은 통째로 지울 수 있다. 마지막 운영자 규칙은 Club 이 남아 있을 때만 막는다.
select test.login('e');
select test.affects($$ delete from public.clubs where id = test.get('other_club')::uuid $$, 1, '혼자 운영하는 E 가 자기 Club 을 지운다');
select test.sudo_is($$ select (select count(*) from public.clubs) || '|' || (select count(*) from public.members) || '|' || (select count(*) from public.ai_logs) $$, '0|0|0', '그 Club 의 Member 와 기록도 남지 않는다');
