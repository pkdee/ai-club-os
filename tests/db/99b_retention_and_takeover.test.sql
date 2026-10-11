-- 지운 기록과 수정 기록의 보관 기간, 운영자가 없어진 Club 의 이어받기, 역할이 바뀐 시각.
-- A 는 운영자, B 와 C 는 초대로 들어온 구성원(B 가 먼저), E 는 다른 Club 의 운영자다.

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
-- 지운 기록은 1년
-- ---------------------------------------------------------------------------

select test.login('b');
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, '오래전에 지운 기록', '시도'), (test.get('club')::uuid, '얼마 전에 지운 기록', '시도'), (test.get('club')::uuid, '방금 지운 기록', '시도'), (test.get('club')::uuid, '남겨 둔 기록', '처음 내용');
select test.affects($$ delete from public.ai_logs where title in ('오래전에 지운 기록', '얼마 전에 지운 기록') $$, 2, 'B 가 자기 기록 둘을 지운다');
select test.sudo($$ update public.deletion_logs set created_at = now() - interval '366 days' where title = '오래전에 지운 기록' $$);
select test.sudo($$ update public.deletion_logs set created_at = now() - interval '364 days' where title = '얼마 전에 지운 기록' $$);
select test.login('a');
select test.is($$ select string_agg(title, ',' order by title) from public.deletion_logs $$, '얼마 전에 지운 기록', '운영자에게 1년이 지난 지운 기록은 보이지 않고 그 안의 것은 보인다');
select test.sudo_is($$ select count(*) from public.deletion_logs $$, '2', '보이지 않을 뿐 아직 지워지지는 않았다');
select test.login('b');
select test.affects($$ delete from public.ai_logs where title = '방금 지운 기록' $$, 1, 'B 가 기록을 하나 더 지운다');
select test.sudo_is($$ select string_agg(title, ',' order by title) from public.deletion_logs $$, '방금 지운 기록,얼마 전에 지운 기록', '새로 남길 때 1년이 지난 것이 지워진다');
select test.is($$ select private.deletion_log_days() $$, '365', '지운 기록을 두는 날수는 365 다');

-- 다른 Club 의 오래된 기록은 그 Club 에서 무언가를 지울 때까지 남아 있다.
select test.sudo($$ insert into public.deletion_logs (club_id, entity, title, created_at) values (test.get('other_club')::uuid, 'ai_log', '다른 Club 의 오래된 것', now() - interval '400 days') $$);
select test.login('b');
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, '또 지울 기록', '시도');
delete from public.ai_logs where title = '또 지울 기록';
select test.sudo_is($$ select count(*) from public.deletion_logs where club_id = test.get('other_club')::uuid $$, '1', '한 Club 에서 지워도 다른 Club 의 지운 기록은 건드리지 않는다');
select test.login('e');
select test.is($$ select count(*) from public.deletion_logs $$, '0', '그 Club 의 운영자에게도 1년이 지난 것은 보이지 않는다');

-- ---------------------------------------------------------------------------
-- 수정 기록은 90일
-- ---------------------------------------------------------------------------

select test.login('b');
select test.remember('log', $$ select id from public.ai_logs where title = '남겨 둔 기록' $$);
update public.ai_logs set attempt = '둘째 내용' where id = test.get('log')::uuid;
update public.ai_logs set attempt = '셋째 내용' where id = test.get('log')::uuid;
select test.is($$ select count(*) from public.ai_log_revisions $$, '2', '두 번 고치면 수정 기록이 둘 남는다');
select test.sudo($$ update public.ai_log_revisions set replaced_at = now() - interval '91 days' where attempt = '처음 내용' $$);
select test.is($$ select string_agg(attempt, ',') from public.ai_log_revisions $$, '둘째 내용', '작성자에게 90일이 지난 수정 기록은 보이지 않는다');
select test.login('a');
select test.is($$ select string_agg(attempt, ',') from public.ai_log_revisions $$, '둘째 내용', '운영자에게도 90일이 지난 수정 기록은 보이지 않는다');
select test.sudo_is($$ select count(*) from public.ai_log_revisions $$, '2', '보이지 않을 뿐 아직 지워지지는 않았다');
select test.sudo($$ update public.ai_log_revisions set replaced_at = now() - interval '89 days' where attempt = '둘째 내용' $$);
select test.login('b');
update public.ai_logs set attempt = '넷째 내용' where id = test.get('log')::uuid;
select test.sudo_is($$ select string_agg(attempt, ',' order by replaced_at) from public.ai_log_revisions $$, '둘째 내용,셋째 내용', '다시 고칠 때 90일이 지난 것이 지워지고 그 안의 것은 남는다');
select test.is($$ select private.ai_log_revision_days() $$, '90', '수정 기록을 두는 날수는 90 이다');

-- ---------------------------------------------------------------------------
-- 역할이 바뀐 시각
-- ---------------------------------------------------------------------------

