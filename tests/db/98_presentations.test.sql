-- 발표의 접근 규칙과, 링크로 읽을 때 나가는 내용.
-- A 는 운영자, B 와 C 는 초대로 들어온 구성원, D 는 Member 가 아니고, E 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name, description) values ('AI 모각코', '매주 모여 AI 도구를 써 본다');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values
  (test.get('club')::uuid, '1회차', now() - interval '7 days', now() - interval '7 days' + interval '2 hours'),
  (test.get('club')::uuid, '앞으로 열 회차', now() + interval '7 days', now() + interval '7 days' + interval '2 hours');
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.remember('member_c', $$ select id from public.members where user_id = test.uid('c') $$);
select test.login('e');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.projects (club_id, name) values (test.get('other_club')::uuid, '다른 Club 의 Project');
select test.remember('other_project', $$ select id from public.projects where name = '다른 Club 의 Project' $$);

-- B 가 Project 를 만들고 링크와 할 일, 기록을 넣는다.
select test.login('b');
insert into public.projects (club_id, name, goal) values (test.get('club')::uuid, 'RAG 챗봇', '자료를 찾아 준다');
select test.remember('project', $$ select id from public.projects where name = 'RAG 챗봇' $$);
insert into public.projects (club_id, name) values (test.get('club')::uuid, '공개하지 않은 Project');
select test.remember('hidden_project', $$ select id from public.projects where name = '공개하지 않은 Project' $$);
insert into public.project_links (project_id, club_id, label, url) values (test.get('project')::uuid, test.get('club')::uuid, '저장소', 'https://example.com/repo');
insert into public.project_tasks (project_id, club_id, title) values (test.get('project')::uuid, test.get('club')::uuid, '평가 질문 만들기');
update public.project_tasks set done = true where title = '평가 질문 만들기';
insert into public.project_tasks (project_id, club_id, title) values (test.get('project')::uuid, test.get('club')::uuid, '화면 만들기');
insert into public.ai_logs (club_id, project_id, title, attempt, learned, tools) values
  (test.get('club')::uuid, test.get('project')::uuid, '청크 크기 실험', '청크 크기를 바꿔 봤다', '중간 크기가 낫다', array['Claude']),
  (test.get('club')::uuid, test.get('project')::uuid, '임베딩 실험', '임베딩 모델을 바꿔 봤다', '', '{}');
insert into public.ai_logs (club_id, title, attempt) values
  (test.get('club')::uuid, 'Project 에 묶지 않은 기록', '묶지 않았다');

-- ---------------------------------------------------------------------------
-- 공개하고 거두는 사람
-- ---------------------------------------------------------------------------

select test.login('c');
select test.throws($$ insert into public.presentations (club_id, scope, project_id) values (test.get('club')::uuid, 'project', test.get('project')::uuid) $$, '42501', '참여자가 아닌 구성원 C 는 Project 발표를 공개하지 못한다');
select test.throws($$ insert into public.presentations (club_id, scope) values (test.get('club')::uuid, 'club') $$, '42501', '구성원 C 는 Club 발표를 공개하지 못한다');
select test.login('d');
select test.throws($$ insert into public.presentations (club_id, scope, project_id) values (test.get('club')::uuid, 'project', test.get('project')::uuid) $$, '42501', 'Member 가 아닌 D 는 공개하지 못한다');
select test.login('e');
select test.throws($$ insert into public.presentations (club_id, scope, project_id) values (test.get('club')::uuid, 'project', test.get('project')::uuid) $$, '42501', '다른 Club 의 운영자 E 는 공개하지 못한다');
select test.anon();
select test.throws($$ insert into public.presentations (club_id, scope) values (test.get('club')::uuid, 'club') $$, '42501', '로그인하지 않으면 공개하지 못한다');

select test.login('b');
select test.throws($$ insert into public.presentations (club_id, scope) values (test.get('club')::uuid, 'club') $$, '42501', '참여자라도 구성원 B 는 Club 발표를 공개하지 못한다');
select test.throws($$ insert into public.presentations (club_id, scope, project_id, token) values (test.get('club')::uuid, 'project', test.get('project')::uuid, repeat('a', 32)) $$, '42501', '링크 값을 직접 정할 수 없다');
select test.throws($$ insert into public.presentations (club_id, scope, project_id, created_by) values (test.get('club')::uuid, 'project', test.get('project')::uuid, test.uid('a')) $$, '42501', '공개한 사람을 직접 적어 넣을 수 없다');
select test.throws($$ insert into public.presentations (club_id, scope) values (test.get('club')::uuid, 'project') $$, '42501', 'Project 없는 Project 발표는 만들 수 없다');
select test.throws($$ insert into public.presentations (club_id, scope, project_id) values (test.get('club')::uuid, 'slides', test.get('project')::uuid) $$, '42501', '없는 종류의 발표는 만들 수 없다');
select test.throws($$ insert into public.presentations (club_id, scope, project_id) values (test.get('club')::uuid, 'project', test.get('other_project')::uuid) $$, '42501', '다른 Club 의 Project 는 공개하지 못한다');
select test.is($$ insert into public.presentations (club_id, scope, project_id) values (test.get('club')::uuid, 'project', test.get('project')::uuid)
  returning show_names || '|' || (token ~ '^[0-9a-f]{32}$') || '|' || (created_by = test.uid('b')) $$, 'false|true|true', '참여자 B 가 공개하면 이름을 가린 발표와 링크 값이 생긴다');
