-- AI Log 에 붙이는 이미지와 Storage 의 접근 규칙, 자기 계정 지우기.
-- A 는 운영자, B 와 C 는 초대로 들어온 구성원(B 가 먼저), D 는 Member 가 아니고, E 는 혼자 있는 다른 Club 의 운영자다.

select test.login('a');
insert into public.clubs (name) values ('AI 모각코');
select test.remember('club', $$ select id from public.clubs where name = 'AI 모각코' $$);
insert into public.club_invites (club_id) values (test.get('club')::uuid);
select test.remember('token', $$ select token from public.club_invites $$);
insert into public.sessions (club_id, title, starts_at, ends_at) values (test.get('club')::uuid, '1회차', now() - interval '7 days', now() - interval '7 days' + interval '2 hours');
select test.remember('session', $$ select id from public.sessions where title = '1회차' $$);
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'A 의 기록', '시도');
select test.remember('log_a', $$ select id from public.ai_logs where title = 'A 의 기록' $$);
select test.login('b');
select public.join_club(test.get('token')) is not null;
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'B 의 기록', '시도');
select test.remember('log_b', $$ select id from public.ai_logs where title = 'B 의 기록' $$);
select test.login('c');
select public.join_club(test.get('token')) is not null;
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'C 의 기록', '시도');
select test.remember('log_c', $$ select id from public.ai_logs where title = 'C 의 기록' $$);
select test.login('e');
insert into public.clubs (name) values ('혼자 있는 Club');
select test.remember('other_club', $$ select id from public.clubs where name = '혼자 있는 Club' $$);
insert into public.ai_logs (club_id, title, attempt) values (test.get('other_club')::uuid, 'E 의 기록', '시도');
select test.remember('log_e', $$ select id from public.ai_logs where title = 'E 의 기록' $$);
select test.sudo($$ insert into storage.buckets (id, name) values ('other-bucket', 'other-bucket') $$);

-- 경로를 만드는 도우미. Club, 기록, 파일 이름의 세 마디다.
select test.sudo($sudo$
  create function test.image_path(log_key text, club_key text, file text)
  returns text
  language sql
  as $fn$
    select test.get(club_key) || '/' || test.get(log_key) || '/' || file
  $fn$
$sudo$);

-- ---------------------------------------------------------------------------
-- 붙인 이미지의 목록
-- ---------------------------------------------------------------------------

select test.login('b');
select test.affects($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '11111111-1111-4111-8111-111111111111.png'), 'image/png', 204800) $$, 1, '작성자 B 가 자기 기록에 이미지를 붙인다');
select test.throws($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '11111111-1111-4111-8111-111111111111.png'), 'image/png', 1000) $$, '23505', '같은 경로를 두 번 넣을 수 없다');
select test.throws($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_a', 'club', '22222222-2222-4222-8222-222222222222.png'), 'image/png', 1000) $$, '23514', '경로의 기록이 이 줄의 기록과 다르면 받지 않는다');
select test.throws($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '../../secret.png'), 'image/png', 1000) $$, '23514', '앱이 만든 이름이 아닌 파일 이름은 받지 않는다');
select test.throws($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '22222222-2222-4222-8222-222222222222.svg'), 'image/svg+xml', 1000) $$, '23514', '정해진 네 가지 형식이 아니면 받지 않는다');
select test.throws($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '22222222-2222-4222-8222-222222222222.png'), 'image/png', 5242881) $$, '23514', '5MB 를 넘는 크기는 받지 않는다');
select test.throws($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes, created_by) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '22222222-2222-4222-8222-222222222222.png'), 'image/png', 1000, test.uid('c')) $$, '42501', '붙인 사람을 정해서 넣을 수 없다');
select test.login('c');
select test.throws($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '33333333-3333-4333-8333-333333333333.png'), 'image/png', 1000) $$, '42501', '작성자가 아닌 C 는 B 의 기록에 붙일 수 없다');
select test.login('a');
select test.throws($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '33333333-3333-4333-8333-333333333333.png'), 'image/png', 1000) $$, '42501', '운영자도 남의 기록에는 붙일 수 없다');
select test.login('b');
insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values
  (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '22222222-2222-4222-8222-222222222222.jpg'), 'image/jpeg', 1000),
  (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '33333333-3333-4333-8333-333333333333.webp'), 'image/webp', 1000),
  (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '44444444-4444-4444-8444-444444444444.gif'), 'image/gif', 1000);
