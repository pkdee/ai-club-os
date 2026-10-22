-- 이름 고치기, 알림을 본 시각, AI Log 수정 기록, 도구 표기 합치기, 맡긴 시각, Session 시간표, 발표 소개 글.
-- A 는 운영자, B 와 C 는 초대로 들어온 구성원, D 는 Member 가 아니고, E 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '1회차', '2026-10-01 10:00+09', '2026-10-01 12:00+09');
select test.remember('session', $$ select id from public.sessions where title = '1회차' $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.remember('member_b', $$ select id from public.members where user_id = test.uid('b') $$);
select test.remember('member_c', $$ select id from public.members where user_id = test.uid('c') $$);
select test.login('e');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.ai_logs (club_id, title, attempt, tools) values (test.get('other_club')::uuid, '다른 Club 의 기록', '시도', array['chatgpt']);

-- ---------------------------------------------------------------------------
-- 자기 이름 고치기
-- ---------------------------------------------------------------------------

select test.login('c');
select test.is($$ select public.set_my_display_name(test.get('club')::uuid, '   최   민준  ') $$, '최 민준', '이메일이 이름이던 C 가 자기 이름을 고치고, 공백은 다듬어진다');
select test.is($$ select display_name from public.members where user_id = test.uid('c') and club_id = test.get('club')::uuid $$, '최 민준', '고친 이름이 Member 행에 들어간다');
select test.throws($$ select public.set_my_display_name(test.get('club')::uuid, '   ') $$, '22023', '빈 이름으로는 고칠 수 없다');
select test.throws($$ select public.set_my_display_name(test.get('club')::uuid, repeat('가', 41)) $$, '22023', '41자 이름으로는 고칠 수 없다');
select test.is($$ select public.set_my_display_name(test.get('club')::uuid, repeat('가', 40)) $$, repeat('가', 40), '40자 이름은 된다');
select test.throws($$ select public.set_my_display_name(test.get('club')::uuid, 'someone@example.com') $$, '22023', '이름에 @ 를 쓸 수 없다');
select test.is($$ select public.set_my_display_name(test.get('club')::uuid, '최민준') $$, '최민준', '다시 고칠 수 있다');
select test.sudo_is($$ select string_agg(display_name, ',' order by created_at) from public.members where club_id = test.get('club')::uuid $$, '김하늘,박서연,최민준', '다른 사람의 이름은 그대로다');
select test.throws($$ update public.members set display_name = '직접 고침' where user_id = test.uid('c') $$, '42501', '함수를 거치지 않고는 자기 이름도 고칠 수 없다');
select test.login('a');
select test.throws($$ update public.members set display_name = '운영자가 고침' where user_id = test.uid('c') $$, '42501', '운영자도 남의 이름을 고칠 수 없다');
select test.login('d');
select test.is($$ select coalesce(public.set_my_display_name(test.get('club')::uuid, '끼어들기'), '없음') $$, '없음', 'Member 가 아닌 D 가 부르면 아무 일도 일어나지 않는다');
select test.login('e');
select test.is($$ select coalesce(public.set_my_display_name(test.get('club')::uuid, '다른 Club 사람'), '없음') $$, '없음', '다른 Club 의 E 가 부르면 아무 일도 일어나지 않는다');
select test.is($$ select public.set_my_display_name(test.get('other_club')::uuid, '이브 운영자') $$, '이브 운영자', '이름은 Club 마다 따로 고친다');
select test.anon();
select test.throws($$ select public.set_my_display_name(test.get('club')::uuid, '끼어들기') $$, '42501', '로그인하지 않으면 부르지 못한다');

-- ---------------------------------------------------------------------------
-- 알림을 본 시각
-- ---------------------------------------------------------------------------

select test.login('b');
select test.is($$ select count(*) from public.notification_reads $$, '0', '처음에는 본 시각이 없다');
select public.mark_notifications_seen(test.get('club')::uuid);
select test.is($$ select count(*) || '|' || bool_and(user_id = test.uid('b') and seen_at <= now()) from public.notification_reads $$, '1|true', 'B 가 알림을 보면 자기 시각이 남는다');
select test.remember('seen', $$ select seen_at::text from public.notification_reads $$);
select pg_sleep(0.01);
select public.mark_notifications_seen(test.get('club')::uuid);
select test.is($$ select count(*) || '|' || (seen_at::text > test.get('seen')) from public.notification_reads group by seen_at $$, '1|true', '다시 보면 줄은 그대로이고 시각만 바뀐다');
select test.throws($$ insert into public.notification_reads (club_id, user_id) values (test.get('club')::uuid, test.uid('b')) $$, '42501', '본 시각을 직접 넣을 수 없다');
select test.throws($$ update public.notification_reads set seen_at = now() - interval '1 year' $$, '42501', '본 시각을 직접 고칠 수 없다');
select test.login('a');
select test.is($$ select count(*) from public.notification_reads $$, '0', '운영자 A 에게도 남의 본 시각은 보이지 않는다');
select test.login('d');
select public.mark_notifications_seen(test.get('club')::uuid);
select test.sudo_is($$ select count(*) from public.notification_reads $$, '1', 'Member 가 아닌 D 가 불러도 줄이 생기지 않는다');
select test.anon();
select test.throws($$ select public.mark_notifications_seen(test.get('club')::uuid) $$, '42501', '로그인하지 않으면 부르지 못한다');

-- ---------------------------------------------------------------------------
-- AI Log 의 수정 기록
-- ---------------------------------------------------------------------------

select test.login('b');
insert into public.ai_logs (club_id, title, attempt, tools) values (test.get('club')::uuid, '처음 제목', '처음 시도', array['chatgpt', 'Claude']);
select test.remember('log', $$ select id from public.ai_logs where title = '처음 제목' $$);
select test.is($$ select count(*) from public.ai_log_revisions $$, '0', '쓰기만 한 기록에는 수정 기록이 없다');
select test.remember('before', $$ select updated_at::text from public.ai_logs where id = test.get('log')::uuid $$);
select pg_sleep(0.01);
select test.affects($$ update public.ai_logs set title = '처음 제목', attempt = '처음 시도' where id = test.get('log')::uuid $$, 1, '작성자 B 가 같은 내용으로 다시 저장한다');
select test.is($$ select (select count(*) from public.ai_log_revisions) || '|' || ((select updated_at::text from public.ai_logs where id = test.get('log')::uuid) = test.get('before')) $$, '0|true', '내용이 그대로면 수정 기록이 남지 않고 고친 시각도 그대로다');
select test.affects($$ update public.ai_logs set title = '처음 제목', session_id = test.get('session')::uuid where id = test.get('log')::uuid $$, 1, '작성자 B 가 Session 만 바꾼다');
select test.is($$ select (select count(*) from public.ai_log_revisions) || '|' || ((select updated_at::text from public.ai_logs where id = test.get('log')::uuid) > test.get('before')) $$, '0|true', 'Session 만 바꾸면 고친 시각은 바뀌지만 수정 기록은 남지 않는다');
select test.affects($$ update public.ai_logs set title = '고친 제목', attempt = '고친 시도' where id = test.get('log')::uuid $$, 1, '작성자 B 가 내용을 고친다');
select test.is($$ select count(*) || '|' || max(title) || '|' || max(attempt) || '|' || bool_and(replaced_by = test.uid('b')) || '|' || max(array_to_string(tools, ',')) from public.ai_log_revisions $$, '1|처음 제목|처음 시도|true|chatgpt,Claude', '고치기 전의 내용과 고친 사람이 남는다');

-- 보는 사람.
select test.login('a');
select test.is($$ select count(*) from public.ai_log_revisions $$, '1', '운영자 A 는 수정 기록을 본다');
select test.login('c');
select test.is($$ select count(*) from public.ai_log_revisions $$, '0', '다른 구성원 C 에게는 보이지 않는다');
select test.login('e');
select test.is($$ select count(*) from public.ai_log_revisions $$, '0', '다른 Club 의 E 에게는 보이지 않는다');
select test.anon();
select test.throws($$ select count(*) from public.ai_log_revisions $$, '42501', '로그인하지 않으면 읽지 못한다');
select test.login('b');
select test.throws($$ insert into public.ai_log_revisions (club_id, log_id, title, attempt) values (test.get('club')::uuid, test.get('log')::uuid, '꾸민 기록', '꾸밈') $$, '42501', '작성자도 수정 기록을 직접 넣지 못한다');
select test.throws($$ update public.ai_log_revisions set title = '고친 수정 기록' $$, '42501', '수정 기록은 고칠 수 없다');
select test.throws($$ delete from public.ai_log_revisions $$, '42501', '수정 기록은 지울 수 없다');

-- 남겨 두는 수.
do $$
begin
  for i in 1..24 loop
    update public.ai_logs set attempt = '시도 ' || i where id = test.get('log')::uuid;
  end loop;
end;
$$;
select test.is($$ select count(*) from public.ai_log_revisions $$, '20', '수정 기록은 스무 개까지만 남는다');
select test.is($$ select count(*) from public.ai_log_revisions where title = '처음 제목' $$, '0', '넘치면 오래된 것부터 지워진다');
select test.sudo_is($$ select private.ai_log_revision_limit()::text $$, '20', '남겨 두는 수는 20 이다');

-- ---------------------------------------------------------------------------
-- 도구 표기 합치기
-- ---------------------------------------------------------------------------

select test.login('c');
insert into public.ai_logs (club_id, title, attempt, tools) values (test.get('club')::uuid, 'C 의 기록', '시도', array['ChatGPT']);
select test.login('a');
insert into public.ai_logs (club_id, title, attempt, tools) values (test.get('club')::uuid, 'A 의 기록', '시도', array['챗지피티', 'ChatGPT', 'Cursor']);
select test.is($$ select string_agg(tool || ':' || log_count, ',' order by log_count desc, tool) from public.club_tool_spellings(test.get('club')::uuid) $$, 'ChatGPT:2,Claude:1,Cursor:1,chatgpt:1,챗지피티:1', '도구 이름을 적힌 그대로 센다');
select test.login('e');
select test.is($$ select coalesce(string_agg(tool, ','), '없음') from public.club_tool_spellings(test.get('club')::uuid) $$, '없음', '다른 Club 의 E 에게는 이 Club 의 도구가 보이지 않는다');
select test.throws($$ select public.rename_club_tool(test.get('club')::uuid, 'chatgpt', 'ChatGPT') $$, '42501', '다른 Club 의 운영자 E 는 합치지 못한다');
select test.login('b');
select test.throws($$ select public.rename_club_tool(test.get('club')::uuid, 'chatgpt', 'ChatGPT') $$, '42501', '구성원 B 는 합치지 못한다');
select test.anon();
select test.throws($$ select public.rename_club_tool(test.get('club')::uuid, 'chatgpt', 'ChatGPT') $$, '42501', '로그인하지 않으면 부르지 못한다');

select test.login('a');
select test.throws($$ select public.rename_club_tool(test.get('club')::uuid, 'chatgpt', '  ') $$, '22023', '빈 이름으로는 합칠 수 없다');
select test.throws($$ select public.rename_club_tool(test.get('club')::uuid, 'chatgpt', 'Chat,GPT') $$, '22023', '쉼표가 든 이름으로는 합칠 수 없다');
select test.throws($$ select public.rename_club_tool(test.get('club')::uuid, 'chatgpt', repeat('가', 31)) $$, '22023', '31자 이름으로는 합칠 수 없다');
select test.is($$ select public.rename_club_tool(test.get('club')::uuid, 'ChatGPT', 'ChatGPT')::text $$, '0', '같은 표기로 바꾸면 아무것도 바뀌지 않는다');
select test.remember('before', $$ select updated_at::text from public.ai_logs where id = test.get('log')::uuid $$);
select test.remember('revisions', $$ select count(*)::text from public.ai_log_revisions $$);
select test.is($$ select public.rename_club_tool(test.get('club')::uuid, 'chatgpt', 'ChatGPT')::text $$, '1', '운영자 A 가 chatgpt 를 ChatGPT 로 합치면 그 표기를 쓴 기록 하나가 바뀐다');
select test.is($$ select array_to_string(tools, ',') from public.ai_logs where id = test.get('log')::uuid $$, 'ChatGPT,Claude', '남의 기록의 도구 이름이 바뀌고 순서는 그대로다');
select test.is($$ select ((select updated_at::text from public.ai_logs where id = test.get('log')::uuid) = test.get('before')) || '|' || ((select count(*)::text from public.ai_log_revisions) = test.get('revisions')) $$, 'true|true', '합쳐도 고친 시각은 그대로이고 수정 기록도 남지 않는다');
select test.is($$ select public.rename_club_tool(test.get('club')::uuid, '챗지피티', 'ChatGPT')::text $$, '1', '챗지피티 도 ChatGPT 로 합친다');
select test.is($$ select array_to_string(tools, ',') from public.ai_logs where title = 'A 의 기록' $$, 'ChatGPT,Cursor', '합친 결과 같은 도구가 두 번 들어가면 하나만 남는다');
select test.is($$ select string_agg(tool || ':' || log_count, ',' order by log_count desc, tool) from public.club_tool_spellings(test.get('club')::uuid) $$, 'ChatGPT:3,Claude:1,Cursor:1', '합친 뒤에는 표기가 하나다');
select test.sudo_is($$ select array_to_string(tools, ',') from public.ai_logs where club_id = test.get('other_club')::uuid $$, 'chatgpt', '다른 Club 의 기록은 바뀌지 않는다');

-- 합친 뒤에 작성자가 고치면 다시 수정 기록이 남는다.
select test.login('b');
select test.affects($$ update public.ai_logs set attempt = '합친 뒤에 고침' where id = test.get('log')::uuid $$, 1, '합친 뒤에 작성자 B 가 고친다');
select test.is($$ select (count(*)::text = test.get('revisions'))::text || '|' || max(array_to_string(tools, ',')) filter (where attempt = '시도 24') from public.ai_log_revisions $$, 'true|ChatGPT,Claude', '합친 뒤의 수정은 다시 수정 기록으로 남는다');

-- 기록을 지우면 수정 기록도 사라진다.
select test.affects($$ delete from public.ai_logs where id = test.get('log')::uuid $$, 1, '작성자 B 가 기록을 지운다');
select test.sudo_is($$ select count(*) from public.ai_log_revisions $$, '0', '기록을 지우면 수정 기록도 함께 지워진다');

-- ---------------------------------------------------------------------------
-- 할 일을 맡긴 시각
-- ---------------------------------------------------------------------------

insert into public.projects (club_id, name) values (test.get('club')::uuid, 'RAG 챗봇');
select test.remember('project', $$ select id from public.projects where name = 'RAG 챗봇' $$);
insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid);
select test.is($$ insert into public.project_tasks (project_id, club_id, title) values (test.get('project')::uuid, test.get('club')::uuid, '평가 질문 만들기') returning (assigned_at is null)::text $$, 'true', '맡은 사람이 없으면 맡긴 시각도 없다');
select test.remember('task', $$ select id from public.project_tasks $$);
select test.is($$ with changed as (update public.project_tasks set assignee_member_id = test.get('member_c')::uuid where id = test.get('task')::uuid returning assigned_at) select (assigned_at is not null and assigned_at <= now())::text from changed $$, 'true', '맡기면 맡긴 시각이 적힌다');
select test.remember('assigned', $$ select assigned_at::text from public.project_tasks where id = test.get('task')::uuid $$);
select pg_sleep(0.01);
select test.is($$ with changed as (update public.project_tasks set title = '평가 질문 20개 만들기', due_on = '2026-10-20', assignee_member_id = test.get('member_c')::uuid where id = test.get('task')::uuid returning assigned_at) select (assigned_at::text = test.get('assigned'))::text from changed $$, 'true', '맡은 사람을 그대로 둔 채 고치면 맡긴 시각은 그대로다');
select test.is($$ with changed as (update public.project_tasks set assignee_member_id = test.get('member_b')::uuid where id = test.get('task')::uuid returning assigned_at) select (assigned_at::text > test.get('assigned'))::text from changed $$, 'true', '맡은 사람을 바꾸면 맡긴 시각이 새로 적힌다');
select test.throws($$ update public.project_tasks set assigned_at = now() - interval '1 year' where id = test.get('task')::uuid $$, '42501', '맡긴 시각을 직접 고칠 수 없다');
select test.is($$ with changed as (update public.project_tasks set assignee_member_id = null where id = test.get('task')::uuid returning assigned_at) select (assigned_at is null)::text from changed $$, 'true', '맡은 사람을 비우면 맡긴 시각도 비워진다');
select test.is($$ insert into public.project_tasks (project_id, club_id, title, assignee_member_id) values (test.get('project')::uuid, test.get('club')::uuid, '넣으면서 맡기기', test.get('member_c')::uuid) returning (assigned_at is not null)::text $$, 'true', '넣으면서 맡겨도 맡긴 시각이 적힌다');

