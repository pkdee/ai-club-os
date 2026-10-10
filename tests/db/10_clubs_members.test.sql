-- Club 과 Member 의 기본 접근 규칙.

select test.anon();
select test.throws($$ select count(*) from public.clubs $$, '42501', '로그인하지 않으면 Club 을 읽지 못한다');
select test.throws($$ select count(*) from public.members $$, '42501', '로그인하지 않으면 Member 를 읽지 못한다');
select test.throws($$ insert into public.clubs (name) values ('몰래 만든 Club') $$, '42501', '로그인하지 않으면 Club 을 만들지 못한다');

select test.login_without_claims();
select test.throws($$ insert into public.clubs (name) values ('주인 없는 Club') $$, '42501', '로그인 정보가 비어 있으면 Club 을 만들지 못한다');

select test.login('a');
select test.affects($$ insert into public.clubs (name, description) values ('AI 모각코', '매주 목요일') $$, 1, 'A 가 Club 을 만든다');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
select test.is($$ select name from public.clubs $$, 'AI 모각코', 'A 는 자기 Club 을 본다');
select test.is($$ select role || '|' || display_name || '|' || email from public.members $$, 'admin|김하늘|haneul@example.com', '만든 사람은 운영자가 되고 이름과 이메일이 들어간다');
select test.throws($$ insert into public.clubs (name) values ('돌려받기') returning id $$, '42501', 'Club 을 만들면서 만든 행을 바로 돌려받을 수는 없다');
select test.throws($$ insert into public.clubs (name, created_by) values ('남의 이름으로', test.uid('b')) $$, '42501', '만든 사람을 직접 적어 넣을 수 없다');
select test.throws($$ insert into public.clubs (name) values ('   ') $$, '23514', '빈 이름은 넣을 수 없다');
select test.throws($$ insert into public.clubs (name) values (repeat('가', 51)) $$, '23514', '51자 이름은 넣을 수 없다');
select test.throws($$ insert into public.clubs (name, description) values ('소개가 긴 Club', repeat('가', 201)) $$, '23514', '201자 소개는 넣을 수 없다');
select test.throws($$ insert into public.members (club_id, user_id, role) values (test.get('club')::uuid, test.uid('b'), 'member') $$, '42501', '운영자도 Member 를 직접 넣을 수 없다');
select test.throws($$ delete from public.clubs $$, '42501', 'Club 은 지울 수 없다');

select test.login('b');
select test.is($$ select count(*) from public.clubs $$, '0', '다른 사용자 B 에게는 A 의 Club 이 보이지 않는다');
select test.is($$ select count(*) from public.members $$, '0', 'B 에게는 A 의 Club 의 Member 가 보이지 않는다');
select test.throws($$ insert into public.members (club_id, user_id, role) values (test.get('club')::uuid, test.uid('b'), 'admin') $$, '42501', 'B 가 A 의 Club 에 자신을 운영자로 넣을 수 없다');
select test.affects($$ update public.clubs set name = '빼앗음' $$, 0, 'Member 가 아니면 Club 을 고치지 못한다');
select test.affects($$ insert into public.clubs (name) values ('논문 읽기 모임') $$, 1, 'B 가 자기 Club 을 만든다');
select test.is($$ select name from public.clubs $$, '논문 읽기 모임', 'B 에게는 자기 Club 만 보인다');
select test.is($$ select display_name from public.members $$, '박서연', '이름이 full_name 에 없으면 name 을 쓴다');

select test.login('c');
select test.affects($$ insert into public.clubs (name) values ('이름 없는 사람의 Club') $$, 1, 'C 가 자기 Club 을 만든다');
select test.is($$ select display_name from public.members $$, 'other@example.com', '이름이 없으면 이메일을 이름으로 쓴다');

select test.login('a');
select test.is($$ select name from public.clubs $$, 'AI 모각코', 'A 에게는 여전히 자기 Club 만 보인다');
select test.affects($$ update public.clubs set name = 'AI 모각코 2기', description = '새 소개' where id = test.get('club')::uuid $$, 1, '운영자 A 가 Club 의 이름과 소개를 고친다');
select test.throws($$ update public.clubs set name = '   ' where id = test.get('club')::uuid $$, '23514', '고칠 때도 빈 이름은 넣을 수 없다');
select test.throws($$ update public.clubs set created_by = null where id = test.get('club')::uuid $$, '42501', '만든 사람은 고칠 수 없다');

-- 사용자 계정이 삭제되면 그 사람의 소속은 사라지고 Club 은 남는다.
select test.sudo($$ delete from auth.users where id = test.uid('b') $$);
select test.sudo_is($$ select count(*) from public.members where user_id = test.uid('b') $$, '0', '계정이 삭제되면 그 사람의 소속도 삭제된다');
select test.sudo_is($$ select count(*) from public.clubs where name = '논문 읽기 모임' and created_by is null $$, '1', '계정이 삭제돼도 Club 은 만든 사람 없이 남는다');
