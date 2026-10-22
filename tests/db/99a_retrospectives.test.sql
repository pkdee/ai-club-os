-- 회고. Project, Session, 한 달을 사람마다 하나씩 돌아본다.
-- A 는 운영자, B 와 C 는 초대로 들어온 구성원, D 는 Member 가 아니고, E 는 다른 Club 의 운영자다.
-- B 가 Project 를 만들어 혼자 참여자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '1회차', now() - interval '7 days', now() - interval '7 days' + interval '2 hours');
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '앞으로 열 회차', now() + interval '1 day', now() + interval '1 day' + interval '2 hours');
insert into public.sessions (club_id, title) values (test.get('club')::uuid, '날짜 미정 회차');
select test.remember('session', $$ select id from public.sessions where title = '1회차' $$);
select test.remember('future', $$ select id from public.sessions where title = '앞으로 열 회차' $$);
select test.remember('undecided', $$ select id from public.sessions where title = '날짜 미정 회차' $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
insert into public.projects (club_id, name) values (test.get('club')::uuid, 'RAG 챗봇');
select test.remember('project', $$ select id from public.projects where name = 'RAG 챗봇' $$);
select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.login('e');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('other_club')::uuid, '다른 Club 의 회차', now() - interval '1 day', now() - interval '23 hours');
select test.remember('other_session', $$ select id from public.sessions where title = '다른 Club 의 회차' $$);
select test.remember('this_month', $$ select date_trunc('month', now() at time zone 'Asia/Seoul')::date $$);
select test.remember('next_month', $$ select (date_trunc('month', now() at time zone 'Asia/Seoul') + interval '1 month')::date $$);
select test.remember('last_month', $$ select (date_trunc('month', now() at time zone 'Asia/Seoul') - interval '1 month')::date $$);

-- ---------------------------------------------------------------------------
-- Project 회고
-- ---------------------------------------------------------------------------

select test.login('b');
select test.is($$ insert into public.retrospectives (club_id, scope, project_id, went_well, to_improve, to_try) values (test.get('club')::uuid, 'project', test.get('project')::uuid, '평가 질문을 먼저 정했다', '일정을 늦게 잡았다', '중간 공유를 한 번 더 한다') returning (author_id = test.uid('b'))::text $$, 'true', '참여자 B 가 Project 회고를 쓰고 작성자는 B 로 정해진다');
select test.throws($$ insert into public.retrospectives (club_id, scope, project_id, went_well) values (test.get('club')::uuid, 'project', test.get('project')::uuid, '한 번 더') $$, '23505', '같은 Project 에 회고를 두 번 쓸 수 없다');
select test.throws($$ insert into public.retrospectives (club_id, scope, project_id, author_id, went_well) values (test.get('club')::uuid, 'project', test.get('project')::uuid, test.uid('c'), '남의 이름으로') $$, '42501', '작성자를 정해서 넣을 수 없다');
select test.login('c');
select test.throws($$ insert into public.retrospectives (club_id, scope, project_id, went_well) values (test.get('club')::uuid, 'project', test.get('project')::uuid, '참여하지 않았다') $$, '42501', '참여자가 아닌 구성원 C 는 Project 회고를 쓸 수 없다');
select test.login('a');
select test.throws($$ insert into public.retrospectives (club_id, scope, project_id, went_well) values (test.get('club')::uuid, 'project', test.get('project')::uuid, '운영자다') $$, '42501', '참여자가 아니면 운영자도 Project 회고를 쓸 수 없다');
select test.login('d');
select test.throws($$ insert into public.retrospectives (club_id, scope, project_id, went_well) values (test.get('club')::uuid, 'project', test.get('project')::uuid, '끼어들기') $$, '42501', 'Member 가 아닌 D 는 회고를 쓸 수 없다');
select test.anon();
select test.throws($$ insert into public.retrospectives (club_id, scope, project_id, went_well) values (test.get('club')::uuid, 'project', test.get('project')::uuid, '로그인 없이') $$, '42501', '로그인하지 않으면 회고를 쓸 수 없다');
select test.throws($$ select count(*) from public.retrospectives $$, '42501', '로그인하지 않으면 회고를 읽을 수 없다');

