-- Session 의 접근 규칙. A 는 운영자, B 는 같은 Club 의 구성원, C 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
select test.sudo($$ insert into public.members (club_id, user_id, role, display_name) values (test.get('club')::uuid, test.uid('b'), 'member', '박서연') $$);
select test.login('c');
insert into public.clubs (name) values ('다른 Club');

select test.login('a');
select test.is($$ insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '3회차', '2026-10-08T19:00:00+09:00', '2026-10-08T21:00:00+09:00') returning title $$, '3회차', '운영자 A 가 Session 을 만들고 만든 행을 돌려받는다');
select test.remember('session', $$ select id from public.sessions where title = '3회차' $$);
select test.is($$ select (created_by = test.uid('a'))::text from public.sessions $$, 'true', '만든 사람은 로그인한 사용자로 정해진다');

select test.login('b');
select test.is($$ select count(*) from public.sessions $$, '1', '구성원 B 는 Session 을 본다');
select test.throws($$ insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '구성원이 만듦', now(), now() + interval '1 hour') $$, '42501', '구성원 B 는 Session 을 만들지 못한다');
select test.affects($$ update public.sessions set title = '구성원이 고침' $$, 0, '구성원 B 는 Session 을 고치지 못한다');

select test.login('c');
select test.is($$ select count(*) from public.sessions $$, '0', '다른 Club 의 C 에게는 Session 이 보이지 않는다');
select test.throws($$ insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '끼어들기', now(), now() + interval '1 hour') $$, '42501', '다른 Club 의 운영자 C 는 이 Club 에 Session 을 만들지 못한다');

select test.login('a');
select test.affects($$ update public.sessions set title = '3회차 · RAG 기초 실습', location = '공학관 302호' where id = test.get('session')::uuid $$, 1, '운영자 A 가 Session 을 고친다');
select test.is($$ select (updated_at > created_at)::text from public.sessions $$, 'true', '고치면 고친 시각이 바뀐다');
select test.throws($$ update public.sessions set club_id = gen_random_uuid() $$, '42501', 'Session 을 다른 Club 으로 옮길 수 없다');
select test.throws($$ insert into public.sessions (club_id, title, starts_at, ends_at, created_by) values (test.get('club')::uuid, '남의 이름으로', now(), now() + interval '1 hour', test.uid('b')) $$, '42501', '만든 사람을 직접 적어 넣을 수 없다');
select test.throws($$ insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '거꾸로', now(), now() - interval '1 hour') $$, '23514', '끝나는 시각이 시작보다 앞설 수 없다');
select test.throws($$ insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '   ', now(), now() + interval '1 hour') $$, '23514', '빈 제목은 넣을 수 없다');
select test.throws($$ insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, repeat('가', 81), now(), now() + interval '1 hour') $$, '23514', '81자 제목은 넣을 수 없다');

select test.anon();
select test.throws($$ select count(*) from public.sessions $$, '42501', '로그인하지 않으면 Session 을 읽지 못한다');

select test.sudo($$ delete from public.clubs where id = test.get('club')::uuid $$);
select test.sudo_is($$ select count(*) from public.sessions $$, '0', 'Club 이 삭제되면 Session 도 삭제된다');
