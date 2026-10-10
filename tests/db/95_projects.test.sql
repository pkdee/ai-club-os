-- Project 의 접근 규칙. A 는 운영자, B 와 C 는 초대로 들어온 구성원, D 는 Member 가 아니고, E 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.remember('member_a', $$ select id from public.members where user_id = test.uid('a') $$);
select test.remember('member_b', $$ select id from public.members where user_id = test.uid('b') $$);
select test.remember('member_c', $$ select id from public.members where user_id = test.uid('c') $$);
select test.login('e');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
select test.remember('member_e', $$ select id from public.members where user_id = test.uid('e') $$);
insert into public.projects (club_id, name) values (test.get('other_club')::uuid, '다른 Club 의 Project');
select test.remember('other_project', $$ select id from public.projects where name = '다른 Club 의 Project' $$);

-- 만들기.
select test.login('d');
select test.throws($$ insert into public.projects (club_id, name) values (test.get('club')::uuid, '끼어들기') $$, '42501', 'Member 가 아닌 D 는 Project 를 만들지 못한다');
select test.anon();
select test.throws($$ insert into public.projects (club_id, name) values (test.get('club')::uuid, '끼어들기') $$, '42501', '로그인하지 않으면 Project 를 만들지 못한다');
select test.login('b');
select test.is($$ insert into public.projects (club_id, name, goal) values (test.get('club')::uuid, 'RAG 챗봇', '동아리 자료를 찾아 주는 챗봇')
  returning status || '|' || (created_by = test.uid('b'))::text $$, 'planning|true', '구성원 B 가 만들면 본인의 준비 상태 Project 가 되고 만든 행을 돌려받는다');
select test.remember('project', $$ select id from public.projects where name = 'RAG 챗봇' $$);
select test.is($$ select count(*) || '|' || bool_and(member_id = test.get('member_b')::uuid) from public.project_members where project_id = test.get('project')::uuid $$, '1|true', '만든 사람은 첫 참여자가 된다');
select test.throws($$ insert into public.projects (club_id, name, status) values (test.get('club')::uuid, '바로 완료', 'done') $$, '42501', '만들면서 진행 상태를 정할 수 없다');
select test.throws($$ insert into public.projects (club_id, name, created_by) values (test.get('club')::uuid, '남의 이름으로', test.uid('a')) $$, '42501', '만든 사람을 직접 적어 넣을 수 없다');
select test.throws($$ insert into public.projects (club_id, name) values (test.get('other_club')::uuid, '남의 Club 에') $$, '42501', '다른 Club 에는 만들지 못한다');
select test.throws($$ insert into public.projects (club_id, name) values (test.get('club')::uuid, '   ') $$, '23514', '빈 이름은 넣을 수 없다');
select test.throws($$ insert into public.projects (club_id, name) values (test.get('club')::uuid, repeat('가', 81)) $$, '23514', '81자 이름은 넣을 수 없다');
select test.throws($$ insert into public.projects (club_id, name, goal) values (test.get('club')::uuid, '목표가 긴 것', repeat('가', 2001)) $$, '23514', '2001자 목표는 넣을 수 없다');

-- 보기.
select test.login('c');
select test.is($$ select count(*) from public.projects $$, '1', '같은 Club 의 구성원 C 는 Project 를 본다');
select test.is($$ select count(*) from public.project_members $$, '1', '참여자도 본다');
select test.login('d');
select test.is($$ select count(*) from public.projects $$, '0', 'Member 가 아닌 D 에게는 보이지 않는다');
select test.login('e');
select test.is($$ select string_agg(name, ',') from public.projects $$, '다른 Club 의 Project', '다른 Club 의 E 에게는 자기 Club 의 것만 보인다');
select test.anon();
select test.throws($$ select count(*) from public.projects $$, '42501', '로그인하지 않으면 Project 를 읽지 못한다');