-- ---------------------------------------------------------------------------
-- Session 회고
-- ---------------------------------------------------------------------------

select test.login('c');
select test.affects($$ insert into public.retrospectives (club_id, scope, session_id, to_improve) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '실습 시간이 모자랐다') $$, 1, '구성원 C 가 시작한 Session 의 회고를 한 칸만 적어 쓴다');
select test.throws($$ insert into public.retrospectives (club_id, scope, session_id, went_well) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '또 쓴다') $$, '23505', '같은 Session 에 회고를 두 번 쓸 수 없다');
select test.throws($$ insert into public.retrospectives (club_id, scope, session_id, went_well) values (test.get('club')::uuid, 'session', test.get('future')::uuid, '미리 쓴다') $$, '23514', '아직 시작하지 않은 Session 에는 쓸 수 없다');
select test.throws($$ insert into public.retrospectives (club_id, scope, session_id, went_well) values (test.get('club')::uuid, 'session', test.get('undecided')::uuid, '날짜도 없다') $$, '23514', '날짜를 정하지 않은 Session 에는 쓸 수 없다');
select test.throws($$ insert into public.retrospectives (club_id, scope, session_id, went_well) values (test.get('club')::uuid, 'session', test.get('other_session')::uuid, '다른 Club 의 회차') $$, '23514', '다른 Club 의 Session 에는 쓸 수 없다');
select test.login('b');
select test.affects($$ insert into public.retrospectives (club_id, scope, session_id, went_well, to_try) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '서로 화면을 보여 줬다', '다음에는 주제를 미리 알린다') $$, 1, '같은 Session 에 B 도 자기 회고를 쓴다');
select test.login('a');
select test.affects($$ insert into public.retrospectives (club_id, scope, session_id, went_well) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '모두 기록을 남겼다') $$, 1, '운영자 A 도 Session 회고를 쓴다');

-- ---------------------------------------------------------------------------
-- 한 달 회고
-- ---------------------------------------------------------------------------

select test.login('c');
select test.affects($$ insert into public.retrospectives (club_id, scope, period_start, went_well) values (test.get('club')::uuid, 'month', test.get('this_month')::date, '기록을 네 번 남겼다') $$, 1, 'C 가 이번 달의 회고를 쓴다');
select test.affects($$ insert into public.retrospectives (club_id, scope, period_start, to_try) values (test.get('club')::uuid, 'month', test.get('last_month')::date, '지난달에 못 한 것을 해 본다') $$, 1, '지난달의 회고도 쓸 수 있다');
select test.throws($$ insert into public.retrospectives (club_id, scope, period_start, went_well) values (test.get('club')::uuid, 'month', test.get('this_month')::date, '또 쓴다') $$, '23505', '같은 달에 회고를 두 번 쓸 수 없다');
select test.throws($$ insert into public.retrospectives (club_id, scope, period_start, went_well) values (test.get('club')::uuid, 'month', test.get('next_month')::date, '미리 쓴다') $$, '23514', '아직 오지 않은 달의 회고는 쓸 수 없다');
select test.throws($$ insert into public.retrospectives (club_id, scope, period_start, went_well) values (test.get('club')::uuid, 'month', test.get('last_month')::date + 1, '첫날이 아니다') $$, '23514', '달의 첫날이 아닌 날짜는 받지 않는다');
select test.login('b');
select test.affects($$ insert into public.retrospectives (club_id, scope, period_start, went_well) values (test.get('club')::uuid, 'month', test.get('this_month')::date, 'B 의 이번 달') $$, 1, '같은 달에 B 도 자기 회고를 쓴다');

-- ---------------------------------------------------------------------------
-- 모양
-- ---------------------------------------------------------------------------

