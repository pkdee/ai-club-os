-- AI Insight 의 접근 규칙. A 는 운영자, B 는 초대로 들어온 구성원, C 는 다른 Club 의 운영자, D 는 Member 가 아니다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '3회차', now(), now() + interval '1 hour');
select test.remember('session', $$ select id from public.sessions where title = '3회차' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '4회차', now() + interval '7 days', now() + interval '7 days 1 hour');
select test.remember('session4', $$ select id from public.sessions where title = '4회차' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
insert into public.ai_logs (club_id, session_id, title, attempt) values (test.get('club')::uuid, test.get('session')::uuid, 'A 의 기록', 'x');
select test.login('b');
select public.join_club(test.get('token')) is not null;
select test.remember('member_b', $$ select id from public.members where user_id = test.uid('b') $$);
select test.login('c');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('other_club')::uuid, '다른 회차', now(), now() + interval '1 hour');
select test.remember('other_session', $$ select id from public.sessions where title = '다른 회차' $$);

-- 만들기.
select test.login('b');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '{"v":1}', 'anthropic', 'm') $$, '42501', '구성원 B 는 AI Insight 를 만들지 못한다');
select test.login('c');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '{"v":1}', 'anthropic', 'm') $$, '42501', '다른 Club 의 운영자 C 는 이 Club 에 만들지 못한다');
select test.login('d');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '{"v":1}', 'anthropic', 'm') $$, '42501', 'Member 가 아닌 D 는 만들지 못한다');
select test.anon();
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '{"v":1}', 'anthropic', 'm') $$, '42501', '로그인하지 않으면 만들지 못한다');

select test.login('a');
select test.is($$ insert into public.ai_insights (club_id, scope, session_id, content, source_log_ids, provider, model)
  values (test.get('club')::uuid, 'session', test.get('session')::uuid, '{"v":1,"overview":"처음"}', array[gen_random_uuid()], 'anthropic', 'claude-test')
  returning status || '|' || (created_by = test.uid('a'))::text || '|' || (published_at is null)::text $$, 'draft|true|true', '운영자 A 가 만들면 본인의 초안이 되고 만든 행을 돌려받는다');
select test.remember('insight', $$ select id from public.ai_insights where scope = 'session' $$);
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model, status) values (test.get('club')::uuid, 'session', test.get('session4')::uuid, '{"v":1}', 'anthropic', 'm', 'published') $$, '42501', '만들면서 바로 공개할 수 없다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model, created_by) values (test.get('club')::uuid, 'session', test.get('session4')::uuid, '{"v":1}', 'anthropic', 'm', test.uid('b')) $$, '42501', '만든 사람을 직접 적어 넣을 수 없다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model, published_at) values (test.get('club')::uuid, 'session', test.get('session4')::uuid, '{"v":1}', 'anthropic', 'm', now()) $$, '42501', '공개한 시각을 직접 적어 넣을 수 없다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session')::uuid, '{"v":1}', 'anthropic', 'm') $$, '23505', '한 회차에 두 개를 만들 수 없다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('other_session')::uuid, '{"v":1}', 'anthropic', 'm') $$, '23503', '다른 Club 의 Session 에 묶을 수 없다');
select test.throws($$ insert into public.ai_insights (club_id, scope, content, provider, model) values (test.get('club')::uuid, 'session', '{"v":1}', 'anthropic', 'm') $$, '23514', '회차를 정리한 것에는 Session 이 있어야 한다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, period_start, period_end, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session4')::uuid, now(), now() + interval '1 day', '{"v":1}', 'anthropic', 'm') $$, '23514', '회차를 정리한 것에 기간을 함께 넣을 수 없다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'weekly', test.get('session4')::uuid, '{"v":1}', 'anthropic', 'm') $$, '23514', '없는 종류는 넣을 수 없다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session4')::uuid, '[1,2]', 'anthropic', 'm') $$, '23514', '내용은 객체여야 한다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session4')::uuid, jsonb_build_object('v', 1, 'overview', repeat('가', 20000)), 'anthropic', 'm') $$, '23514', '너무 큰 내용은 넣을 수 없다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, content, provider, model) values (test.get('club')::uuid, 'session', test.get('session4')::uuid, '{"v":1}', '  ', 'm') $$, '23514', 'Provider 이름은 비울 수 없다');

