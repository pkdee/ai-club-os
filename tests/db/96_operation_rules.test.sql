-- 운영 규칙의 접근 규칙. A 는 운영자, B 와 C 는 초대로 들어온 구성원, D 는 Member 가 아니고, E 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.login('c');
select public.join_club(test.get('token')) is not null;
select test.login('e');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);

-- ---------------------------------------------------------------------------
-- 참여를 막은 사람
-- ---------------------------------------------------------------------------

select test.login('b');
select test.throws($$ insert into public.club_bans (club_id, user_id) values (test.get('club')::uuid, test.uid('c')) $$, '42501', '구성원 B 는 다른 사람을 막지 못한다');
select test.login('e');
select test.throws($$ insert into public.club_bans (club_id, user_id) values (test.get('club')::uuid, test.uid('c')) $$, '42501', '다른 Club 의 운영자 E 는 이 Club 에서 막지 못한다');
select test.anon();
select test.throws($$ insert into public.club_bans (club_id, user_id) values (test.get('club')::uuid, test.uid('c')) $$, '42501', '로그인하지 않으면 막지 못한다');
select test.login('a');
select test.throws($$ insert into public.club_bans (club_id, user_id) values (test.get('club')::uuid, test.uid('a')) $$, '42501', '운영자도 자기 자신은 막지 못한다');
select test.throws($$ insert into public.club_bans (club_id, user_id) values (test.get('club')::uuid, test.uid('d')) $$, 'P0001', 'Member 가 아닌 D 는 막을 수 없다');
select test.throws($$ insert into public.club_bans (club_id, user_id, display_name) values (test.get('club')::uuid, test.uid('c'), '꾸민 이름') $$, '42501', '이름을 직접 적어 넣을 수 없다');
select test.throws($$ insert into public.club_bans (club_id, user_id, banned_by) values (test.get('club')::uuid, test.uid('c'), test.uid('b')) $$, '42501', '막은 사람을 직접 적어 넣을 수 없다');
select test.is($$ insert into public.club_bans (club_id, user_id) values (test.get('club')::uuid, test.uid('c'))
  returning display_name || '|' || (banned_by = test.uid('a'))::text $$, 'other@example.com|true', '운영자 A 가 C 를 막으면 이름과 막은 사람이 채워진다');
select test.throws($$ insert into public.club_bans (club_id, user_id) values (test.get('club')::uuid, test.uid('c')) $$, '23505', '같은 사람을 두 번 막을 수 없다');
select test.throws($$ update public.club_bans set display_name = '고친 이름' $$, '42501', '막은 기록은 고칠 수 없다');

select test.is($$ select count(*) from public.club_bans $$, '1', '운영자 A 는 막은 사람을 본다');
select test.login('b');
select test.is($$ select count(*) from public.club_bans $$, '0', '구성원 B 에게는 보이지 않는다');
select test.login('c');
select test.is($$ select count(*) from public.club_bans $$, '0', '막힌 C 본인에게도 보이지 않는다');
select test.login('e');
select test.is($$ select count(*) from public.club_bans $$, '0', '다른 Club 의 운영자 E 에게는 보이지 않는다');
select test.affects($$ delete from public.club_bans where club_id = test.get('club')::uuid $$, 0, '다른 Club 의 운영자 E 는 풀어 주지 못한다');