select test.login('a');
select test.throws($$ insert into public.retrospectives (club_id, scope, period_start, went_well, to_improve, to_try) values (test.get('club')::uuid, 'month', test.get('this_month')::date, '  ', '', E'\n') $$, '23514', '세 칸이 모두 비어 있으면 쓸 수 없다');
select test.throws($$ insert into public.retrospectives (club_id, scope, period_start, went_well) values (test.get('club')::uuid, 'month', test.get('this_month')::date, repeat('가', 2001)) $$, '23514', '한 칸에 2001자는 넣을 수 없다');
select test.affects($$ insert into public.retrospectives (club_id, scope, period_start, went_well) values (test.get('club')::uuid, 'month', test.get('this_month')::date, repeat('가', 2000)) $$, 1, '한 칸에 2000자는 된다');
select test.throws($$ insert into public.retrospectives (club_id, scope, session_id, period_start, went_well) values (test.get('club')::uuid, 'month', test.get('session')::uuid, test.get('last_month')::date, '대상이 둘') $$, '23514', '대상을 둘 적을 수 없다');
select test.throws($$ insert into public.retrospectives (club_id, scope, went_well) values (test.get('club')::uuid, 'session', '대상이 없다') $$, '23514', '대상 없이 쓸 수 없다');
select test.throws($$ insert into public.retrospectives (club_id, scope, period_start, went_well) values (test.get('club')::uuid, 'year', test.get('last_month')::date, '없는 단위') $$, '23514', '정해진 세 단위만 받는다');

-- ---------------------------------------------------------------------------
-- 보는 사람
-- ---------------------------------------------------------------------------

select test.login('c');
select test.is($$ select count(*) from public.retrospectives $$, '8', '구성원 C 는 Club 의 회고를 모두 본다');
select test.is($$ select count(*) from public.retrospectives where scope = 'month' and author_id <> test.uid('c') $$, '2', '다른 사람의 한 달 회고도 본다');
select test.login('d');
select test.is($$ select count(*) from public.retrospectives $$, '0', 'Member 가 아닌 D 에게는 보이지 않는다');
select test.login('e');
select test.is($$ select count(*) from public.retrospectives $$, '0', '다른 Club 의 운영자 E 에게는 보이지 않는다');
select test.throws($$ insert into public.retrospectives (club_id, scope, session_id, went_well) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '남의 Club') $$, '42501', 'E 는 남의 Club 에 회고를 쓸 수 없다');

-- ---------------------------------------------------------------------------
-- 고치기
-- ---------------------------------------------------------------------------

select test.login('b');
select test.remember('before', $$ select updated_at::text from public.retrospectives where scope = 'project' $$);
select test.affects($$ update public.retrospectives set went_well = '평가 질문을 먼저 정한 것이 좋았다', to_improve = to_improve, to_try = to_try where scope = 'project' $$, 1, 'B 가 자기 Project 회고를 고친다');
select test.is($$ select (updated_at::text <> test.get('before'))::text from public.retrospectives where scope = 'project' $$, 'true', '내용을 고치면 고친 시각이 바뀐다');
select test.remember('before', $$ select updated_at::text from public.retrospectives where scope = 'project' $$);
select test.affects($$ update public.retrospectives set went_well = went_well, to_improve = to_improve, to_try = to_try where scope = 'project' $$, 1, '같은 내용으로 다시 저장한다');
select test.is($$ select (updated_at::text = test.get('before'))::text from public.retrospectives where scope = 'project' $$, 'true', '내용이 그대로면 고친 시각도 그대로다');
select test.throws($$ update public.retrospectives set went_well = '', to_improve = '', to_try = ' ' where scope = 'project' $$, '23514', '고쳐서 세 칸을 모두 비울 수 없다');
select test.throws($$ update public.retrospectives set scope = 'month' where scope = 'project' $$, '42501', '단위는 바꿀 수 없다');
select test.throws($$ update public.retrospectives set project_id = null where scope = 'project' $$, '42501', '대상은 바꿀 수 없다');
select test.throws($$ update public.retrospectives set author_id = test.uid('c') where scope = 'project' $$, '42501', '작성자는 바꿀 수 없다');
select test.login('c');
select test.affects($$ update public.retrospectives set went_well = 'C 가 고침' where scope = 'project' $$, 0, 'C 는 B 의 회고를 고칠 수 없다');
select test.login('a');
select test.affects($$ update public.retrospectives set went_well = '운영자가 고침' where scope = 'project' $$, 0, '운영자도 남의 회고를 고칠 수 없다');

-- ---------------------------------------------------------------------------
-- 지우기와 지운 기록
-- ---------------------------------------------------------------------------