-- 기간을 정리한 것.
select test.affects($$ insert into public.ai_insights (club_id, scope, period_start, period_end, content, provider, model) values (test.get('club')::uuid, 'period', '2026-09-30 15:00+00', '2026-10-31 15:00+00', '{"v":1}', 'anthropic', 'm') $$, 1, 'A 가 한 달을 정리한 것을 만든다');
select test.remember('period', $$ select id from public.ai_insights where scope = 'period' $$);
select test.throws($$ insert into public.ai_insights (club_id, scope, period_start, period_end, content, provider, model) values (test.get('club')::uuid, 'period', '2026-09-30 15:00+00', '2026-10-31 15:00+00', '{"v":1}', 'anthropic', 'm') $$, '23505', '같은 기간에 두 개를 만들 수 없다');
select test.affects($$ insert into public.ai_insights (club_id, scope, period_start, period_end, content, provider, model) values (test.get('club')::uuid, 'period', '2026-08-31 15:00+00', '2026-09-30 15:00+00', '{"v":1}', 'anthropic', 'm') $$, 1, '다른 기간은 따로 만들 수 있다');
select test.throws($$ insert into public.ai_insights (club_id, scope, period_start, period_end, content, provider, model) values (test.get('club')::uuid, 'period', '2026-10-31 15:00+00', '2026-09-30 15:00+00', '{"v":1}', 'anthropic', 'm') $$, '23514', '끝이 시작보다 앞선 기간은 넣을 수 없다');
select test.throws($$ insert into public.ai_insights (club_id, scope, session_id, period_start, period_end, content, provider, model) values (test.get('club')::uuid, 'period', test.get('session4')::uuid, '2026-07-31 15:00+00', '2026-08-31 15:00+00', '{"v":1}', 'anthropic', 'm') $$, '23514', '기간을 정리한 것에 Session 을 함께 넣을 수 없다');

-- 초안은 운영자만 본다.
select test.is($$ select count(*) from public.ai_insights $$, '3', '운영자 A 는 초안을 모두 본다');
select test.login('b');
select test.is($$ select count(*) from public.ai_insights $$, '0', '구성원 B 에게는 초안이 보이지 않는다');
select test.affects($$ update public.ai_insights set status = 'published' $$, 0, '구성원 B 는 공개하지 못한다');
select test.affects($$ update public.ai_insights set content = '{"v":1,"overview":"B 가 고침"}' $$, 0, '구성원 B 는 내용을 고치지 못한다');
select test.affects($$ delete from public.ai_insights $$, 0, '구성원 B 는 지우지 못한다');
select test.login('c');
select test.is($$ select count(*) from public.ai_insights $$, '0', '다른 Club 의 C 에게는 보이지 않는다');
select test.login('d');
select test.is($$ select count(*) from public.ai_insights $$, '0', 'Member 가 아닌 D 에게는 보이지 않는다');
select test.anon();
select test.throws($$ select count(*) from public.ai_insights $$, '42501', '로그인하지 않으면 읽지 못한다');

-- 고치기와 공개.
select test.login('a');
select test.remember('before', $$ select updated_at::text from public.ai_insights where id = test.get('insight')::uuid $$);
select test.affects($$ update public.ai_insights set content = '{"v":1,"overview":"고친 내용"}' where id = test.get('insight')::uuid $$, 1, 'A 가 초안의 내용을 고친다');
select test.is($$ select (updated_at::text <> test.get('before'))::text || '|' || status from public.ai_insights where id = test.get('insight')::uuid $$, 'true|draft', '고치면 고친 시각이 바뀌고 초안으로 남는다');
select test.is($$ with changed as (update public.ai_insights set status = 'published' where id = test.get('insight')::uuid returning published_at) select (published_at is not null)::text from changed $$, 'true', 'A 가 공개하면 공개한 시각이 적힌다');
select test.throws($$ update public.ai_insights set published_at = now() - interval '1 year' where id = test.get('insight')::uuid $$, '42501', '공개한 시각을 직접 고칠 수 없다');
select test.throws($$ update public.ai_insights set club_id = test.get('other_club')::uuid where id = test.get('insight')::uuid $$, '42501', '다른 Club 으로 옮길 수 없다');
select test.throws($$ update public.ai_insights set session_id = test.get('session4')::uuid where id = test.get('insight')::uuid $$, '42501', '다른 Session 으로 옮길 수 없다');
select test.throws($$ update public.ai_insights set created_by = test.uid('b') where id = test.get('insight')::uuid $$, '42501', '만든 사람을 바꿀 수 없다');
select test.throws($$ update public.ai_insights set status = 'archived' where id = test.get('insight')::uuid $$, '23514', '없는 상태로 바꿀 수 없다');