-- 고치기.
select test.login('c');
select test.affects($$ update public.projects set name = '참여자가 아닌 사람이 고침' where id = test.get('project')::uuid $$, 0, '참여자가 아닌 구성원 C 는 고치지 못한다');
select test.login('e');
select test.affects($$ update public.projects set name = '다른 Club 이 고침' where id = test.get('project')::uuid $$, 0, '다른 Club 의 E 는 고치지 못한다');
select test.login('b');
select test.remember('before', $$ select updated_at::text from public.projects where id = test.get('project')::uuid $$);
select test.affects($$ update public.projects set name = 'RAG 챗봇 만들기', goal = '검색 품질부터 잡는다', status = 'active' where id = test.get('project')::uuid $$, 1, '참여자 B 가 이름과 목표, 진행 상태를 고친다');
select test.is($$ select (updated_at::text <> test.get('before'))::text from public.projects where id = test.get('project')::uuid $$, 'true', '고치면 고친 시각이 바뀐다');
select test.throws($$ update public.projects set status = 'paused' where id = test.get('project')::uuid $$, '23514', '없는 진행 상태로 바꿀 수 없다');
select test.throws($$ update public.projects set club_id = test.get('other_club')::uuid where id = test.get('project')::uuid $$, '42501', 'Project 를 다른 Club 으로 옮길 수 없다');
select test.throws($$ update public.projects set created_by = test.uid('c') where id = test.get('project')::uuid $$, '42501', '만든 사람을 바꿀 수 없다');
select test.login('a');
select test.affects($$ update public.projects set status = 'planning' where id = test.get('project')::uuid $$, 1, '참여자가 아닌 운영자 A 도 고친다');