-- ---------------------------------------------------------------------------
-- Session 시간표
-- ---------------------------------------------------------------------------

select test.is($$ select agenda from public.sessions where id = test.get('session')::uuid $$, '', '시간표는 비어 있는 채로 시작한다');
select test.affects($$ update public.sessions set agenda = '시간표' where id = test.get('session')::uuid $$, 0, '구성원 B 는 시간표를 고치지 못한다');
select test.login('a');
select test.affects($$ update public.sessions set agenda = E'19:00 지난 회차 돌아보기\n19:20 실습' where id = test.get('session')::uuid $$, 1, '운영자 A 가 시간표를 적는다');
select test.throws($$ update public.sessions set agenda = repeat('가', 2001) where id = test.get('session')::uuid $$, '23514', '2001자 시간표는 넣을 수 없다');
select test.affects($$ insert into public.sessions (club_id, title, starts_at, ends_at, agenda) values (test.get('club')::uuid, '2회차', '2026-10-08 10:00+09', '2026-10-08 12:00+09', '10:00 시작') $$, 1, '만들면서 시간표를 함께 적을 수 있다');
select test.login('c');
select test.is($$ select agenda from public.sessions where title = '2회차' $$, '10:00 시작', '구성원 C 는 시간표를 본다');

-- ---------------------------------------------------------------------------
-- 발표 소개 글
-- ---------------------------------------------------------------------------