select test.sudo_is($$ select count(role_changed_at) from public.members $$, '0', 'Club 을 만들거나 참여하면서 정해진 역할에는 바뀐 시각이 없다');
select test.login('a');
select test.affects($$ update public.members set role = 'admin' where user_id = test.uid('c') and club_id = test.get('club')::uuid $$, 1, '운영자 A 가 C 를 운영자로 지정한다');
select test.is($$ select (role_changed_at is not null)::text from public.members where user_id = test.uid('c') and club_id = test.get('club')::uuid $$, 'true', '역할이 바뀌면 바뀐 시각이 적힌다');
select test.sudo($$ update public.members set role_changed_at = now() - interval '3 days' where user_id = test.uid('c') $$);
select test.remember('changed', $$ select role_changed_at::text from public.members where user_id = test.uid('c') and club_id = test.get('club')::uuid $$);
select test.affects($$ update public.members set role = 'admin' where user_id = test.uid('c') and club_id = test.get('club')::uuid $$, 1, '같은 역할로 다시 저장한다');
select test.is($$ select (role_changed_at::text = test.get('changed'))::text from public.members where user_id = test.uid('c') and club_id = test.get('club')::uuid $$, 'true', '역할이 그대로면 바뀐 시각도 그대로다');
select test.throws($$ update public.members set role_changed_at = now() where user_id = test.uid('c') $$, '42501', '운영자도 바뀐 시각을 직접 적을 수 없다');
select test.affects($$ update public.members set role = 'member' where user_id = test.uid('c') and club_id = test.get('club')::uuid $$, 1, 'A 가 C 를 다시 구성원으로 내린다');
select test.is($$ select (role_changed_at::text <> test.get('changed'))::text from public.members where user_id = test.uid('c') and club_id = test.get('club')::uuid $$, 'true', '내릴 때도 바뀐 시각이 새로 적힌다');
select test.throws($$ update public.members set role = 'member' where user_id = test.uid('a') and club_id = test.get('club')::uuid $$, 'P0001', '마지막 운영자는 여전히 구성원으로 내려갈 수 없다');

-- ---------------------------------------------------------------------------
-- 운영자가 없어진 Club
-- ---------------------------------------------------------------------------

-- 운영자가 둘이면 한 사람의 계정이 지워져도 아무도 이어받지 않는다.
select test.login('e');
insert into public.club_invites (club_id) values (test.get('other_club')::uuid);
select test.remember('other_token', $$ select token from public.club_invites where club_id = test.get('other_club')::uuid $$);
select test.login('a');
select public.join_club(test.get('other_token')) is not null;
select test.login('b');
select public.join_club(test.get('other_token')) is not null;
select test.login('e');
select test.affects($$ update public.members set role = 'admin' where user_id = test.uid('a') and club_id = test.get('other_club')::uuid $$, 1, '다른 Club 에서 E 가 A 를 운영자로 지정한다');
select test.sudo($$ delete from auth.users where id = test.uid('e') $$);
select test.sudo_is($$ select string_agg(display_name || ':' || role, ',' order by created_at) from public.members where club_id = test.get('other_club')::uuid $$, '김하늘:admin,박서연:member', '다른 운영자가 남아 있으면 구성원은 그대로 구성원이다');

-- 마지막 운영자의 계정이 지워지면 먼저 참여한 구성원이 이어받는다.
select test.sudo($$ delete from auth.users where id = test.uid('a') $$);
select test.sudo_is($$ select string_agg(display_name || ':' || role, ',' order by created_at) from public.members where club_id = test.get('club')::uuid $$, '박서연:admin,other@example.com:member', '먼저 참여한 B 가 운영자가 되고 C 는 구성원으로 남는다');
select test.sudo_is($$ select (role_changed_at is not null)::text from public.members where user_id = test.uid('b') and club_id = test.get('club')::uuid $$, 'true', '이어받은 시각이 적힌다');
select test.sudo_is($$ select string_agg(display_name || ':' || role, ',') from public.members where club_id = test.get('other_club')::uuid $$, '박서연:admin', '다른 Club 에서도 혼자 남은 B 가 이어받는다');
select test.login('b');
select test.affects($$ update public.clubs set description = '이어받은 운영자가 고침' where id = test.get('club')::uuid $$, 1, '이어받은 B 는 Club 을 고칠 수 있다');
select test.throws($$ delete from public.members where user_id = test.uid('b') and club_id = test.get('club')::uuid $$, 'P0001', '이어받은 B 도 마지막 운영자라 나갈 수 없다');

-- 운영자와 그다음 사람의 계정이 한꺼번에 지워지면 남은 사람이 이어받는다.
select test.login('d');
select public.join_club(test.get('token')) is not null;
select test.sudo($$ delete from auth.users where id in (test.uid('b'), test.uid('c')) $$);
select test.sudo_is($$ select string_agg(display_name || ':' || role, ',') from public.members where club_id = test.get('club')::uuid $$, '최도현:admin', '계정이 함께 지워지는 사람을 건너 남은 D 가 운영자가 된다');

-- 아무도 남지 않으면 Club 만 남는다.
select test.sudo($$ delete from auth.users where id = test.uid('d') $$);
select test.sudo_is($$ select count(*) from public.members $$, '0', '마지막 사람의 계정까지 지워지면 Member 가 없다');
select test.sudo_is($$ select count(*) from public.clubs $$, '2', '그때도 Club 은 남는다');
select test.sudo($$ delete from public.clubs $$);
select test.sudo_is($$ select count(*) from public.clubs $$, '0', '운영자가 없는 Club 도 지울 수 있다');