-- 참여자.
select test.login('c');
select test.throws($$ insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, '42501', '구성원 C 는 스스로 끼어들지 못한다');
select test.login('d');
select test.throws($$ insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, '42501', 'Member 가 아닌 D 는 참여자를 넣지 못한다');
select test.login('b');
select test.affects($$ insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, 1, '참여자 B 가 C 를 참여자로 넣는다');
select test.throws($$ insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, '23505', '같은 사람을 두 번 넣을 수 없다');
select test.throws($$ insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_e')::uuid) $$, '23503', '다른 Club 의 Member 는 넣을 수 없다');
select test.login('c');
select test.affects($$ update public.projects set goal = 'C 가 고친 목표' where id = test.get('project')::uuid $$, 1, '참여자가 된 C 는 고친다');
select test.affects($$ delete from public.projects where id = test.get('project')::uuid $$, 0, '참여자라도 만든 사람이 아닌 C 는 지우지 못한다');
select test.affects($$ delete from public.project_members where project_id = test.get('project')::uuid and member_id = test.get('member_c')::uuid $$, 1, 'C 가 스스로 빠진다');
select test.affects($$ update public.projects set goal = '빠진 뒤 고침' where id = test.get('project')::uuid $$, 0, '빠진 C 는 다시 고치지 못한다');
select test.affects($$ delete from public.project_members where project_id = test.get('project')::uuid $$, 0, '빠진 C 는 다른 참여자를 빼지 못한다');
select test.login('a');
select test.affects($$ insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, 1, '운영자 A 가 C 를 다시 참여자로 넣는다');
select test.login('b');
select test.affects($$ delete from public.project_members where project_id = test.get('project')::uuid and member_id = test.get('member_c')::uuid $$, 1, '참여자 B 가 C 를 뺀다');

-- 결과물 링크.
select test.login('c');
select test.throws($$ insert into public.project_links (project_id, club_id, label, url) values (test.get('project')::uuid, test.get('club')::uuid, '저장소', 'https://example.com/repo') $$, '42501', '참여자가 아닌 C 는 링크를 넣지 못한다');
select test.login('b');
select test.affects($$ insert into public.project_links (project_id, club_id, label, url) values (test.get('project')::uuid, test.get('club')::uuid, '저장소', 'https://example.com/repo') $$, 1, '참여자 B 가 링크를 넣는다');
select test.remember('link', $$ select id from public.project_links $$);
select test.throws($$ insert into public.project_links (project_id, club_id, label, url) values (test.get('project')::uuid, test.get('club')::uuid, '나쁜 주소', 'javascript:alert(1)') $$, '23514', 'http 나 https 가 아닌 주소는 넣을 수 없다');
select test.throws($$ insert into public.project_links (project_id, club_id, label, url) values (test.get('project')::uuid, test.get('club')::uuid, '파일 주소', 'ftp://example.com/a') $$, '23514', 'ftp 주소는 넣을 수 없다');
select test.throws($$ insert into public.project_links (project_id, club_id, label, url) values (test.get('project')::uuid, test.get('club')::uuid, '공백', 'https://example.com/a b') $$, '23514', '공백이 든 주소는 넣을 수 없다');
select test.throws($$ insert into public.project_links (project_id, club_id, label, url) values (test.get('project')::uuid, test.get('club')::uuid, '   ', 'https://example.com') $$, '23514', '빈 이름의 링크는 넣을 수 없다');
select test.throws($$ insert into public.project_links (project_id, club_id, label, url) values (test.get('other_project')::uuid, test.get('club')::uuid, '엇갈림', 'https://example.com') $$, '42501', '다른 Club 의 Project 에는 링크를 넣지 못한다');
select test.throws($$ update public.project_links set url = 'https://example.com/changed' $$, '42501', '링크는 고칠 수 없다');
select test.login('c');
select test.is($$ select count(*) from public.project_links $$, '1', '참여자가 아닌 구성원도 링크를 본다');
select test.affects($$ delete from public.project_links $$, 0, '참여자가 아닌 C 는 링크를 지우지 못한다');

-- 할 일.
select test.throws($$ insert into public.project_tasks (project_id, club_id, title) values (test.get('project')::uuid, test.get('club')::uuid, '끼어든 할 일') $$, '42501', '참여자가 아닌 C 는 할 일을 넣지 못한다');
select test.login('b');
select test.is($$ insert into public.project_tasks (project_id, club_id, title) values (test.get('project')::uuid, test.get('club')::uuid, '평가 질문 20개 만들기') returning done::text || '|' || (done_at is null)::text $$, 'false|true', '참여자 B 가 넣은 할 일은 끝나지 않은 상태다');
select test.remember('task', $$ select id from public.project_tasks $$);
select test.throws($$ insert into public.project_tasks (project_id, club_id, title) values (test.get('project')::uuid, test.get('club')::uuid, '  ') $$, '23514', '빈 할 일은 넣을 수 없다');
select test.throws($$ insert into public.project_tasks (project_id, club_id, title, done) values (test.get('project')::uuid, test.get('club')::uuid, '이미 끝남', true) $$, '42501', '넣으면서 끝냈다고 표시할 수 없다');
select test.is($$ with changed as (update public.project_tasks set done = true where id = test.get('task')::uuid returning done_at) select (done_at is not null)::text from changed $$, 'true', '끝냈다고 표시하면 끝낸 시각이 적힌다');
select test.is($$ with changed as (update public.project_tasks set done = false where id = test.get('task')::uuid returning done_at) select (done_at is null)::text from changed $$, 'true', '되돌리면 끝낸 시각이 비워진다');
select test.throws($$ update public.project_tasks set done_at = now() where id = test.get('task')::uuid $$, '42501', '끝낸 시각을 직접 고칠 수 없다');
select test.login('c');
select test.affects($$ update public.project_tasks set done = true $$, 0, '참여자가 아닌 C 는 할 일을 고치지 못한다');
select test.affects($$ delete from public.project_tasks $$, 0, '참여자가 아닌 C 는 할 일을 지우지 못한다');
select test.login('a');
select test.affects($$ update public.project_tasks set title = '평가 질문 30개 만들기' where id = test.get('task')::uuid $$, 1, '운영자 A 는 할 일을 고친다');

-- AI Log 묶기.
select test.login('b');
select test.affects($$ insert into public.ai_logs (club_id, project_id, title, attempt) values (test.get('club')::uuid, test.get('project')::uuid, 'B 의 실험', 'x') $$, 1, '참여자 B 가 기록을 Project 에 묶어 남긴다');
select test.remember('log_b', $$ select id from public.ai_logs where title = 'B 의 실험' $$);
select test.throws($$ insert into public.ai_logs (club_id, project_id, title, attempt) values (test.get('club')::uuid, test.get('other_project')::uuid, '남의 Club 의 Project', 'x') $$, '42501', '참여하지 않는 다른 Club 의 Project 에는 묶지 못한다');
select test.login('c');
select test.throws($$ insert into public.ai_logs (club_id, project_id, title, attempt) values (test.get('club')::uuid, test.get('project')::uuid, 'C 의 끼어든 기록', 'x') $$, '42501', '참여자가 아닌 C 는 기록을 그 Project 에 묶어 남기지 못한다');
select test.affects($$ insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'C 의 실험', 'x') $$, 1, 'C 가 Project 없이 기록을 남긴다');
select test.remember('log_c', $$ select id from public.ai_logs where title = 'C 의 실험' $$);
select test.throws($$ update public.ai_logs set project_id = test.get('project')::uuid where id = test.get('log_c')::uuid $$, '42501', '참여자가 아닌 C 는 나중에도 묶지 못한다');
select test.login('b');
select test.affects($$ insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, 1, 'B 가 C 를 다시 참여자로 넣는다');
select test.affects($$ update public.ai_logs set project_id = test.get('project')::uuid where id = test.get('log_c')::uuid $$, 0, '참여자 B 라도 남의 기록은 묶지 못한다');
select test.login('c');
select test.affects($$ update public.ai_logs set project_id = test.get('project')::uuid where id = test.get('log_c')::uuid $$, 1, '참여자가 된 C 가 자기 기록을 묶는다');
select test.affects($$ delete from public.project_members where project_id = test.get('project')::uuid and member_id = test.get('member_c')::uuid $$, 1, 'C 가 다시 빠진다');
select test.is($$ select (project_id is not null)::text from public.ai_logs where id = test.get('log_c')::uuid $$, 'true', '빠져도 묶어 둔 기록은 그대로 묶여 있다');
select test.affects($$ update public.ai_logs set title = 'C 의 실험 (고침)', tools = tools, attempt = attempt, result = result, learned = learned, next_action = next_action, session_id = session_id, project_id = project_id where id = test.get('log_c')::uuid $$, 1, '빠진 뒤에도 묶어 둔 기록의 다른 내용은 고친다');
select test.affects($$ update public.ai_logs set project_id = null where id = test.get('log_c')::uuid $$, 1, '빠진 C 가 자기 기록을 Project 에서 뗀다');
select test.throws($$ update public.ai_logs set project_id = test.get('project')::uuid where id = test.get('log_c')::uuid $$, '42501', '뗀 뒤에는 다시 묶지 못한다');