select test.login('b');
select test.throws($$ insert into public.presentations (club_id, scope, project_id, intro) values (test.get('club')::uuid, 'project', test.get('project')::uuid, repeat('가', 601)) $$, '23514', '601자 소개 글은 넣을 수 없다');
select test.is($$ insert into public.presentations (club_id, scope, project_id, intro) values (test.get('club')::uuid, 'project', test.get('project')::uuid, '검색 품질을 어떻게 올렸는지 봐 주세요.') returning intro $$, '검색 품질을 어떻게 올렸는지 봐 주세요.', '참여자 B 가 소개 글과 함께 발표를 공개한다');
select test.remember('pt', $$ select token from public.presentations where scope = 'project' $$);
select test.remember('before', $$ select updated_at::text from public.presentations where scope = 'project' $$);
select test.login('d');
select test.affects($$ update public.presentations set intro = '끼어든 글' $$, 0, 'Member 가 아닌 D 는 소개 글을 고치지 못한다');
select test.login('a');
select test.affects($$ insert into public.presentations (club_id, scope) values (test.get('club')::uuid, 'club') $$, 1, '소개 글 없이도 공개할 수 있다');
select test.remember('ct', $$ select token from public.presentations where scope = 'club' $$);
select test.anon();
select test.is($$ select public.get_presentation(test.get('pt')) ->> 'intro' $$, '검색 품질을 어떻게 올렸는지 봐 주세요.', '로그인하지 않고 읽은 Project 발표에 소개 글이 들어 있다');
select test.is($$ select coalesce(public.get_presentation(test.get('ct')) ->> 'intro', '없음') $$, '', '소개 글을 적지 않은 Club 발표에는 빈 글이 들어 있다');
select test.is($$ select (public.get_presentation(test.get('pt')) #>> '{project,name}') || '|' || jsonb_array_length(public.get_presentation(test.get('pt')) -> 'tasks') $$, 'RAG 챗봇|2', '소개 글을 더한 뒤에도 나머지 내용은 그대로 나간다');
select test.login('b');
select pg_sleep(0.01);
select test.affects($$ update public.presentations set intro = '고친 소개 글' where scope = 'project' $$, 1, '참여자 B 가 소개 글을 고친다');
select test.is($$ select (updated_at::text > test.get('before'))::text || '|' || (token = test.get('pt'))::text from public.presentations where scope = 'project' $$, 'true|true', '소개 글을 고치면 고친 시각이 바뀌고 링크는 그대로다');
select test.login('c');
select test.affects($$ update public.presentations set intro = '참여자가 아닌 사람이 고침' where scope = 'club' $$, 0, '구성원 C 는 Club 발표의 소개 글을 고치지 못한다');