select test.throws($$ insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_b')::uuid, test.image_path('log_b', 'club', '55555555-5555-4555-8555-555555555555.png'), 'image/png', 1000) $$, '23514', '한 기록에 다섯째 이미지는 붙일 수 없다');
select test.throws($$ update public.ai_log_attachments set size_bytes = 1 $$, '42501', '붙인 이미지의 줄은 고칠 수 없다');
select test.login('c');
select test.is($$ select count(*) from public.ai_log_attachments $$, '4', '구성원 C 는 붙은 이미지를 모두 본다');
select test.affects($$ delete from public.ai_log_attachments $$, 0, 'C 는 B 의 이미지를 뗄 수 없다');
select test.login('d');
select test.is($$ select count(*) from public.ai_log_attachments $$, '0', 'Member 가 아닌 D 에게는 보이지 않는다');
select test.anon();
select test.throws($$ select count(*) from public.ai_log_attachments $$, '42501', '로그인하지 않으면 읽을 수 없다');
select test.login('a');
select test.affects($$ delete from public.ai_log_attachments where mime_type = 'image/gif' $$, 1, '운영자 A 는 뗄 수 있다');
select test.login('b');
select test.affects($$ delete from public.ai_log_attachments where mime_type in ('image/jpeg', 'image/webp') $$, 2, '작성자 B 가 자기 이미지를 뗀다');

-- ---------------------------------------------------------------------------
-- Storage 의 접근 규칙
-- ---------------------------------------------------------------------------

select test.sudo_is($$ select public::text || '|' || file_size_limit || '|' || array_length(allowed_mime_types, 1) from storage.buckets where id = 'ai-log-images' $$, 'false|5242880|4', '저장 공간은 공개하지 않고 5MB 까지 네 가지 형식만 받는다');
select test.login('b');
select test.affects($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_b', 'club', '11111111-1111-4111-8111-111111111111.png')) $$, 1, '작성자 B 가 목록에 적어 둔 자리에 파일을 올린다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_b', 'club', '99999999-9999-4999-8999-999999999999.png')) $$, '42501', '자기 기록이어도 목록에 적지 않은 자리에는 올릴 수 없다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_a', 'club', '11111111-1111-4111-8111-111111111111.png')) $$, '42501', 'B 는 A 의 기록의 자리에 올릴 수 없다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', 'loose.png') $$, '42501', '마디가 없는 경로에는 올릴 수 없다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', 'not-a-club/not-a-log/x.png') $$, '42501', '식별자가 아닌 마디는 오류 없이 거절된다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_e', 'other_club', 'x.png')) $$, '42501', '다른 Club 의 자리에는 올릴 수 없다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('other-bucket', test.image_path('log_b', 'club', 'x.png')) $$, '42501', '다른 저장 공간에는 이 규칙이 닿지 않는다');
select test.login('c');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_b', 'club', '22222222-2222-4222-8222-222222222222.png')) $$, '42501', '작성자가 아닌 C 는 B 의 기록의 자리에 올릴 수 없다');
select test.is($$ select count(*) from storage.objects $$, '1', '구성원 C 는 Club 의 파일을 읽는다');
select test.affects($$ delete from storage.objects $$, 0, 'C 는 B 의 파일을 지울 수 없다');
select test.affects($$ update storage.objects set name = name || 'x' $$, 0, '파일은 고칠 수 없다');
select test.login('d');
select test.is($$ select count(*) from storage.objects $$, '0', 'Member 가 아닌 D 는 파일을 읽을 수 없다');
select test.login('e');
select test.is($$ select count(*) from storage.objects $$, '0', '다른 Club 의 운영자 E 도 읽을 수 없다');
select test.anon();
select test.is($$ select count(*) from storage.objects $$, '0', '로그인하지 않으면 파일을 읽을 수 없다');
select test.login('a');
select test.affects($$ delete from storage.objects $$, 1, '운영자 A 는 Club 의 파일을 지울 수 있다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_b', 'club', '11111111-1111-4111-8111-111111111111.png')) $$, '42501', '운영자도 남이 적어 둔 자리에는 올릴 수 없다');
select test.login('c');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_b', 'club', '11111111-1111-4111-8111-111111111111.png')) $$, '42501', '구성원 C 도 남이 적어 둔 자리에는 올릴 수 없다');
select test.login('b');
select test.affects($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_b', 'club', '11111111-1111-4111-8111-111111111111.png')) $$, 1, 'B 가 다시 올린다');

-- 파일이 남아 있는 동안에는 줄도, 기록도, Club 도 지울 수 없다.
select test.throws($$ delete from public.ai_log_attachments $$, '23503', '파일이 남아 있는 줄은 작성자 B 도 뗄 수 없다');
select test.throws($$ delete from public.ai_logs where id = test.get('log_b')::uuid $$, '23503', '파일이 남아 있는 기록은 지울 수 없다');
select test.login('a');
select test.throws($$ delete from public.ai_log_attachments $$, '23503', '운영자 A 도 파일이 남아 있는 줄은 뗄 수 없다');
select test.throws($$ delete from public.clubs where id = test.get('club')::uuid $$, '23503', '파일이 남아 있는 Club 은 지울 수 없다');
select test.sudo_is($$ select count(*) from public.ai_logs where id = test.get('log_b')::uuid $$, '1', '막힌 뒤에도 기록은 그대로다');

-- Club 에서 나간 사람은 자기가 올린 것만 보고 지울 수 있다.
select test.login('d');
select public.join_club(test.get('token')) is not null;
insert into public.ai_logs (club_id, title, attempt) values (test.get('club')::uuid, 'D 의 기록', '시도');
select test.remember('log_d', $$ select id from public.ai_logs where title = 'D 의 기록' $$);
insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('club')::uuid, test.get('log_d')::uuid, test.image_path('log_d', 'club', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd.png'), 'image/png', 1000);
insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_d', 'club', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd.png'));
select test.affects($$ delete from public.members where user_id = test.uid('d') $$, 1, 'D 가 Club 에서 나간다');
select test.is($$ select count(*) from public.ai_log_attachments $$, '1', '나간 D 에게는 자기가 붙인 줄만 보인다');
select test.is($$ select count(*) from storage.objects $$, '1', '나간 D 는 자기가 올린 파일만 읽는다');
select test.affects($$ delete from public.ai_log_attachments $$, 0, '나간 D 는 줄을 뗄 수 없다');
select test.affects($$ delete from storage.objects $$, 1, '나간 D 는 자기가 올린 파일을 지울 수 있다');
select test.throws($$ insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_d', 'club', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd.png')) $$, '42501', '나간 D 는 줄이 남아 있어도 다시 올릴 수 없다');
select test.sudo_is($$ select count(*) from storage.objects $$, '1', 'B 의 파일은 그대로다');
select test.login('a');
select test.affects($$ delete from public.ai_log_attachments where log_id = test.get('log_d')::uuid $$, 1, '운영자 A 가 나간 사람이 붙인 줄을 뗀다');
select test.affects($$ delete from public.ai_logs where id = test.get('log_d')::uuid $$, 1, '운영자 A 가 나간 사람의 기록을 지운다');