select test.remember('pt', $$ select token from public.presentations where scope = 'project' $$);
select test.throws($$ insert into public.presentations (club_id, scope, project_id) values (test.get('club')::uuid, 'project', test.get('project')::uuid) $$, '23505', '한 Project 에 발표는 하나뿐이다');
select test.throws($$ update public.presentations set token = repeat('b', 32) $$, '42501', '링크 값은 고칠 수 없다');

select test.login('a');
select test.throws($$ insert into public.presentations (club_id, scope, project_id) values (test.get('club')::uuid, 'club', test.get('project')::uuid) $$, '23514', 'Club 발표에 Project 를 붙일 수 없다');
select test.affects($$ insert into public.presentations (club_id, scope) values (test.get('club')::uuid, 'club') $$, 1, '운영자 A 가 Club 발표를 공개한다');
select test.remember('ct', $$ select token from public.presentations where scope = 'club' $$);
select test.throws($$ insert into public.presentations (club_id, scope) values (test.get('club')::uuid, 'club') $$, '23505', '한 Club 에 Club 발표는 하나뿐이다');

-- 보는 사람.
select test.login('c');
select test.is($$ select count(*) from public.presentations $$, '2', '구성원 C 는 공개된 발표와 링크를 본다');
select test.affects($$ update public.presentations set show_names = true $$, 0, '구성원 C 는 이름 표시를 바꾸지 못한다');
select test.affects($$ delete from public.presentations $$, 0, '구성원 C 는 공개를 거두지 못한다');
select test.login('d');
select test.is($$ select count(*) from public.presentations $$, '0', 'Member 가 아닌 D 에게는 발표 목록이 보이지 않는다');
select test.login('e');
select test.is($$ select count(*) from public.presentations $$, '0', '다른 Club 의 E 에게는 보이지 않는다');
select test.anon();
select test.throws($$ select count(*) from public.presentations $$, '42501', '로그인하지 않으면 발표 테이블을 읽지 못한다');
select test.throws($$ select count(*) from public.ai_logs $$, '42501', '로그인하지 않으면 여전히 AI Log 를 읽지 못한다');

-- ---------------------------------------------------------------------------
-- 링크로 읽기: Project 발표
-- ---------------------------------------------------------------------------

