-- AI Log 의 댓글과 도움이 됐어요 표시, 회고의 쓰임, Session 과 Project 잇기.
-- A 는 운영자, B 와 C 는 초대로 들어온 구성원, D 는 Member 가 아니고, E 는 다른 Club 의 운영자다.
-- B 가 Project 를 만들어 혼자 참여자이고, B 가 AI Log 를 하나 썼다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '1회차', now() - interval '7 days', now() - interval '7 days' + interval '2 hours');
select test.remember('session', $$ select id from public.sessions where title = '1회차' $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
insert into public.projects (club_id, name) values (test.get('club')::uuid, 'RAG 챗봇');
select test.remember('project', $$ select id from public.projects where name = 'RAG 챗봇' $$);
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, '청크 크기 비교', '세 가지로 나눴다');
select test.remember('log', $$ select id from public.ai_logs where title = '청크 크기 비교' $$);
select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.login('e');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.ai_logs (club_id, title, attempt) values (test.get('other_club')::uuid, '다른 Club 의 기록', '시도');
select test.remember('other_log', $$ select id from public.ai_logs where title = '다른 Club 의 기록' $$);
insert into public.projects (club_id, name) values (test.get('other_club')::uuid, '다른 Club 의 Project');
select test.remember('other_project', $$ select id from public.projects where name = '다른 Club 의 Project' $$);

-- ---------------------------------------------------------------------------
-- 댓글
-- ---------------------------------------------------------------------------

select test.login('c');
select test.is($$ insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('log')::uuid, '겹치는 길이도 바꿔 보셨나요?') returning (author_id = test.uid('c'))::text $$, 'true', '구성원 C 가 B 의 기록에 댓글을 달고 작성자는 C 로 정해진다');
select test.throws($$ insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('log')::uuid, E'  \n ') $$, '23514', '빈 댓글은 달 수 없다');
select test.throws($$ insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('log')::uuid, repeat('가', 1001)) $$, '23514', '1001자 댓글은 달 수 없다');
select test.throws($$ insert into public.ai_log_comments (club_id, log_id, author_id, body) values (test.get('club')::uuid, test.get('log')::uuid, test.uid('b'), '남의 이름으로') $$, '42501', '작성자를 정해서 달 수 없다');
select test.throws($$ insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('other_log')::uuid, '다른 Club 의 기록에') $$, '42501', '다른 Club 의 기록에는 달 수 없다');
select test.login('b');
select test.affects($$ insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('log')::uuid, '아직요. 다음에 해 볼게요.') $$, 1, '기록의 작성자 B 도 댓글을 단다');
select test.login('d');
select test.throws($$ insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('log')::uuid, '끼어들기') $$, '42501', 'Member 가 아닌 D 는 댓글을 달 수 없다');
select test.is($$ select count(*) from public.ai_log_comments $$, '0', 'D 에게는 댓글이 보이지 않는다');
select test.login('e');
select test.is($$ select count(*) from public.ai_log_comments $$, '0', '다른 Club 의 운영자 E 에게도 보이지 않는다');
select test.anon();
select test.throws($$ select count(*) from public.ai_log_comments $$, '42501', '로그인하지 않으면 댓글을 읽을 수 없다');
select test.login('a');
select test.is($$ select count(*) from public.ai_log_comments $$, '2', 'Club 의 Member 는 댓글을 모두 본다');

select test.login('c');
select test.remember('before', $$ select updated_at::text from public.ai_log_comments where author_id = test.uid('c') $$);
select test.affects($$ update public.ai_log_comments set body = '겹치는 길이도 바꿔 보셨는지 궁금합니다.' where author_id = test.uid('c') $$, 1, 'C 가 자기 댓글을 고친다');
select test.is($$ select (updated_at::text <> test.get('before'))::text from public.ai_log_comments where author_id = test.uid('c') $$, 'true', '고치면 고친 시각이 바뀐다');
select test.affects($$ update public.ai_log_comments set body = 'C 가 고침' where author_id = test.uid('b') $$, 0, 'C 는 B 의 댓글을 고칠 수 없다');
select test.throws($$ update public.ai_log_comments set log_id = test.get('other_log')::uuid where author_id = test.uid('c') $$, '42501', '어느 기록의 댓글인지는 바꿀 수 없다');
select test.affects($$ delete from public.ai_log_comments where author_id = test.uid('b') $$, 0, 'C 는 B 의 댓글을 지울 수 없다');
select test.login('b');
select test.affects($$ delete from public.ai_log_comments where author_id = test.uid('c') $$, 0, '기록의 작성자라도 남의 댓글은 지울 수 없다');
select test.login('a');
select test.affects($$ update public.ai_log_comments set body = '운영자가 고침' where author_id = test.uid('c') $$, 0, '운영자도 남의 댓글을 고칠 수 없다');
select test.affects($$ delete from public.ai_log_comments where author_id = test.uid('c') $$, 1, '운영자 A 가 C 의 댓글을 지운다');
select test.is($$ select entity || '|' || title || '|' || owner_name || '|' || deleted_by_name from public.deletion_logs where entity = 'comment' $$, 'comment|청크 크기 비교|other@example.com|김하늘', '지운 기록에 댓글이 달렸던 기록의 제목과 작성자, 지운 사람이 남는다');

