-- Project 의 참여 요청과 할 일의 담당자, 기한. A 는 운영자, B 와 C 와 D 는 초대로 들어온 구성원, E 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.login('d');
select public.join_club(test.get('token')) is not null;
select test.remember('member_a', $$ select id from public.members where user_id = test.uid('a') $$);
select test.remember('member_b', $$ select id from public.members where user_id = test.uid('b') $$);
select test.remember('member_c', $$ select id from public.members where user_id = test.uid('c') $$);
select test.remember('member_d', $$ select id from public.members where user_id = test.uid('d') $$);
select test.login('e');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
select test.remember('member_e', $$ select id from public.members where user_id = test.uid('e') $$);
insert into public.projects (club_id, name) values (test.get('other_club')::uuid, '다른 Club 의 Project');
select test.remember('other_project', $$ select id from public.projects where name = '다른 Club 의 Project' $$);

select test.login('b');
insert into public.projects (club_id, name) values (test.get('club')::uuid, 'RAG 챗봇');
select test.remember('project', $$ select id from public.projects where name = 'RAG 챗봇' $$);

-- ---------------------------------------------------------------------------
-- 참여 요청
-- ---------------------------------------------------------------------------

select test.throws($$ insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_b')::uuid) $$, '42501', '이미 참여자인 B 는 요청할 수 없다');
select test.throws($$ insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, '42501', '남의 이름으로 요청할 수 없다');
select test.login('e');
select test.throws($$ insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_e')::uuid) $$, '42501', '다른 Club 의 E 는 요청할 수 없다');
select test.throws($$ insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('other_club')::uuid, test.get('member_e')::uuid) $$, '23503', 'Club 을 엇갈리게 적어도 요청할 수 없다');
select test.anon();
select test.throws($$ insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, '42501', '로그인하지 않으면 요청할 수 없다');
select test.login('c');
select test.affects($$ insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, 1, '참여자가 아닌 구성원 C 가 참여를 요청한다');
select test.throws($$ insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, '23505', '같은 Project 에 두 번 요청할 수 없다');
select test.throws($$ insert into public.project_join_requests (project_id, club_id, member_id, created_at) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid, now() - interval '1 day') $$, '42501', '요청한 시각을 직접 적어 넣을 수 없다');
select test.throws($$ update public.project_join_requests set member_id = test.get('member_d')::uuid $$, '42501', '요청은 고칠 수 없다');
select test.affects($$ update public.projects set goal = '요청만 하고 고침' where id = test.get('project')::uuid $$, 0, '요청했다고 해서 고칠 수 있게 되지는 않는다');
select test.login('d');
select test.affects($$ insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_d')::uuid) $$, 1, '구성원 D 도 요청한다');

-- 보는 사람.
select test.is($$ select count(*) from public.project_join_requests $$, '1', '요청한 D 에게는 자기 요청만 보인다');
select test.login('c');
select test.is($$ select count(*) from public.project_join_requests $$, '1', '요청한 C 에게도 자기 요청만 보인다');
select test.login('b');
select test.is($$ select count(*) from public.project_join_requests $$, '2', '참여자 B 는 요청을 모두 본다');
select test.login('a');
select test.is($$ select count(*) from public.project_join_requests $$, '2', '운영자 A 도 요청을 모두 본다');
select test.login('e');
select test.is($$ select count(*) from public.project_join_requests $$, '0', '다른 Club 의 E 에게는 보이지 않는다');
select test.affects($$ delete from public.project_join_requests $$, 0, '다른 Club 의 E 는 요청을 지우지 못한다');

-- 받아 주기와 거절하기, 거두기.
select test.login('c');
select test.affects($$ delete from public.project_join_requests where member_id = test.get('member_d')::uuid $$, 0, '요청한 C 는 남의 요청을 지우지 못한다');
select test.login('b');
select test.affects($$ insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid) $$, 1, '참여자 B 가 C 를 받아 준다');
select test.affects($$ delete from public.project_join_requests where member_id = test.get('member_c')::uuid $$, 1, '받아 준 요청을 지운다');
select test.login('d');
select test.affects($$ delete from public.project_join_requests where member_id = test.get('member_d')::uuid $$, 1, '요청한 D 가 스스로 거둔다');
select test.affects($$ insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_d')::uuid) $$, 1, '거둔 뒤에 다시 요청할 수 있다');
select test.login('a');
select test.affects($$ delete from public.project_join_requests where member_id = test.get('member_d')::uuid $$, 1, '참여자가 아닌 운영자 A 도 거절할 수 있다');

-- 함께 지워지는 것.
select test.login('d');
insert into public.project_join_requests (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_d')::uuid);
select test.affects($$ delete from public.members where id = test.get('member_d')::uuid $$, 1, '요청한 D 가 Club 에서 나간다');
select test.sudo_is($$ select count(*) from public.project_join_requests $$, '0', 'Member 가 나가면 요청도 사라진다');

-- ---------------------------------------------------------------------------
-- 할 일의 담당자와 기한
-- ---------------------------------------------------------------------------

select test.login('b');
select test.is($$ insert into public.project_tasks (project_id, club_id, title) values (test.get('project')::uuid, test.get('club')::uuid, '평가 질문 만들기')
  returning coalesce(assignee_member_id::text, '없음') || '|' || coalesce(due_on::text, '없음') $$, '없음|없음', '할 일은 담당자와 기한 없이 시작한다');
select test.remember('task', $$ select id from public.project_tasks where title = '평가 질문 만들기' $$);
select test.is($$ with changed as (update public.project_tasks set assignee_member_id = test.get('member_c')::uuid, due_on = '2026-10-20' where id = test.get('task')::uuid returning assignee_member_id, due_on)
  select (assignee_member_id = test.get('member_c')::uuid)::text || '|' || due_on from changed $$, 'true|2026-10-20', '참여자 B 가 참여자 C 에게 맡기고 기한을 정한다');
select test.throws($$ update public.project_tasks set assignee_member_id = test.get('member_a')::uuid where id = test.get('task')::uuid $$, '23514', '참여자가 아닌 A 에게는 맡길 수 없다');
select test.throws($$ update public.project_tasks set assignee_member_id = test.get('member_e')::uuid where id = test.get('task')::uuid $$, '23514', '다른 Club 의 Member 에게는 맡길 수 없다');
select test.throws($$ insert into public.project_tasks (project_id, club_id, title, assignee_member_id) values (test.get('project')::uuid, test.get('club')::uuid, '넣으면서 맡기기', test.get('member_a')::uuid) $$, '23514', '넣으면서도 참여자가 아닌 사람에게 맡길 수 없다');
select test.affects($$ insert into public.project_tasks (project_id, club_id, title, assignee_member_id, due_on) values (test.get('project')::uuid, test.get('club')::uuid, '청크 크기 정하기', test.get('member_b')::uuid, '2026-10-25') $$, 1, '넣으면서 참여자에게 맡기고 기한을 정할 수 있다');
select test.affects($$ update public.project_tasks set assignee_member_id = null, due_on = null where title = '청크 크기 정하기' $$, 1, '담당자와 기한을 비울 수 있다');

-- 고칠 수 있는 사람.
select test.login('a');
select test.affects($$ update public.project_tasks set due_on = '2026-10-21' where id = test.get('task')::uuid $$, 1, '참여자가 아닌 운영자 A 도 기한을 고친다');
select test.login('e');
select test.affects($$ update public.project_tasks set due_on = '2026-12-31' where id = test.get('task')::uuid $$, 0, '다른 Club 의 E 는 고치지 못한다');

-- 참여를 그만둔 사람이 맡았던 일.
select test.login('c');
select test.affects($$ update public.project_tasks set done = true where id = test.get('task')::uuid $$, 1, '맡은 C 가 끝냈다고 표시한다');
select test.affects($$ delete from public.project_members where project_id = test.get('project')::uuid and member_id = test.get('member_c')::uuid $$, 1, 'C 가 Project 에서 빠진다');
select test.affects($$ update public.project_tasks set done = false where id = test.get('task')::uuid $$, 0, '빠진 C 는 맡았던 일도 고치지 못한다');
select test.login('b');
select test.is($$ select (assignee_member_id = test.get('member_c')::uuid)::text from public.project_tasks where id = test.get('task')::uuid $$, 'true', '빠진 사람이 맡았던 일에는 그 사람이 그대로 남는다');
select test.affects($$ update public.project_tasks set title = '평가 질문 20개 만들기', due_on = '2026-10-22' where id = test.get('task')::uuid $$, 1, '맡은 사람을 그대로 둔 채 다른 내용은 고칠 수 있다');
select test.throws($$ update public.project_tasks set assignee_member_id = test.get('member_a')::uuid where id = test.get('task')::uuid $$, '23514', '맡은 사람을 바꿀 때는 다시 참여자인지 확인한다');

-- Member 가 Club 에서 빠지면 맡은 사람만 비워진다.
select test.login('c');
select test.affects($$ delete from public.members where id = test.get('member_c')::uuid $$, 1, 'C 가 Club 에서 나간다');
select test.sudo_is($$ select coalesce(assignee_member_id::text, '없음') || '|' || due_on || '|' || title from public.project_tasks where id = test.get('task')::uuid $$, '없음|2026-10-22|평가 질문 20개 만들기', 'Member 가 나가면 할 일은 남고 맡은 사람만 비워진다');