select test.login('b');
select test.is($$ select count(*) || '|' || min(scope) from public.ai_insights $$, '1|session', '공개하면 구성원 B 에게 그것만 보인다');
select test.affects($$ update public.ai_insights set status = 'draft' $$, 0, '구성원 B 는 공개된 것을 초안으로 되돌리지 못한다');
select test.affects($$ delete from public.ai_insights $$, 0, '구성원 B 는 공개된 것도 지우지 못한다');
select test.login('c');
select test.is($$ select count(*) from public.ai_insights $$, '0', '공개해도 다른 Club 의 C 에게는 보이지 않는다');

-- 다시 만들면 같은 행을 고쳐 쓰고 초안으로 돌아간다.
select test.login('a');
select test.affects($$ update public.ai_insights set content = '{"v":1,"overview":"다시 만듦"}', source_log_ids = '{}', provider = 'anthropic', model = 'claude-next', status = 'draft' where id = test.get('insight')::uuid $$, 1, 'A 가 다시 만들어 같은 행을 고쳐 쓴다');
select test.is($$ select status || '|' || (published_at is null)::text || '|' || model from public.ai_insights where id = test.get('insight')::uuid $$, 'draft|true|claude-next', '초안으로 돌아가면 공개한 시각이 비워진다');
select test.login('b');
select test.is($$ select count(*) from public.ai_insights $$, '0', '초안으로 돌아가면 구성원 B 에게 다시 보이지 않는다');

-- 운영자였던 사람이 구성원이 되면 초안을 보지 못한다.
select test.login('a');
select test.affects($$ update public.ai_insights set status = 'published' where id = test.get('period')::uuid $$, 1, 'A 가 한 달을 정리한 것을 공개한다');
select test.affects($$ update public.members set role = 'admin' where id = test.get('member_b')::uuid $$, 1, 'A 가 B 를 운영자로 지정한다');
select test.login('b');
select test.is($$ select count(*) from public.ai_insights $$, '3', '운영자가 된 B 는 초안까지 본다');
select test.affects($$ update public.members set role = 'member' where user_id = test.uid('a') $$, 1, 'B 가 A 를 구성원으로 내린다');
select test.login('a');
select test.is($$ select count(*) from public.ai_insights $$, '1', '구성원이 된 A 에게는 공개된 것만 보인다');
select test.affects($$ delete from public.ai_insights where id = test.get('insight')::uuid $$, 0, '구성원이 된 A 는 자기가 만든 것도 지우지 못한다');

-- 지우기와 함께 지워지는 것.
select test.login('b');
select test.is($$ with removed as (delete from public.ai_insights where scope = 'period' and status = 'draft' returning id) select count(*) from removed $$, '1', '운영자 B 가 초안 하나를 지우고 지운 행을 돌려받는다');
select test.affects($$ delete from public.sessions where id = test.get('session')::uuid $$, 1, '운영자 B 가 Session 을 지운다');
select test.sudo_is($$ select count(*) || '|' || min(scope) from public.ai_insights $$, '1|period', 'Session 을 지우면 그 회차의 AI Insight 도 지워지고 기간을 정리한 것은 남는다');
select test.sudo_is($$ select count(*) from public.ai_logs where title = 'A 의 기록' $$, '1', '그 회차의 AI Log 는 그대로 남는다');
select test.affects($$ delete from public.clubs where id = test.get('club')::uuid $$, 1, '운영자 B 가 Club 을 지운다');
select test.sudo_is($$ select count(*) from public.ai_insights $$, '0', 'Club 을 지우면 AI Insight 도 모두 지워진다');
