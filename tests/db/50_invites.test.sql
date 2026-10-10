-- 초대 링크의 접근 규칙과 참여 함수. A 는 운영자, B 는 구성원, C 와 D 는 아직 Member 가 아니다.

select test.login('a');
insert into public.clubs (name, description) values ('AI 모각코', '매주 목요일');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
select test.sudo($$ insert into public.members (club_id, user_id, role, display_name) values (test.get('club')::uuid, test.uid('b'), 'member', '박서연') $$);

select test.is($$ insert into public.club_invites (club_id) values (test.get('club')::uuid)
  returning (token ~ '^[0-9a-f]{32}$')::text || '|' || (expires_at between now() + interval '6 days 23 hours' and now() + interval '7 days 1 hour')::text $$,
  'true|true', '운영자 A 가 초대를 만들면 32자 링크 값과 7일 뒤 만료 시각이 정해진다');
select test.remember('token', $$ select token from public.club_invites $$);
select test.throws($$ insert into public.club_invites (club_id) values (test.get('club')::uuid) $$, '23505', 'Club 마다 초대는 하나뿐이다');
select test.throws($$ insert into public.club_invites (club_id, token) values (test.get('club')::uuid, 'aaaa') $$, '42501', '링크 값을 직접 정할 수 없다');
select test.throws($$ update public.club_invites set expires_at = now() + interval '10 years' $$, '42501', '만료 시각을 고칠 수 없다');

select test.login('b');
select test.is($$ select count(*) from public.club_invites $$, '0', '구성원 B 에게는 초대가 보이지 않는다');
select test.throws($$ insert into public.club_invites (club_id) values (test.get('club')::uuid) $$, '42501', '구성원 B 는 초대를 만들지 못한다');
select test.affects($$ delete from public.club_invites $$, 0, '구성원 B 는 초대를 지우지 못한다');

select test.login('c');
select test.is($$ select count(*) from public.clubs $$, '0', '아직 Member 가 아닌 C 는 Club 을 직접 읽지 못한다');
select test.is($$ select club_name || '|' || club_description || '|' || member_count || '|' || already_member from public.preview_club_invite(test.get('token')) $$, 'AI 모각코|매주 목요일|2|false', 'C 는 링크로 Club 을 미리 본다');
select test.is($$ select count(*) from public.preview_club_invite(repeat('0', 32)) $$, '0', '틀린 링크 값으로는 아무것도 보이지 않는다');
select test.is($$ select (public.join_club(repeat('0', 32)) is null)::text $$, 'true', '틀린 링크 값으로는 참여되지 않는다');
select test.is($$ select (public.join_club(test.get('token')) = test.get('club')::uuid)::text $$, 'true', 'C 가 링크로 참여하면 그 Club 의 식별자를 돌려받는다');
select test.is($$ select role || '|' || display_name from public.members where user_id = test.uid('c') $$, 'member|other@example.com', '참여하면 구성원이 되고 이름이 없으면 이메일이 이름이 된다');
select test.is($$ select count(*) from public.members $$, '3', '참여한 뒤에는 같은 Club 의 Member 를 본다');
select test.is($$ select (public.join_club(test.get('token')) = test.get('club')::uuid)::text $$, 'true', '이미 Member 인 사람이 다시 눌러도 오류가 나지 않는다');
select test.is($$ select count(*) from public.members $$, '3', '다시 눌러도 한 번만 들어간다');
select test.is($$ select already_member::text from public.preview_club_invite(test.get('token')) $$, 'true', '참여한 뒤 미리 보면 이미 Member 라고 알려 준다');
select test.is($$ select count(*) from public.club_invites $$, '0', '참여해도 구성원이므로 초대는 보이지 않는다');

-- 만료된 링크.
select test.sudo($$ update public.club_invites set expires_at = now() - interval '1 second' $$);
select test.login('d');
select test.is($$ select count(*) from public.preview_club_invite(test.get('token')) $$, '0', '만료된 링크로는 미리 볼 수 없다');
select test.is($$ select (public.join_club(test.get('token')) is null)::text $$, 'true', '만료된 링크로는 참여되지 않는다');

-- 새로 만든 링크.
select test.login('a');
select test.affects($$ delete from public.club_invites where club_id = test.get('club')::uuid $$, 1, '운영자 A 가 이전 초대를 지운다');
select test.affects($$ insert into public.club_invites (club_id) values (test.get('club')::uuid) $$, 1, '운영자 A 가 초대를 새로 만든다');
select test.remember('new_token', $$ select token from public.club_invites $$);
select test.login('d');
select test.is($$ select (public.join_club(test.get('token')) is null)::text $$, 'true', '새로 만든 뒤에는 이전 링크로 참여되지 않는다');
select test.is($$ select (public.join_club(test.get('new_token')) = test.get('club')::uuid)::text $$, 'true', 'D 가 새 링크로 참여한다');
select test.is($$ select display_name from public.members where user_id = test.uid('d') $$, '최도현', '비어 있는 full_name 은 건너뛰고 name 을 쓴다');

select test.anon();
select test.throws($$ select public.join_club(test.get('new_token')) $$, '42501', '로그인하지 않으면 참여 함수를 부르지 못한다');
select test.throws($$ select count(*) from public.preview_club_invite(test.get('new_token')) $$, '42501', '로그인하지 않으면 미리 보기 함수를 부르지 못한다');
select test.throws($$ select count(*) from public.club_invites $$, '42501', '로그인하지 않으면 초대를 읽지 못한다');

select test.login_without_claims();
select test.is($$ select (public.join_club(test.get('new_token')) is null)::text $$, 'true', '로그인 정보가 비어 있으면 참여되지 않는다');
select test.is($$ select count(*) from public.preview_club_invite(test.get('new_token')) $$, '0', '로그인 정보가 비어 있으면 미리 볼 수 없다');

select test.sudo($$ delete from public.clubs where id = test.get('club')::uuid $$);
select test.sudo_is($$ select count(*) from public.club_invites $$, '0', 'Club 이 삭제되면 초대도 삭제된다');
