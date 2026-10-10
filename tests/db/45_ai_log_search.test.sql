-- AI Log 검색과 도구 목록 함수. A 는 운영자, B 는 같은 Club 의 구성원, C 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '3회차', now(), now() + interval '2 hours');
select test.remember('session', $$ select id from public.sessions where title = '3회차' $$);
select test.sudo($$ insert into public.members (club_id, user_id, role, display_name) values (test.get('club')::uuid, test.uid('b'), 'member', '박서연') $$);
insert into public.ai_logs (club_id, title, tools, attempt, learned) values
  (test.get('club')::uuid, '프롬프트 실험', '{ChatGPT}', 'snake_case 로 이름을 바꿨다', 'Cursor 가 편했다'),
  (test.get('club')::uuid, 'cursor 로 리팩터링', '{Cursor,Claude}', '함수 단위로 나눴다', '');
select test.login('b');
insert into public.ai_logs (club_id, session_id, title, tools, attempt, result) values
  (test.get('club')::uuid, test.get('session')::uuid, 'RAG 검색 품질 비교', '{Claude,LangChain}', '청크 크기를 바꿔 봤다', '정답률이 100% 는 아니었다');
select test.login('c');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.ai_logs (club_id, title, tools, attempt) values (test.get('other_club')::uuid, 'RAG 다른 Club 의 기록', '{Gemini}', 'x');

select test.login('a');
select test.is($$ select title from public.search_ai_logs(test.get('club')::uuid, 'rag') $$, 'RAG 검색 품질 비교', '제목에서 대소문자를 가리지 않고 찾고, 다른 Club 의 기록은 나오지 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '청크') $$, '1', '시도한 내용에서 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '정답률') $$, '1', '결과에서 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, 'cursor') $$, '2', '배운 점과 제목, 도구 이름을 함께 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, 'langchain') $$, '1', '도구 이름에서 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '100%') $$, '1', '% 가 들어간 글자를 그대로 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '%') $$, '1', '% 는 아무 글자나 뜻하지 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '_') $$, '1', '_ 는 아무 글자나 뜻하지 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '  rag  ') $$, '1', '앞뒤 공백은 빼고 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '') $$, '3', '찾는 글자가 비어 있으면 Club 의 기록이 모두 나온다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '없는 글자') $$, '0', '맞는 기록이 없으면 아무것도 나오지 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '') where session_id is null and tools @> array['Cursor'] $$, '1', '결과에 Session 과 도구 조건을 이어서 걸 수 있다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('other_club')::uuid, 'rag') $$, '0', '다른 Club 의 식별자를 넣어도 그 Club 의 기록은 나오지 않는다');

select test.login('b');
select test.is($$ select tool || '|' || log_count from public.club_tool_counts(test.get('club')::uuid) limit 1 $$, 'Claude|2', '도구 목록은 많이 쓰인 순서로 나온다');
select test.is($$ select string_agg(tool, ',' order by tool) from public.club_tool_counts(test.get('club')::uuid) $$, 'ChatGPT,Claude,Cursor,LangChain', '도구 목록에 이 Club 에서 쓰인 도구가 모두 나온다');

select test.login('c');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '') $$, '0', '다른 Club 의 C 는 이 Club 의 기록을 찾지 못한다');
select test.is($$ select count(*) from public.club_tool_counts(test.get('club')::uuid) $$, '0', '다른 Club 의 C 에게는 이 Club 의 도구 목록이 나오지 않는다');

select test.anon();
select test.throws($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '') $$, '42501', '로그인하지 않으면 검색 함수를 부르지 못한다');
select test.throws($$ select count(*) from public.club_tool_counts(test.get('club')::uuid) $$, '42501', '로그인하지 않으면 도구 목록 함수를 부르지 못한다');