-- 막힌 채로 내보내지면 초대 링크가 있어도 들어오지 못한다.
select test.login('a');
select test.affects($$ delete from public.members where club_id = test.get('club')::uuid and user_id = test.uid('c') $$, 1, '운영자 A 가 C 를 내보낸다');
select test.is($$ select display_name from public.club_bans where user_id = test.uid('c') $$, 'other@example.com', '내보낸 뒤에도 막은 사람의 이름이 남는다');
select test.login('c');
select test.is($$ select (public.join_club(test.get('token')) is null)::text $$, 'true', '막힌 C 는 초대 링크로 참여하지 못한다');
select test.sudo_is($$ select count(*) from public.members where club_id = test.get('club')::uuid $$, '2', '막힌 사람이 시도해도 Member 는 늘지 않는다');
select test.is($$ select club_name || '|' || already_member || '|' || blocked from public.preview_club_invite(test.get('token')) $$, 'AI 모각코|false|true', '미리 보기는 막혔다고 알려 준다');
select test.login('b');
select test.is($$ select already_member || '|' || blocked from public.preview_club_invite(test.get('token')) $$, 'true|false', 'Member 인 B 의 미리 보기는 막히지 않았다고 한다');
select test.login('d');
select test.is($$ select already_member || '|' || blocked from public.preview_club_invite(test.get('token')) $$, 'false|false', '막히지 않은 D 의 미리 보기는 그대로다');
select test.anon();
select test.throws($$ select * from public.preview_club_invite(test.get('token')) $$, '42501', '로그인하지 않으면 미리 보기를 부르지 못한다');
select test.throws($$ select public.join_club(test.get('token')) $$, '42501', '로그인하지 않으면 참여 함수를 부르지 못한다');

-- 풀어 주면 다시 들어올 수 있다.
select test.login('b');
select test.affects($$ delete from public.club_bans where user_id = test.uid('c') $$, 0, '구성원 B 는 풀어 주지 못한다');
select test.login('a');
select test.affects($$ delete from public.club_bans where user_id = test.uid('c') $$, 1, '운영자 A 가 풀어 준다');
select test.login('c');
select test.is($$ select (public.join_club(test.get('token')) is not null)::text $$, 'true', '풀린 C 는 다시 참여한다');

-- ---------------------------------------------------------------------------
-- AI Log 의 선택
-- ---------------------------------------------------------------------------

select test.login('b');
select test.is($$ insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'B 의 기록', '시도')
  returning exclude_from_insight || '|' || share_in_presentation $$, 'false|false', '두 선택은 기본으로 꺼져 있다');
select test.remember('log_b', $$ select id from public.ai_logs where title = 'B 의 기록' $$);
select test.is($$ insert into public.ai_logs (club_id, title, attempt, exclude_from_insight, share_in_presentation) values (test.get('club')::uuid, 'B 의 둘째 기록', '시도', true, true)
  returning exclude_from_insight || '|' || share_in_presentation $$, 'true|true', '작성자는 쓰면서 두 선택을 켤 수 있다');
select test.remember('log_b2', $$ select id from public.ai_logs where title = 'B 의 둘째 기록' $$);
select test.affects($$ update public.ai_logs set share_in_presentation = true where id = test.get('log_b')::uuid $$, 1, '작성자 B 는 발표에 넣기를 켠다');
select test.login('a');
select test.affects($$ update public.ai_logs set share_in_presentation = false, exclude_from_insight = true where id = test.get('log_b')::uuid $$, 0, '운영자 A 도 남의 기록의 선택은 바꾸지 못한다');
select test.login('c');
select test.affects($$ update public.ai_logs set share_in_presentation = false where id = test.get('log_b')::uuid $$, 0, '다른 구성원 C 도 바꾸지 못한다');

-- ---------------------------------------------------------------------------
-- 지운 기록
-- ---------------------------------------------------------------------------

select test.login('b');
select test.affects($$ delete from public.ai_logs where id = test.get('log_b2')::uuid $$, 1, '작성자 B 가 자기 기록을 지운다');
select test.sudo_is($$ select entity || '|' || title || '|' || owner_name || '|' || deleted_by_name || '|' || (deleted_by = test.uid('b'))::text from public.deletion_logs $$,
  'ai_log|B 의 둘째 기록|박서연|박서연|true', '지운 기록에 종류, 제목, 작성자, 지운 사람이 남는다');
select test.login('a');
select test.affects($$ delete from public.ai_logs where id = test.get('log_b')::uuid $$, 1, '운영자 A 가 B 의 기록을 지운다');
select test.is($$ select owner_name || '|' || deleted_by_name from public.deletion_logs where title = 'B 의 기록' $$, '박서연|김하늘', '남의 기록을 지우면 작성자와 지운 사람이 따로 남는다');