-- ---------------------------------------------------------------------------
-- 자기 계정 지우기
-- ---------------------------------------------------------------------------

-- B 는 기록, 댓글, 회고, 표시를 남겼다.
select test.login('b');
insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('log_a')::uuid, 'B 의 댓글');
insert into public.retrospectives (club_id, scope, session_id, went_well) values (test.get('club')::uuid, 'session', test.get('session')::uuid, 'B 의 회고');
insert into public.ai_log_reactions (log_id, club_id) values (test.get('log_a')::uuid, test.get('club')::uuid);
select test.login('c');
insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('log_a')::uuid, 'C 의 댓글');
insert into public.retrospectives (club_id, scope, session_id, went_well) values (test.get('club')::uuid, 'session', test.get('session')::uuid, 'C 의 회고');
select test.login('a');
insert into public.ai_log_comments (club_id, log_id, body) values (test.get('club')::uuid, test.get('log_c')::uuid, 'C 의 기록에 A 가 단 댓글');
select test.remember('logged', $$ select count(*) from public.deletion_logs $$);

select test.anon();
select test.throws($$ select public.delete_my_account(false) $$, '42501', '로그인하지 않으면 계정을 지우는 함수를 부를 수 없다');

-- 내가 올린 파일이 남아 있으면 계정을 지울 수 없고 아무것도 바뀌지 않는다.
select test.login('b');
select test.throws($$ select public.delete_my_account(false) $$, '23503', '올린 파일이 남아 있으면 계정을 지우지 못한다');
select test.throws($$ select public.delete_my_account(true) $$, '23503', '쓴 것을 함께 지우려 해도 파일이 남아 있으면 지우지 못한다');
select test.sudo_is($$ select count(*) from auth.users where id = test.uid('b') $$, '1', '실패하면 계정은 그대로다');
select test.sudo_is($$ select count(*) from public.ai_log_attachments where created_by = test.uid('b') $$, '1', '실패하면 붙인 이미지의 줄도 그대로다');