-- ---------------------------------------------------------------------------
-- 도움이 됐어요 표시
-- ---------------------------------------------------------------------------

select test.login('c');
select test.affects($$ insert into public.ai_log_reactions (log_id, club_id) values (test.get('log')::uuid, test.get('club')::uuid) $$, 1, 'C 가 B 의 기록에 도움이 됐다고 표시한다');
select test.throws($$ insert into public.ai_log_reactions (log_id, club_id) values (test.get('log')::uuid, test.get('club')::uuid) $$, '23505', '같은 기록에 두 번 표시할 수 없다');
select test.throws($$ insert into public.ai_log_reactions (log_id, club_id, user_id) values (test.get('log')::uuid, test.get('club')::uuid, test.uid('a')) $$, '42501', '남의 이름으로 표시할 수 없다');
select test.throws($$ insert into public.ai_log_reactions (log_id, club_id) values (test.get('other_log')::uuid, test.get('club')::uuid) $$, '42501', '다른 Club 의 기록에는 표시할 수 없다');
select test.login('b');
select test.throws($$ insert into public.ai_log_reactions (log_id, club_id) values (test.get('log')::uuid, test.get('club')::uuid) $$, '42501', '자기가 쓴 기록에는 표시할 수 없다');
select test.affects($$ delete from public.ai_log_reactions $$, 0, 'B 는 C 의 표시를 거둘 수 없다');
select test.login('a');
select test.affects($$ insert into public.ai_log_reactions (log_id, club_id) values (test.get('log')::uuid, test.get('club')::uuid) $$, 1, '운영자 A 도 표시한다');
select test.is($$ select count(*) from public.ai_log_reactions where log_id = test.get('log')::uuid $$, '2', 'Member 는 누가 표시했는지 모두 본다');
select test.affects($$ delete from public.ai_log_reactions where user_id = test.uid('c') $$, 0, '운영자도 남의 표시는 거둘 수 없다');
select test.throws($$ update public.ai_log_reactions set created_at = now() $$, '42501', '표시는 고칠 수 없다');
select test.login('d');
select test.throws($$ insert into public.ai_log_reactions (log_id, club_id) values (test.get('log')::uuid, test.get('club')::uuid) $$, '42501', 'Member 가 아닌 D 는 표시할 수 없다');
select test.is($$ select count(*) from public.ai_log_reactions $$, '0', 'D 에게는 표시가 보이지 않는다');
select test.login('c');
select test.affects($$ delete from public.ai_log_reactions where user_id = test.uid('c') $$, 1, 'C 가 자기 표시를 거둔다');
select test.affects($$ insert into public.ai_log_reactions (log_id, club_id) values (test.get('log')::uuid, test.get('club')::uuid) $$, 1, '거둔 뒤 다시 표시할 수 있다');

-- ---------------------------------------------------------------------------
-- 회고의 쓰임
-- ---------------------------------------------------------------------------

select test.login('b');
select test.is($$ insert into public.retrospectives (club_id, scope, project_id, went_well) values (test.get('club')::uuid, 'project', test.get('project')::uuid, '평가 질문을 먼저 정했다') returning use_in_insight::text || '|' || share_in_presentation::text $$, 'false|false', '회고의 두 선택은 기본이 꺼짐이다');
select test.remember('before', $$ select updated_at::text from public.retrospectives where scope = 'project' $$);
select test.affects($$ update public.retrospectives set use_in_insight = true, share_in_presentation = true where scope = 'project' $$, 1, '작성자 B 가 두 선택을 켠다');
select test.is($$ select (updated_at::text = test.get('before'))::text from public.retrospectives where scope = 'project' $$, 'true', '선택만 바꾸면 고친 시각은 그대로다');
select test.login('a');
select test.affects($$ update public.retrospectives set share_in_presentation = false where scope = 'project' $$, 0, '운영자도 남의 회고의 선택은 바꿀 수 없다');
select test.affects($$ insert into public.retrospectives (club_id, scope, session_id, to_improve, use_in_insight) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '시간이 모자랐다', true) $$, 1, '쓸 때 AI Insight 에 쓰도록 켤 수 있다');

-- 발표에는 허락한 Project 회고만 나간다.
select test.login('b');
insert into public.presentations (club_id, scope, project_id, show_names) values (test.get('club')::uuid, 'project', test.get('project')::uuid, true);
select test.remember('pt', $$ select token from public.presentations where scope = 'project' $$);
select test.anon();
select test.is($$ select jsonb_array_length(public.get_presentation(test.get('pt')) -> 'retrospectives') $$, '1', '로그인하지 않고 읽은 발표에 허락한 회고가 하나 들어 있다');
select test.is($$ select public.get_presentation(test.get('pt')) -> 'retrospectives' -> 0 ->> 'wentWell' $$, '평가 질문을 먼저 정했다', '회고의 내용이 들어 있다');
select test.is($$ select public.get_presentation(test.get('pt')) -> 'retrospectives' -> 0 ->> 'author' $$, '박서연', '이름을 보이는 발표에는 회고의 작성자 이름이 들어 있다');
select test.is($$ select (public.get_presentation(test.get('pt'))::text like '%시간이 모자랐다%')::text $$, 'false', 'Session 회고는 발표에 나가지 않는다');
select test.is($$ select (public.get_presentation(test.get('pt'))::text ~ 'example\.com')::text $$, 'false', '발표에 이메일은 나가지 않는다');
select test.login('b');
update public.retrospectives set share_in_presentation = false where scope = 'project';
select test.anon();
select test.is($$ select jsonb_array_length(public.get_presentation(test.get('pt')) -> 'retrospectives') $$, '0', '작성자가 허락을 거두면 회고가 발표에서 바로 빠진다');
select test.throws($$ select count(*) from public.retrospectives $$, '42501', '로그인하지 않으면 회고 테이블을 직접 읽을 수 없다');

