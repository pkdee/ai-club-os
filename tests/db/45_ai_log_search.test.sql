-- AI Log 검색과 도구 목록 함수. A 는 운영자, B 는 같은 Club 의 구성원, C 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '3회차', now(), now() + interval '2 hours');
select test.remember('session', $$ select id from public.sessions where title = '3회차' $$);
select test.sudo($$ insert into public.members (club_id, user_id, role, display_name) values (test.get('club')::uuid, test.uid('b'), 'member', '박서연') $$);
insert into public.ai_logs (club_id, title, tools, attempt, learned) values
  (test.get('club')::uuid, '프롬프트 실험', array['ChatGPT', 'Claude Code'], 'snake_case 로 이름을 바꿨다', 'Cursor 가 편했다'),
  (test.get('club')::uuid, 'cursor 로 리팩터링', array['Cursor', 'Claude'], '함수 단위로 나눴다', ''),
  (test.get('club')::uuid, '회의록 요약', array['ChatGPT', 'Claude Code'], '요약을 시켰다', '');
select test.login('b');
insert into public.ai_logs (club_id, session_id, title, tools, attempt, result) values
  (test.get('club')::uuid, test.get('session')::uuid, 'RAG 검색 품질 비교', array['Claude', 'LangChain'], '청크 크기를 바꿔 봤다', '정답률이 100% 는 아니었다');
insert into public.ai_logs (club_id, title, tools, attempt) values
  (test.get('club')::uuid, '다시 요약', array['chatgpt', 'claudecode'], '한 번 더 해 봤다');
select test.login('c');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.ai_logs (club_id, title, tools, attempt) values (test.get('other_club')::uuid, 'RAG 다른 Club 의 기록', '{Gemini}', 'x');

-- 찾는 글자.
select test.login('a');
select test.is($$ select title from public.search_ai_logs(test.get('club')::uuid, 'rag') $$, 'RAG 검색 품질 비교', '제목에서 대소문자를 가리지 않고 찾고, 다른 Club 의 기록은 나오지 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '청크') $$, '1', '시도한 내용에서 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '정답률') $$, '1', '결과에서 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, 'cursor') $$, '2', '배운 점과 제목, 도구 이름을 함께 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, 'langchain') $$, '1', '도구 이름에서 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '청크크기') $$, '1', '붙여 쓴 글자로 띄어 쓴 내용을 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '청크   크기') $$, '1', '띄어 쓴 글자로도 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, 'claudecode') $$, '3', '붙여 쓴 글자로 띄어 쓴 도구 이름을 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, 'rag langchain') $$, '1', '낱말이 여러 개면 모두 들어 있는 기록을 찾는다. 서로 다른 칸에 있어도 된다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, 'rag chatgpt') $$, '0', '낱말 가운데 하나라도 없으면 나오지 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '비교청크') $$, '0', '낱말이 두 칸에 걸쳐 찾아지지는 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '100%') $$, '1', '% 가 들어간 글자를 그대로 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '%') $$, '1', '% 는 아무 글자나 뜻하지 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '_') $$, '1', '_ 는 아무 글자나 뜻하지 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '  rag  ') $$, '1', '앞뒤 공백은 빼고 찾는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '') $$, '5', '찾는 글자가 비어 있으면 Club 의 기록이 모두 나온다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid) $$, '5', '찾는 글자를 주지 않아도 된다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '없는 글자') $$, '0', '맞는 기록이 없으면 아무것도 나오지 않는다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('other_club')::uuid, 'rag') $$, '0', '다른 Club 의 식별자를 넣어도 그 Club 의 기록은 나오지 않는다');

-- 도구로 고르기.
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '', 'claude') $$, '2', '도구 이름은 대소문자를 가리지 않고 고른다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '', ' CHATGPT ') $$, '3', '표기가 다른 같은 도구의 기록이 함께 나온다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '', 'claude code') $$, '3', '공백만 다른 도구 이름도 같은 도구로 본다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '', 'clau') $$, '0', '도구로 고를 때는 이름의 일부만으로는 찾지 않는다');
select test.is($$ select title from public.search_ai_logs(test.get('club')::uuid, 'cursor', 'ChatGPT') $$, '프롬프트 실험', '찾는 글자와 도구를 함께 걸 수 있다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '', '') $$, '5', '도구가 비어 있으면 고르지 않은 것으로 본다');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '', 'cursor') where session_id is null $$, '1', '결과에 Session 조건을 이어서 걸 수 있다');

-- 도구 목록.
select test.login('b');
select test.is($$ select tool || '|' || log_count from public.club_tool_counts(test.get('club')::uuid) limit 1 $$, 'ChatGPT|3', '표기만 다른 이름은 합쳐서 세고 가장 많이 쓰인 표기를 보여 준다');
select test.is($$ select string_agg(tool || '=' || log_count, ',' order by tool) from public.club_tool_counts(test.get('club')::uuid) $$, 'ChatGPT=3,Claude=2,Claude Code=3,Cursor=1,LangChain=1', '도구 목록에 이 Club 에서 쓰인 도구가 하나씩 나온다');

select test.login('c');
select test.is($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '') $$, '0', '다른 Club 의 C 는 이 Club 의 기록을 찾지 못한다');
select test.is($$ select count(*) from public.club_tool_counts(test.get('club')::uuid) $$, '0', '다른 Club 의 C 에게는 이 Club 의 도구 목록이 나오지 않는다');

select test.anon();
select test.throws($$ select count(*) from public.search_ai_logs(test.get('club')::uuid, '') $$, '42501', '로그인하지 않으면 검색 함수를 부르지 못한다');
select test.throws($$ select count(*) from public.club_tool_counts(test.get('club')::uuid) $$, '42501', '로그인하지 않으면 도구 목록 함수를 부르지 못한다');