-- Session 을 지우면 Session 만 남고, 함께 지워진 AI Insight 는 남기지 않는다.
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '1회차', '2026-10-01 10:00+09', '2026-10-01 12:00+09');
select test.remember('session', $$ select id from public.sessions where title = '1회차' $$);
insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '{"v":1}', 'anthropic', 'm');
select test.affects($$ delete from public.sessions where id = test.get('session')::uuid $$, 1, '운영자 A 가 Session 을 지운다');
select test.is($$ select count(*) from public.ai_insights $$, '0', 'Session 의 AI Insight 도 함께 지워진다');
select test.is($$ select string_agg(entity || ':' || title, ',' order by created_at, entity) from public.deletion_logs where entity in ('session', 'ai_insight') $$, 'session:1회차', '함께 지워진 AI Insight 는 지운 기록에 남지 않는다');

-- AI Insight 를 직접 지우면 무엇을 정리한 것이었는지 남는다.
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '2회차', '2026-10-08 10:00+09', '2026-10-08 12:00+09');
select test.remember('session2', $$ select id from public.sessions where title = '2회차' $$);
insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session2')::uuid, '{"v":1}', 'anthropic', 'm');
insert into public.ai_insights (club_id, scope, period_start, period_end, content, provider, model) values (test.get('club')::uuid, 'period', '2026-10-01 00:00+09', '2026-11-01 00:00+09', '{"v":1}', 'anthropic', 'm');
select test.affects($$ delete from public.ai_insights where club_id = test.get('club')::uuid $$, 2, '운영자 A 가 AI Insight 두 개를 지운다');
select test.is($$ select string_agg(title, ',' order by title) from public.deletion_logs where entity = 'ai_insight' $$, '2026년 10월,2회차', '지운 AI Insight 는 회차의 제목이나 달로 남는다');

-- Project 를 지우면 Project 만 남는다.
select test.login('b');
insert into public.projects (club_id, name) values (test.get('club')::uuid, 'RAG 챗봇');
select test.remember('project', $$ select id from public.projects where name = 'RAG 챗봇' $$);
insert into public.project_tasks (project_id, club_id, title) values (test.get('project')::uuid, test.get('club')::uuid, '할 일');
select test.affects($$ delete from public.projects where id = test.get('project')::uuid $$, 1, '만든 사람 B 가 Project 를 지운다');
select test.sudo_is($$ select deleted_by_name || '|' || coalesce(owner_name, '없음') from public.deletion_logs where entity = 'project' and title = 'RAG 챗봇' $$, '박서연|없음', '지운 Project 가 남고 작성자 칸은 비어 있다');

-- 보는 사람.
select test.is($$ select count(*) from public.deletion_logs $$, '0', '구성원 B 에게는 지운 기록이 보이지 않는다');
select test.login('e');
select test.is($$ select count(*) from public.deletion_logs $$, '0', '다른 Club 의 운영자 E 에게는 보이지 않는다');
select test.login('a');
select test.is($$ select count(*) from public.deletion_logs $$, '6', '운영자 A 는 지운 기록을 모두 본다');
select test.throws($$ insert into public.deletion_logs (club_id, entity, title) values (test.get('club')::uuid, 'ai_log', '꾸민 기록') $$, '42501', '운영자도 지운 기록을 직접 넣지 못한다');
select test.throws($$ update public.deletion_logs set title = '고친 제목' $$, '42501', '지운 기록은 고칠 수 없다');
select test.throws($$ delete from public.deletion_logs $$, '42501', '지운 기록은 지울 수 없다');

-- 나간 사람이 지웠던 기록에는 이름이 남는다.
select test.login('b');
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'B 의 셋째 기록', '시도');
select test.affects($$ delete from public.members where club_id = test.get('club')::uuid and user_id = test.uid('b') $$, 1, 'B 가 스스로 나간다');
select test.sudo_is($$ select count(*) from public.deletion_logs where club_id = test.get('club')::uuid $$, '6', 'Member 가 나가는 것은 지운 기록에 남지 않는다');
select test.sudo_is($$ select count(*) from public.deletion_logs where deleted_by_name = '박서연' $$, '2', '나간 사람이 지웠던 기록에는 이름이 남는다');
select test.login('a');
select test.affects($$ delete from public.ai_logs where title = 'B 의 셋째 기록' $$, 1, '운영자 A 가 나간 사람의 기록을 지운다');
select test.is($$ select coalesce(owner_name, '없음') from public.deletion_logs where title = 'B 의 셋째 기록' $$, '없음', '작성자가 나간 기록을 지우면 작성자 칸은 비어 있다');

