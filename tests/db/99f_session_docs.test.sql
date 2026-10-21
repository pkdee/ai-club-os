-- Session 에 참고 자료로 이어 둔 Docs 의 문서.
-- A 는 운영자, B 는 초대로 들어온 구성원, D 는 Member 가 아니고, E 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '3회차', now() + interval '1 day', now() + interval '1 day' + interval '2 hours');
select test.remember('session', $$ select id from public.sessions where title = '3회차' $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.login('e');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('other_club')::uuid, '다른 회차', now() + interval '1 day', now() + interval '1 day' + interval '2 hours');
select test.remember('other_session', $$ select id from public.sessions where title = '다른 회차' $$);

-- ---------------------------------------------------------------------------
-- 잇기
-- ---------------------------------------------------------------------------

select test.login('a');
select test.affects($$ insert into public.session_docs (session_id, doc_slug, club_id) values (test.get('session')::uuid, 'context-engineering', test.get('club')::uuid) $$, 1, '운영자 A 가 Session 에 문서를 잇는다');
select test.sudo_is($$ select (created_by = test.uid('a'))::text from public.session_docs $$, 'true', '이은 사람은 A 로 적힌다');
select test.throws($$ insert into public.session_docs (session_id, doc_slug, club_id) values (test.get('session')::uuid, 'context-engineering', test.get('club')::uuid) $$, '23505', '같은 문서를 두 번 이을 수 없다');
select test.throws($$ insert into public.session_docs (session_id, doc_slug, club_id) values (test.get('session')::uuid, 'Context_Engineering', test.get('club')::uuid) $$, '23514', 'slug 모양이 아니면 받지 않는다');
select test.throws($$ insert into public.session_docs (session_id, doc_slug, club_id) values (test.get('session')::uuid, '../list', test.get('club')::uuid) $$, '23514', '경로처럼 보이는 값은 받지 않는다');
select test.throws($$ insert into public.session_docs (session_id, doc_slug, club_id) values (test.get('session')::uuid, repeat('a', 101), test.get('club')::uuid) $$, '23514', '100자를 넘는 slug 는 받지 않는다');
select test.throws($$ insert into public.session_docs (session_id, doc_slug, club_id, created_by) values (test.get('session')::uuid, 'getting-started', test.get('club')::uuid, test.uid('b')) $$, '42501', '이은 사람을 정해서 넣을 수 없다');
select test.throws($$ insert into public.session_docs (session_id, doc_slug, club_id) values (test.get('other_session')::uuid, 'getting-started', test.get('club')::uuid) $$, '23503', '다른 Club 의 Session 을 내 Club 의 것처럼 적을 수 없다');
select test.throws($$ insert into public.session_docs (session_id, doc_slug, club_id) values (test.get('other_session')::uuid, 'getting-started', test.get('other_club')::uuid) $$, '42501', '다른 Club 의 Session 에는 이을 수 없다');

-- ---------------------------------------------------------------------------
-- 보기, 고치기, 빼기
-- ---------------------------------------------------------------------------

select test.login('b');
select test.is($$ select count(*) from public.session_docs $$, '1', '구성원 B 는 이어 둔 문서를 본다');
select test.throws($$ insert into public.session_docs (session_id, doc_slug, club_id) values (test.get('session')::uuid, 'getting-started', test.get('club')::uuid) $$, '42501', '구성원 B 는 이을 수 없다');
select test.affects($$ delete from public.session_docs $$, 0, '구성원 B 는 뺄 수 없다');
select test.throws($$ update public.session_docs set doc_slug = 'getting-started' $$, '42501', '이어 둔 줄은 고칠 수 없다');
select test.login('d');
select test.is($$ select count(*) from public.session_docs $$, '0', 'Member 가 아닌 D 에게는 보이지 않는다');
select test.login('e');
select test.is($$ select count(*) from public.session_docs $$, '0', '다른 Club 의 운영자 E 에게도 보이지 않는다');
select test.affects($$ delete from public.session_docs $$, 0, 'E 는 뺄 수 없다');
select test.anon();
select test.throws($$ select count(*) from public.session_docs $$, '42501', '로그인하지 않으면 읽을 수 없다');
select test.login('a');
select test.affects($$ delete from public.session_docs $$, 1, '운영자 A 가 뺀다');

-- ---------------------------------------------------------------------------
-- 함께 지워지는 것
-- ---------------------------------------------------------------------------

insert into public.session_docs (session_id, doc_slug, club_id) values (test.get('session')::uuid, 'getting-started', test.get('club')::uuid);
select test.affects($$ delete from public.sessions where id = test.get('session')::uuid $$, 1, '운영자가 Session 을 지운다');
select test.sudo_is($$ select count(*) from public.session_docs $$, '0', 'Session 을 지우면 이어 둔 줄도 지워진다');