-- 파일을 지운 뒤, 쓴 것은 남기고 계정을 지운다.
select test.affects($$ delete from storage.objects $$, 1, 'B 가 자기 파일을 지운다');
select test.affects($$ select public.delete_my_account(false) $$, 1, 'B 가 쓴 것은 남기고 계정을 지운다');
select test.sudo_is($$ select count(*) from auth.users where id = test.uid('b') $$, '0', '계정이 지워진다');
select test.sudo_is($$ select count(*) from public.members where user_id = test.uid('b') $$, '0', '소속도 함께 지워진다');
select test.sudo_is($$ select count(*) || '|' || count(author_id) from public.ai_logs where title = 'B 의 기록' $$, '1|0', 'AI Log 는 작성자 없이 남는다');
select test.sudo_is($$ select count(*) || '|' || count(author_id) from public.ai_log_comments where body = 'B 의 댓글' $$, '1|0', '댓글도 작성자 없이 남는다');
select test.sudo_is($$ select count(*) || '|' || count(author_id) from public.retrospectives where went_well = 'B 의 회고' $$, '1|0', '회고도 작성자 없이 남는다');
select test.sudo_is($$ select count(*) from public.ai_log_reactions where user_id = test.uid('b') $$, '0', '도움이 됐어요 표시는 지워진다');
select test.sudo_is($$ select count(*) from public.ai_log_attachments $$, '0', '붙인 이미지의 줄은 쓴 것을 남겨도 지워진다');