select test.is($$ select (public.get_presentation(repeat('0', 32)) is null)::text $$, 'true', '틀린 링크는 아무것도 돌려주지 않는다');
select test.is($$ select (public.get_presentation('abc') is null)::text $$, 'true', '모양이 틀린 링크는 아무것도 돌려주지 않는다');
select test.is($$ select (public.get_presentation(null) is null)::text $$, 'true', '빈 링크는 아무것도 돌려주지 않는다');
select test.is($$ select public.get_presentation(test.get('pt')) ->> 'scope' $$, 'project', '로그인하지 않아도 링크로 Project 발표를 읽는다');
select test.is($$ select (public.get_presentation(test.get('pt')) #>> '{project,name}') || '|' || (public.get_presentation(test.get('pt')) #>> '{project,goal}') || '|' || (public.get_presentation(test.get('pt')) ->> 'clubName') $$, 'RAG 챗봇|자료를 찾아 준다|AI 모각코', '이름과 목표, Club 이름이 나간다');
-- 두 기록은 같은 때에 남겨 순서가 정해지지 않으므로 제목으로 찾는다.
select test.is($$ select jsonb_array_length(public.get_presentation(test.get('pt')) -> 'logs')::text || '|' || (public.get_presentation(test.get('pt')) ->> 'logCount') $$, '2|2', 'Project 에 묶인 기록은 작성자가 따로 허락하지 않아도 모두 나간다');
select test.is($$ select string_agg(item ->> 'title', ',' order by item ->> 'title') from jsonb_array_elements(public.get_presentation(test.get('pt')) -> 'logs') as item $$, '임베딩 실험,청크 크기 실험', '묶인 기록의 제목이 모두 나간다');
select test.is($$ select (public.get_presentation(test.get('pt'))::text like '%묶지 않았다%')::text $$, 'false', 'Project 에 묶지 않은 기록은 나가지 않는다');
select test.is($$ select (item ->> 'learned') || '|' || (item #>> '{tools,0}') from jsonb_array_elements(public.get_presentation(test.get('pt')) -> 'logs') as item where item ->> 'title' = '청크 크기 실험' $$, '중간 크기가 낫다|Claude', '기록의 내용과 도구가 나간다');
select test.is($$ select (public.get_presentation(test.get('pt')) #>> '{links,0,url}') || '|' || jsonb_array_length(public.get_presentation(test.get('pt')) -> 'tasks') || '|' || (public.get_presentation(test.get('pt')) #>> '{tasks,0,done}') $$, 'https://example.com/repo|2|true', '결과물 링크와 할 일이 나간다');
select test.is($$ select (public.get_presentation(test.get('pt')) ->> 'participantCount') || '|' || coalesce(public.get_presentation(test.get('pt')) ->> 'participantNames', '없음') || '|' || coalesce(public.get_presentation(test.get('pt')) #>> '{logs,0,author}', '없음') $$, '1|없음|없음', '이름을 가린 발표에는 참여자 수만 나가고 이름은 없다');
select test.is($$ select (public.get_presentation(test.get('pt'))::text ~ '박서연|seoyeon|example\.com/a|googleusercontent|00000000-0000')::text $$, 'false', '이름, 이메일, 사진 주소, 식별자가 어디에도 없다');

-- 이름을 보이게 하면 이름만 더 나간다.
select test.login('b');
select test.affects($$ update public.presentations set show_names = true where scope = 'project' $$, 1, '참여자 B 가 이름을 보이게 한다');
select test.anon();
select test.is($$ select (public.get_presentation(test.get('pt')) #>> '{participantNames,0}') || '|' || (public.get_presentation(test.get('pt')) #>> '{logs,0,author}') $$, '박서연|박서연', '이름을 보이게 하면 참여자와 작성자의 이름이 나간다');
select test.is($$ select (public.get_presentation(test.get('pt'))::text ~ 'seoyeon|googleusercontent|00000000-0000')::text $$, 'false', '이름을 보여도 이메일, 사진 주소, 식별자는 나가지 않는다');

-- ---------------------------------------------------------------------------
-- 링크로 읽기: Club 발표
-- ---------------------------------------------------------------------------

select test.is($$ select (public.get_presentation(test.get('ct')) ->> 'scope') || '|' || (public.get_presentation(test.get('ct')) ->> 'clubName') || '|' || (public.get_presentation(test.get('ct')) ->> 'clubDescription') $$, 'club|AI 모각코|매주 모여 AI 도구를 써 본다', '로그인하지 않아도 링크로 Club 발표를 읽는다');
select test.is($$ select (public.get_presentation(test.get('ct')) ->> 'memberCount') || '|' || (public.get_presentation(test.get('ct')) ->> 'logCount') || '|' || (public.get_presentation(test.get('ct')) ->> 'projectCount') $$, '3|3|2', '활동의 수가 나간다');
select test.is($$ select jsonb_array_length(public.get_presentation(test.get('ct')) -> 'sessions')::text || '|' || (public.get_presentation(test.get('ct')) #>> '{sessions,0,title}') $$, '1|1회차', '이미 시작한 회차만 나가고 앞으로 열 회차는 나가지 않는다');
select test.is($$ select jsonb_array_length(public.get_presentation(test.get('ct')) -> 'projects')::text || '|' || (public.get_presentation(test.get('ct')) #>> '{projects,0,name}') || '|' || ((public.get_presentation(test.get('ct')) #>> '{projects,0,token}') = test.get('pt'))::text $$, '1|RAG 챗봇|true', '발표를 공개한 Project 만 그 링크와 함께 나간다');
select test.is($$ select (public.get_presentation(test.get('ct'))::text like '%공개하지 않은 Project%')::text $$, 'false', '발표를 공개하지 않은 Project 는 이름도 나가지 않는다');
select test.is($$ select coalesce(public.get_presentation(test.get('ct')) ->> 'memberNames', '없음') || '|' || (public.get_presentation(test.get('ct'))::text ~ '김하늘|박서연|haneul|other@example')::text $$, '없음|false', '이름을 가린 Club 발표에는 Member 의 이름과 이메일이 없다');
select test.is($$ select (public.get_presentation(test.get('ct'))::text ~ '청크 크기|임베딩|묶지 않았다')::text $$, 'false', 'Club 발표에는 AI Log 의 내용이 나가지 않는다');
select test.login('a');
select test.affects($$ update public.presentations set show_names = true where scope = 'club' $$, 1, '운영자 A 가 Club 발표에 이름을 보이게 한다');
select test.anon();
select test.is($$ select jsonb_array_length(public.get_presentation(test.get('ct')) -> 'memberNames')::text || '|' || (public.get_presentation(test.get('ct')) #>> '{memberNames,0}') || '|' || (public.get_presentation(test.get('ct')) #>> '{memberNames,1}') $$, '3|김하늘|박서연', '이름을 보이게 하면 Member 의 이름이 나간다');
select test.is($$ select jsonb_typeof(public.get_presentation(test.get('ct')) #> '{memberNames,2}') || '|' || (public.get_presentation(test.get('ct'))::text ~ '@|haneul|seoyeon|googleusercontent|00000000-0000')::text $$, 'null|false', '이름 대신 이메일을 쓰는 C 의 이름은 비워서 나가고, 이메일은 어디에도 없다');
select test.sudo_is($$ select coalesce(private.public_name('  김하늘 '), '없음') || '|' || coalesce(private.public_name('a@b.c'), '없음') || '|' || coalesce(private.public_name('  '), '없음') || '|' || coalesce(private.public_name(null), '없음') $$, '김하늘|없음|없음|없음', '내보낼 이름을 고르는 규칙');

-- ---------------------------------------------------------------------------
-- 거두기와 함께 지워지는 것
-- ---------------------------------------------------------------------------

select test.login('a');
select test.affects($$ delete from public.presentations where scope = 'project' $$, 1, '참여자가 아닌 운영자 A 도 Project 발표를 거둔다');
select test.anon();
select test.is($$ select (public.get_presentation(test.get('pt')) is null)::text $$, 'true', '거둔 발표의 링크는 바로 쓸 수 없다');
select test.is($$ select jsonb_array_length(public.get_presentation(test.get('ct')) -> 'projects')::text $$, '0', '거둔 Project 는 Club 발표에서도 빠진다');

-- 다시 공개하면 새 링크가 된다.
select test.login('b');
insert into public.presentations (club_id, scope, project_id) values (test.get('club')::uuid, 'project', test.get('project')::uuid);
select test.is($$ select (token <> test.get('pt'))::text from public.presentations where scope = 'project' $$, 'true', '다시 공개하면 새 링크가 된다');
select test.remember('pt2', $$ select token from public.presentations where scope = 'project' $$);

-- 참여를 그만둔 사람은 거두지 못한다.
insert into public.project_members (project_id, club_id, member_id) values (test.get('project')::uuid, test.get('club')::uuid, test.get('member_c')::uuid);
select test.login('c');
select test.affects($$ update public.presentations set show_names = true where scope = 'project' $$, 1, '참여자가 된 C 는 이름 표시를 바꾼다');
delete from public.project_members where project_id = test.get('project')::uuid and member_id = test.get('member_c')::uuid;
select test.affects($$ delete from public.presentations where scope = 'project' $$, 0, '참여를 그만둔 C 는 거두지 못한다');

-- Project 를 지우면 발표도 사라진다.
select test.login('b');
select test.affects($$ delete from public.projects where id = test.get('project')::uuid $$, 1, '만든 사람 B 가 Project 를 지운다');
select test.anon();
select test.is($$ select (public.get_presentation(test.get('pt2')) is null)::text $$, 'true', 'Project 를 지우면 그 발표의 링크도 쓸 수 없다');

-- Club 을 지우면 Club 발표도 사라진다.
select test.login('a');
select test.affects($$ delete from public.clubs where id = test.get('club')::uuid $$, 1, '운영자 A 가 Club 을 지운다');
select test.anon();
select test.is($$ select (public.get_presentation(test.get('ct')) is null)::text $$, 'true', 'Club 을 지우면 Club 발표의 링크도 쓸 수 없다');
select test.sudo_is($$ select count(*) from public.presentations $$, '0', '남은 발표가 없다');

-- 날짜를 정하지 않은 회차는 Club 발표에 나가지 않는다.
select test.login('a');
insert into public.clubs (name) values ('날짜를 정하는 Club');
select test.remember('dated_club', $$ select id from public.clubs where name = '날짜를 정하는 Club' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('dated_club')::uuid, '지난 회차', now() - interval '1 day', now() - interval '23 hours');
insert into public.sessions (club_id, title) values (test.get('dated_club')::uuid, '날짜 미정 회차');
insert into public.presentations (club_id, scope) values (test.get('dated_club')::uuid, 'club');
select test.remember('dated_ct', $$ select token from public.presentations where club_id = test.get('dated_club')::uuid $$);
select test.anon();
select test.is($$ select jsonb_array_length(public.get_presentation(test.get('dated_ct')) -> 'sessions')::text || '|' || (public.get_presentation(test.get('dated_ct')) #>> '{sessions,0,title}') $$, '1|지난 회차', '날짜를 정하지 않은 회차는 Club 발표에 나가지 않는다');