select test.login('c');
select test.affects($$ delete from public.retrospectives where author_id = test.uid('b') $$, 0, 'C 는 B 의 회고를 지울 수 없다');
select test.affects($$ delete from public.retrospectives where scope = 'month' and period_start = test.get('last_month')::date and author_id = test.uid('c') $$, 1, 'C 가 자기 지난달 회고를 지운다');
select test.login('a');
select test.affects($$ delete from public.retrospectives where scope = 'session' and author_id = test.uid('c') $$, 1, '운영자 A 가 C 의 Session 회고를 지운다');
select test.is($$ select entity || '|' || title || '|' || coalesce(owner_name, '없음') || '|' || deleted_by_name from public.deletion_logs where entity = 'retrospective' and title = '1회차' $$, 'retrospective|1회차|other@example.com|김하늘', '지운 기록에 회고와 돌아본 회차, 작성자, 지운 사람이 남는다');
select test.is($$ select count(*) from public.deletion_logs where entity = 'retrospective' and title = to_char(test.get('last_month')::date, 'YYYY"년" FMMM"월"') and deleted_by_name = 'other@example.com' $$, '1', '스스로 지운 한 달 회고는 그 달의 이름으로 남는다');
select test.login('b');
select test.affects($$ delete from public.retrospectives where scope = 'project' $$, 1, 'B 가 자기 Project 회고를 지운다');
select test.sudo_is($$ select title || '|' || owner_name from public.deletion_logs where entity = 'retrospective' and title = 'RAG 챗봇' $$, 'RAG 챗봇|박서연', 'Project 회고는 Project 이름으로 남는다');
select test.affects($$ insert into public.retrospectives (club_id, scope, project_id, to_try) values (test.get('club')::uuid, 'project', test.get('project')::uuid, '다시 쓴 회고') $$, 1, '지운 뒤에는 다시 쓸 수 있다');

-- ---------------------------------------------------------------------------
-- 대상이나 작성자가 사라질 때
-- ---------------------------------------------------------------------------

select test.remember('logged', $$ select count(*) from public.deletion_logs where entity = 'retrospective' $$);
select test.login('a');
select test.affects($$ delete from public.projects where id = test.get('project')::uuid $$, 1, '운영자가 Project 를 지운다');
select test.sudo_is($$ select count(*) from public.retrospectives where scope = 'project' $$, '0', 'Project 를 지우면 그 회고도 함께 지워진다');
select test.affects($$ delete from public.sessions where id = test.get('session')::uuid $$, 1, '운영자가 Session 을 지운다');
select test.sudo_is($$ select count(*) from public.retrospectives where scope = 'session' $$, '0', 'Session 을 지우면 그 회고도 함께 지워진다');
select test.sudo_is($$ select (count(*)::text = test.get('logged'))::text from public.deletion_logs where entity = 'retrospective' $$, 'true', '함께 지워진 회고는 지운 기록에 따로 남지 않는다');
select test.sudo_is($$ select string_agg(entity, ',' order by entity) from public.deletion_logs where entity in ('project', 'session') $$, 'project,session', 'Project 와 Session 을 지운 기록은 남는다');

select test.login('c');
select test.affects($$ delete from public.members where user_id = test.uid('c') $$, 1, 'C 가 Club 에서 나간다');
select test.sudo_is($$ select count(*) || '|' || count(author_id) from public.retrospectives where scope = 'month' and went_well = '기록을 네 번 남겼다' $$, '1|0', '나간 사람의 회고는 작성자 없이 남는다');
select test.login('b');
select test.affects($$ delete from public.retrospectives where author_id is null $$, 0, '구성원 B 는 작성자가 없는 회고를 지울 수 없다');
select test.login('a');
select test.affects($$ delete from public.retrospectives where author_id is null $$, 1, '운영자 A 는 작성자가 없는 회고를 지운다');
select test.sudo_is($$ select coalesce(owner_name, '없음') from public.deletion_logs where entity = 'retrospective' order by created_at desc, id desc limit 1 $$, '없음', '작성자가 없던 회고의 지운 기록에는 작성자 이름이 없다');

select test.affects($$ delete from public.clubs where id = test.get('club')::uuid $$, 1, '운영자가 Club 을 지운다');
select test.sudo_is($$ select count(*) from public.retrospectives $$, '0', 'Club 을 지우면 회고도 모두 지워진다');