-- 지우기와 함께 지워지는 것.
select test.login('a');
select test.affects($$ insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, 1, 'A 가 C 를 다시 참여자로 넣는다');
select test.affects($$ delete from public.members where id = test.get('member_c')::uuid $$, 1, 'A 가 C 를 Club 에서 내보낸다');
select test.sudo_is($$ select count(*) from public.project_members where member_id = test.get('member_c')::uuid $$, '0', 'Club 에서 빠지면 Project 참여도 끝난다');
select test.login('e');
select test.affects($$ delete from public.projects where id = test.get('project')::uuid $$, 0, '다른 Club 의 E 는 Project 를 지우지 못한다');
select test.login('b');
select test.remember('before', $$ select updated_at::text from public.ai_logs where id = test.get('log_b')::uuid $$);
select test.is($$ with removed as (delete from public.projects where id = test.get('project')::uuid returning id) select count(*) from removed $$, '1', '만든 사람 B 가 Project 를 지우고 지운 행을 돌려받는다');
select test.sudo_is($$ select (select count(*) from public.project_members where project_id = test.get('project')::uuid) || '|' || (select count(*) from public.project_links where project_id = test.get('project')::uuid) || '|' || (select count(*) from public.project_tasks where project_id = test.get('project')::uuid) $$, '0|0|0', 'Project 를 지우면 참여자, 링크, 할 일이 함께 지워진다');
select test.is($$ select (project_id is null)::text || '|' || (updated_at::text = test.get('before'))::text from public.ai_logs where id = test.get('log_b')::uuid $$, 'true|true', '묶여 있던 AI Log 는 남고 연결만 비며 고친 시각은 그대로다');
insert into public.projects (club_id, name) values (test.get('club')::uuid, 'B 의 두 번째 Project');
select test.login('a');
select test.affects($$ delete from public.projects where name = 'B 의 두 번째 Project' $$, 1, '운영자 A 는 남이 만든 Project 도 지운다');
insert into public.projects (club_id, name) values (test.get('club')::uuid, 'A 의 Project');
insert into public.project_tasks (project_id, club_id, title) select id, club_id, '남을 할 일' from public.projects where name = 'A 의 Project';
select test.affects($$ delete from public.clubs where id = test.get('club')::uuid $$, 1, '운영자 A 가 Club 을 지운다');
select test.sudo_is($$ select (select count(*) from public.projects where club_id = test.get('club')::uuid) || '|' || (select count(*) from public.project_tasks where club_id = test.get('club')::uuid) || '|' || (select count(*) from public.projects) $$, '0|0|1', 'Club 을 지우면 그 Club 의 Project 와 할 일도 지워지고 다른 Club 의 것은 남는다');