-- 쓴 것도 함께 지운다.
select test.login('c');
select test.affects($$ select public.delete_my_account(true) $$, 1, 'C 가 쓴 것도 함께 지우고 계정을 지운다');
select test.sudo_is($$ select count(*) from auth.users where id = test.uid('c') $$, '0', '계정이 지워진다');
select test.sudo_is($$ select count(*) from public.ai_logs where title = 'C 의 기록' $$, '0', 'C 의 AI Log 가 지워진다');
select test.sudo_is($$ select count(*) from public.ai_log_comments where body in ('C 의 댓글', 'C 의 기록에 A 가 단 댓글') $$, '0', 'C 의 댓글과, C 의 기록에 달린 댓글이 지워진다');
select test.sudo_is($$ select count(*) from public.retrospectives where went_well = 'C 의 회고' $$, '0', 'C 의 회고가 지워진다');
select test.sudo_is($$ select string_agg(title, ',' order by title) from public.ai_logs where club_id = test.get('club')::uuid $$, 'A 의 기록,B 의 기록', '다른 사람의 기록은 그대로다');
select test.sudo_is($$ select (count(*)::text = test.get('logged'))::text from public.deletion_logs $$, 'true', '떠나면서 지운 것은 지운 기록에 남지 않는다');

-- 떠난 뒤에도 지운 기록은 평소대로 남는다.
select test.login('a');
select test.affects($$ delete from public.ai_log_comments where body = 'B 의 댓글' $$, 1, '운영자 A 가 남은 댓글을 지운다');
select test.is($$ select count(*) from public.deletion_logs where entity = 'comment' $$, '1', '평소의 삭제는 지운 기록에 남는다');

-- 혼자 있던 Club 은 계정과 함께 지워진다. 그 Club 에 파일이 남아 있으면 먼저 지워야 한다.
select test.login('e');
insert into public.ai_log_attachments (club_id, log_id, path, mime_type, size_bytes) values (test.get('other_club')::uuid, test.get('log_e')::uuid, test.image_path('log_e', 'other_club', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.png'), 'image/png', 1000);
insert into storage.objects (bucket_id, name) values ('ai-log-images', test.image_path('log_e', 'other_club', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.png'));
-- 나간 사람이 올려 둔 파일처럼, 붙인 사람이 내가 아닌 줄로 바꿔 둔다.
select test.sudo($$ update public.ai_log_attachments set created_by = null where club_id = test.get('other_club')::uuid $$);
select test.throws($$ select public.delete_my_account(false) $$, '23503', '함께 지워질 Club 에 남이 올린 파일이 남아 있어도 계정을 지우지 못한다');
select test.sudo_is($$ select count(*) from auth.users where id = test.uid('e') $$, '1', '막히면 계정도 그대로다');
select test.sudo_is($$ select count(*) from public.clubs where id = test.get('other_club')::uuid $$, '1', '막히면 Club 도 그대로다');
select test.affects($$ delete from storage.objects $$, 1, 'E 가 파일을 지운다');
select test.affects($$ select public.delete_my_account(false) $$, 1, '혼자 있는 Club 의 E 가 계정을 지운다');
select test.sudo_is($$ select count(*) from public.clubs where id = test.get('other_club')::uuid $$, '0', '아무도 남지 않은 Club 은 함께 지워진다');
select test.sudo_is($$ select count(*) from public.ai_logs where title = 'E 의 기록' $$, '0', '그 Club 의 기록도 함께 지워진다');

-- 마지막 운영자가 계정을 지우면 남은 사람이 이어받는다.
select test.login('d');
select public.join_club(test.get('token')) is not null;
select test.login('a');
select test.affects($$ select public.delete_my_account(false) $$, 1, '마지막 운영자 A 가 계정을 지운다');
select test.sudo_is($$ select string_agg(display_name || ':' || role, ',') from public.members where club_id = test.get('club')::uuid $$, '최도현:admin', '남아 있던 D 가 운영자를 이어받는다');
select test.sudo_is($$ select count(*) from public.clubs where id = test.get('club')::uuid $$, '1', 'Member 가 남은 Club 은 그대로다');

-- 이미 지워진 계정으로 다시 부르면 아무 일도 일어나지 않는다.
select test.affects($$ select public.delete_my_account(true) $$, 1, '지워진 계정으로 다시 불러도 오류가 나지 않는다');
select test.sudo_is($$ select count(*) from auth.users $$, '1', '다른 사람의 계정은 그대로다');
