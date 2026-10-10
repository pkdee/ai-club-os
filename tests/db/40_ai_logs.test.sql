-- AI Log 의 접근 규칙. A 는 운영자, B 는 같은 Club 의 구성원, C 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '3회차', now(), now() + interval '2 hours');
select test.remember('session', $$ select id from public.sessions where title = '3회차' $$);
select test.sudo($$ insert into public.members (club_id, user_id, role, display_name) values (test.get('club')::uuid, test.uid('b'), 'member', '박서연') $$);
select test.login('c');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('other_club')::uuid, '다른 회차', now(), now() + interval '1 hour');
select test.remember('other_session', $$ select id from public.sessions where title = '다른 회차' $$);

select test.login('b');
select test.is($$ insert into public.ai_logs (club_id, session_id, title, tools, attempt)
  values (test.get('club')::uuid, test.get('session')::uuid, 'RAG 검색 품질 비교', '{Claude,LangChain}', '청크 크기를 바꿔 봤다')
  returning (author_id = test.uid('b'))::text $$, 'true', '구성원 B 가 Session 에 기록을 남기면 작성자는 본인이 된다');
select test.remember('log', $$ select id from public.ai_logs where title = 'RAG 검색 품질 비교' $$);
select test.throws($$ insert into public.ai_logs (club_id, author_id, title, attempt) values (test.get('club')::uuid, test.uid('a'), '남의 이름으로', 'x') $$, '42501', '작성자를 직접 적어 넣을 수 없다');
select test.throws($$ insert into public.ai_logs (club_id, session_id, title, attempt) values (test.get('club')::uuid, test.get('other_session')::uuid, '남의 회차', 'x') $$, '23503', '다른 Club 의 Session 에 묶을 수 없다');
select test.throws($$ insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, '   ', 'x') $$, '23514', '빈 제목은 넣을 수 없다');
select test.throws($$ insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, '제목', '  ') $$, '23514', '빈 시도한 내용은 넣을 수 없다');
select test.throws($$ insert into public.ai_logs (club_id, title, attempt, tools) values (test.get('club')::uuid, '제목', 'x', '{1,2,3,4,5,6,7,8,9,10,11}') $$, '23514', '도구는 10개까지만 넣을 수 있다');
select test.throws($$ insert into public.ai_logs (club_id, title, attempt, tools) values (test.get('club')::uuid, '제목', 'x', array['Claude', ' ']) $$, '23514', '빈 도구 이름은 넣을 수 없다');
select test.throws($$ insert into public.ai_logs (club_id, title, attempt, tools) values (test.get('club')::uuid, '제목', 'x', array[repeat('가', 31)]) $$, '23514', '31자 도구 이름은 넣을 수 없다');

select test.login('a');
select test.affects($$ insert into public.ai_logs (club_id, title, attempt, tools) values (test.get('club')::uuid, '프롬프트 실험', '세 가지 구조로 실험', array['1','2','3','4','5','6','7','8','9', repeat('가', 30)]) $$, 1, '운영자 A 가 Session 없이, 도구 10개로 기록을 남긴다');
select test.is($$ select count(*) from public.ai_logs $$, '2', '같은 Club 의 Member 는 서로의 기록을 본다');
select test.affects($$ update public.ai_logs set title = '운영자가 고침' where id = test.get('log')::uuid $$, 0, '운영자라도 남의 기록은 고치지 못한다');

select test.login('c');
select test.is($$ select count(*) from public.ai_logs $$, '0', '다른 Club 의 C 에게는 기록이 보이지 않는다');
select test.throws($$ insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, '끼어들기', 'x') $$, '42501', '다른 Club 의 C 는 이 Club 에 기록을 남기지 못한다');

select test.login('b');
select test.affects($$ update public.ai_logs set title = 'RAG 검색 품질을 청크 크기로 비교', tools = '{Claude}', attempt = attempt, result = '500 토큰이 가장 안정적', learned = '', next_action = '', session_id = null where id = test.get('log')::uuid $$, 1, 'B 가 자기 기록을 고치고 Session 연결을 뗀다');
select test.is($$ select (updated_at > created_at)::text from public.ai_logs where id = test.get('log')::uuid $$, 'true', '내용을 고치면 고친 시각이 바뀐다');
select test.remember('before', $$ select updated_at::text from public.ai_logs where id = test.get('log')::uuid $$);
select test.affects($$ update public.ai_logs set title = title, tools = tools, attempt = attempt, result = result, learned = learned, next_action = next_action, session_id = test.get('session')::uuid where id = test.get('log')::uuid $$, 1, 'B 가 내용은 그대로 두고 Session 만 다시 묶는다');
select test.is($$ select (updated_at::text <> test.get('before'))::text from public.ai_logs where id = test.get('log')::uuid $$, 'true', 'Session 만 바꿔도 본인이 고친 것이므로 고친 시각이 바뀐다');
select test.remember('before', $$ select updated_at::text from public.ai_logs where id = test.get('log')::uuid $$);
select test.affects($$ update public.ai_logs set title = title, tools = tools, attempt = attempt, result = result, learned = learned, next_action = next_action, session_id = session_id where id = test.get('log')::uuid $$, 1, 'B 가 아무것도 바꾸지 않고 저장한다');
select test.is($$ select (updated_at::text = test.get('before'))::text from public.ai_logs where id = test.get('log')::uuid $$, 'true', '바뀐 것이 없으면 고친 시각은 그대로다');
select test.throws($$ update public.ai_logs set club_id = test.get('other_club')::uuid where id = test.get('log')::uuid $$, '42501', '기록을 다른 Club 으로 옮길 수 없다');

select test.anon();
select test.throws($$ select count(*) from public.ai_logs $$, '42501', '로그인하지 않으면 기록을 읽지 못한다');

-- Session, Member, Club 이 삭제될 때의 기록.
select test.remember('before', $$ select updated_at::text from public.ai_logs where id = test.get('log')::uuid $$);
select test.sudo($$ delete from public.sessions where id = test.get('session')::uuid $$);
select test.sudo_is($$ select (session_id is null)::text || '|' || (updated_at::text = test.get('before'))::text from public.ai_logs where id = test.get('log')::uuid $$, 'true|true', 'Session 이 삭제되면 기록은 남고 연결만 비며 고친 시각은 그대로다');
select test.sudo($$ delete from public.members where user_id = test.uid('b') $$);
select test.sudo_is($$ select (author_id is null)::text from public.ai_logs where id = test.get('log')::uuid $$, 'true', 'Member 가 빠지면 기록은 작성자 없이 남는다');
select test.login('b');
select test.is($$ select count(*) from public.ai_logs $$, '0', '빠진 사람에게는 기록이 보이지 않는다');
select test.affects($$ update public.ai_logs set title = '빠진 뒤 고침' $$, 0, '빠진 사람은 예전 기록을 고치지 못한다');
select test.sudo($$ delete from public.clubs where id = test.get('club')::uuid $$);
select test.sudo_is($$ select count(*) from public.ai_logs $$, '0', 'Club 이 삭제되면 기록도 삭제된다');