-- ---------------------------------------------------------------------------
-- Session 과 Project 잇기
-- ---------------------------------------------------------------------------

select test.login('c');
select test.throws($$ insert into public.session_projects (session_id, project_id, club_id) values (test.get('session')::uuid, test.get('project')::uuid, test.get('club')::uuid) $$, '42501', '참여자도 운영자도 아닌 C 는 이을 수 없다');
select test.login('b');
select test.affects($$ insert into public.session_projects (session_id, project_id, club_id) values (test.get('session')::uuid, test.get('project')::uuid, test.get('club')::uuid) $$, 1, '참여자 B 가 자기 Project 를 Session 에 잇는다');
select test.throws($$ insert into public.session_projects (session_id, project_id, club_id) values (test.get('session')::uuid, test.get('project')::uuid, test.get('club')::uuid) $$, '23505', '같은 것을 두 번 이을 수 없다');
select test.throws($$ insert into public.session_projects (session_id, project_id, club_id) values (test.get('session')::uuid, test.get('other_project')::uuid, test.get('club')::uuid) $$, '42501', '다른 Club 의 Project 는 이을 수 없다');
select test.login('a');
select test.throws($$ insert into public.session_projects (session_id, project_id, club_id) values (test.get('session')::uuid, test.get('other_project')::uuid, test.get('club')::uuid) $$, '23503', '운영자라도 다른 Club 의 Project 는 이을 수 없다');
select test.login('c');
select test.is($$ select count(*) from public.session_projects $$, '1', 'Member 는 이어진 것을 모두 본다');
select test.affects($$ delete from public.session_projects $$, 0, 'C 는 끊을 수 없다');
select test.throws($$ update public.session_projects set created_at = now() $$, '42501', '이어진 줄은 고칠 수 없다');
select test.login('d');
select test.is($$ select count(*) from public.session_projects $$, '0', 'Member 가 아닌 D 에게는 보이지 않는다');
select test.login('a');
select test.affects($$ delete from public.session_projects $$, 1, '운영자 A 가 끊는다');
select test.affects($$ insert into public.session_projects (session_id, project_id, club_id) values (test.get('session')::uuid, test.get('project')::uuid, test.get('club')::uuid) $$, 1, '운영자 A 가 참여하지 않는 Project 도 잇는다');
select test.login('b');
select test.affects($$ delete from public.session_projects $$, 1, '참여자 B 가 끊는다');
select test.login('a');
insert into public.session_projects (session_id, project_id, club_id) values (test.get('session')::uuid, test.get('project')::uuid, test.get('club')::uuid);
select test.affects($$ delete from public.sessions where id = test.get('session')::uuid $$, 1, '운영자가 Session 을 지운다');
select test.sudo_is($$ select count(*) from public.session_projects $$, '0', 'Session 을 지우면 이어진 줄도 지워진다');

-- ---------------------------------------------------------------------------
-- 기록이나 사람이 사라질 때
-- ---------------------------------------------------------------------------

select test.login('c');
insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('log')::uuid, 'C 의 댓글');
select test.affects($$ delete from public.members where user_id = test.uid('c') $$, 1, 'C 가 Club 에서 나간다');
select test.sudo_is($$ select count(*) || '|' || count(author_id) from public.ai_log_comments where body = 'C 의 댓글' $$, '1|0', '나간 사람의 댓글은 작성자 없이 남는다');
select test.sudo_is($$ select count(*) from public.ai_log_reactions where user_id = test.uid('c') $$, '0', '나간 사람의 표시는 함께 지워진다');
select test.remember('logged', $$ select count(*) from public.deletion_logs where entity = 'comment' $$);
select test.login('b');
select test.affects($$ delete from public.ai_logs where id = test.get('log')::uuid $$, 1, 'B 가 자기 기록을 지운다');
select test.sudo_is($$ select count(*) from public.ai_log_comments $$, '0', '기록을 지우면 댓글도 함께 지워진다');
select test.sudo_is($$ select count(*) from public.ai_log_reactions $$, '0', '기록을 지우면 표시도 함께 지워진다');
select test.sudo_is($$ select (count(*)::text = test.get('logged'))::text from public.deletion_logs where entity = 'comment' $$, 'true', '함께 지워진 댓글은 지운 기록에 따로 남지 않는다');