-- ---------------------------------------------------------------------------
-- AI Insight 를 만든 횟수
-- ---------------------------------------------------------------------------

select test.login('c');
select test.throws($$ insert into public.ai_insight_runs (club_id) values (test.get('club')::uuid) $$, '42501', '구성원 C 는 횟수를 남기지 못한다');
select test.login('e');
select test.throws($$ insert into public.ai_insight_runs (club_id) values (test.get('club')::uuid) $$, '42501', '다른 Club 의 운영자 E 는 이 Club 에 남기지 못한다');
select test.login('a');
select test.throws($$ insert into public.ai_insight_runs (club_id, created_at) values (test.get('club')::uuid, now() - interval '2 days') $$, '42501', '남긴 시각을 직접 적어 넣을 수 없다');
select test.throws($$ insert into public.ai_insight_runs (club_id, created_by) values (test.get('club')::uuid, test.uid('c')) $$, '42501', '남긴 사람을 직접 적어 넣을 수 없다');
select test.affects($$ insert into public.ai_insight_runs (club_id) select test.get('club')::uuid from generate_series(1, 10) $$, 10, '운영자 A 는 하루에 열 번까지 남긴다');
select test.throws($$ insert into public.ai_insight_runs (club_id) values (test.get('club')::uuid) $$, 'P0001', '열한 번째는 막힌다');
select test.sudo_is($$ select private.ai_insight_daily_limit()::text $$, '10', '하루 횟수는 10 이다');
select test.is($$ select count(*) from public.ai_insight_runs $$, '10', '운영자 A 는 남긴 횟수를 본다');
select test.throws($$ delete from public.ai_insight_runs $$, '42501', '남긴 횟수는 지울 수 없다');
select test.throws($$ update public.ai_insight_runs set created_at = now() - interval '2 days' $$, '42501', '남긴 횟수는 고칠 수 없다');
select test.login('c');
select test.is($$ select count(*) from public.ai_insight_runs $$, '0', '구성원 C 에게는 보이지 않는다');
select test.login('e');
select test.affects($$ insert into public.ai_insight_runs (club_id) values (test.get('other_club')::uuid) $$, 1, '다른 Club 의 횟수는 따로 센다');

-- 하루는 한국 시간으로 나눈다. 어제 남긴 것은 세지 않는다.
select test.sudo($$ update public.ai_insight_runs set created_at = (date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul') - interval '1 second' where club_id = test.get('club')::uuid $$);
select test.login('a');
select test.affects($$ insert into public.ai_insight_runs (club_id) values (test.get('club')::uuid) $$, 1, '날이 바뀌면 다시 남길 수 있다');

-- ---------------------------------------------------------------------------
-- Club 을 지울 때
-- ---------------------------------------------------------------------------

select test.login('c');
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'C 의 기록', '시도');
select test.login('a');
insert into public.club_bans (club_id, user_id) values (test.get('club')::uuid, test.uid('c'));
select test.affects($$ delete from public.clubs where id = test.get('club')::uuid $$, 1, '운영자 A 가 Club 을 지운다');
select test.sudo_is($$ select (select count(*) from public.deletion_logs where club_id = test.get('club')::uuid) || '|' || (select count(*) from public.club_bans where club_id = test.get('club')::uuid) || '|' || (select count(*) from public.ai_insight_runs where club_id = test.get('club')::uuid) $$, '0|0|0', 'Club 을 지우면 운영 기록도 함께 지워진다');
select test.sudo_is($$ select count(*) from public.ai_insight_runs $$, '1', '다른 Club 의 기록은 그대로다');
