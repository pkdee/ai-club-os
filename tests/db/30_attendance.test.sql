-- Attendance 의 접근 규칙. A 는 운영자, B 는 같은 Club 의 구성원, C 는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '3회차', now(), now() + interval '2 hours');
select test.remember('session', $$ select id from public.sessions where title = '3회차' $$);
select test.sudo($$ insert into public.members (club_id, user_id, role, display_name) values (test.get('club')::uuid, test.uid('b'), 'member', '박서연') $$);
select test.remember('member_a', $$ select id from public.members where user_id = test.uid('a') $$);
select test.remember('member_b', $$ select id from public.members where user_id = test.uid('b') $$);
select test.login('c');
insert into public.clubs (name) values ('다른 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '다른 Club' $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('other_club')::uuid, '다른 회차', now(), now() + interval '1 hour');
select test.remember('other_session', $$ select id from public.sessions where title = '다른 회차' $$);
select test.remember('member_c', $$ select id from public.members where user_id = test.uid('c') $$);

select test.login('a');
select test.affects($$ insert into public.attendance (club_id, session_id, member_id, status) values
  (test.get('club')::uuid, test.get('session')::uuid, test.get('member_a')::uuid, 'present'),
  (test.get('club')::uuid, test.get('session')::uuid, test.get('member_b')::uuid, 'late') $$, 2, '운영자 A 가 두 Member 의 출석을 기록한다');
select test.affects($$ insert into public.attendance (club_id, session_id, member_id, status) values
  (test.get('club')::uuid, test.get('session')::uuid, test.get('member_a')::uuid, 'absent')
  on conflict (session_id, member_id) do nothing $$, 0, '이미 기록된 Member 는 건너뛰기로 넣으면 그대로 둔다');
select test.throws($$ insert into public.attendance (club_id, session_id, member_id, status) values
  (test.get('club')::uuid, test.get('session')::uuid, test.get('member_a')::uuid, 'absent') $$, '23505', '한 Session 의 한 Member 에게 기록은 하나뿐이다');
select test.affects($$ update public.attendance set status = 'absent' where member_id = test.get('member_b')::uuid $$, 1, '운영자 A 가 상태를 바꾼다');
select test.is($$ select status || '|' || (recorded_by = test.uid('a'))::text || '|' || (updated_at > created_at)::text from public.attendance where member_id = test.get('member_b')::uuid $$, 'absent|true|true', '바꾸면 고친 사람과 시각이 남는다');
select test.throws($$ update public.attendance set member_id = test.get('member_a')::uuid where member_id = test.get('member_b')::uuid $$, '42501', '누구의 기록인지는 바꿀 수 없다');
select test.throws($$ update public.attendance set status = 'sleeping' $$, '23514', '정해진 상태 값만 넣을 수 있다');
select test.throws($$ insert into public.attendance (club_id, session_id, member_id, status) values
  (test.get('club')::uuid, test.get('session')::uuid, test.get('member_c')::uuid, 'present') $$, '23503', '다른 Club 의 Member 를 기록할 수 없다');

select test.login('b');
select test.is($$ select count(*) from public.attendance $$, '2', '구성원 B 는 출석을 본다');
select test.throws($$ insert into public.attendance (club_id, session_id, member_id, status) values
  (test.get('club')::uuid, test.get('session')::uuid, test.get('member_b')::uuid, 'present') $$, '42501', '구성원 B 는 출석을 기록하지 못한다');
select test.affects($$ update public.attendance set status = 'present' $$, 0, '구성원 B 는 출석을 고치지 못한다');
select test.affects($$ delete from public.attendance $$, 0, '구성원 B 는 출석을 지우지 못한다');

select test.login('c');
select test.is($$ select count(*) from public.attendance $$, '0', '다른 Club 의 C 에게는 출석이 보이지 않는다');
select test.throws($$ insert into public.attendance (club_id, session_id, member_id, status) values
  (test.get('club')::uuid, test.get('session')::uuid, test.get('member_a')::uuid, 'present') $$, '42501', '다른 Club 의 운영자 C 는 이 Club 의 출석을 기록하지 못한다');
select test.throws($$ insert into public.attendance (club_id, session_id, member_id, status) values
  (test.get('other_club')::uuid, test.get('session')::uuid, test.get('member_c')::uuid, 'present') $$, '23503', '자기 Club 번호를 적고 남의 Session 을 기록할 수 없다');

select test.login('a');
select test.affects($$ delete from public.attendance where member_id = test.get('member_b')::uuid $$, 1, '운영자 A 가 기록을 지워 미기록으로 되돌린다');

select test.anon();
select test.throws($$ select count(*) from public.attendance $$, '42501', '로그인하지 않으면 출석을 읽지 못한다');

select test.sudo($$ delete from public.sessions where id = test.get('session')::uuid $$);
select test.sudo_is($$ select count(*) from public.attendance $$, '0', 'Session 이 삭제되면 출석도 삭제된다');
