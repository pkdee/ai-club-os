-- 접근 규칙 시험용 데이터베이스에만 쓰는 파일이다. 실제 프로젝트에는 적용하지 않는다.
-- 시험 파일이 쓰는 도우미. 사용자를 바꿔 가며 요청을 보내고, 결과를 ok 또는 not ok 한 줄로 남긴다.

create schema test;
grant usage on schema test to anon, authenticated;

create sequence test.counter;
grant usage on sequence test.counter to anon, authenticated;

-- 시험에 나오는 사용자. a 부터 e 까지 한 글자로 부른다.
create function test.uid(who text)
returns uuid
language sql
immutable
as $$
  select ('00000000-0000-0000-0000-00000000000' || who)::uuid
$$;

insert into auth.users (id, email, raw_user_meta_data) values
  (test.uid('a'), 'haneul@example.com', '{"full_name":"김하늘","name":"haneul","avatar_url":"https://lh3.googleusercontent.com/a/AAA=s96-c"}'),
  (test.uid('b'), 'seoyeon@example.com', '{"name":"박서연","picture":"https://lh5.googleusercontent.com/a-/BBB"}'),
  (test.uid('c'), 'other@example.com', '{}'),
  (test.uid('d'), 'dohyun@example.com', '{"full_name":"  ","name":"최도현"}'),
  (test.uid('e'), 'eve@example.com', '{"name":"이브","avatar_url":"https://evil.example/pixel.png"}');

-- 로그인한 사용자로 바꾼다.
create function test.login(who text)
returns void
language plpgsql
as $$
begin
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', test.uid(who), 'role', 'authenticated')::text,
    false
  );
  perform set_config('role', 'authenticated', false);
end;
$$;

-- 역할은 로그인한 사용자인데 로그인 정보가 비어 있는 경우.
create function test.login_without_claims()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', false);
  perform set_config('role', 'authenticated', false);
end;
$$;

-- 로그인하지 않은 요청으로 바꾼다.
create function test.anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', false);
  perform set_config('role', 'anon', false);
end;
$$;

create function test.report(passed boolean, label text, detail text default null)
returns text
language sql
as $$
  select format(
    '%s %s - %s%s',
    case when passed then 'ok' else 'not ok' end,
    nextval('test.counter'),
    label,
    case when passed or detail is null then '' else ' # ' || detail end
  )
$$;

-- 조회 결과의 첫 값을 글자로 바꿔 기대값과 비교한다.
create function test.is(query text, expected text, label text)
returns text
language plpgsql
as $$
declare
  actual text;
begin
  execute query into actual;
  return test.report(
    actual is not distinct from expected,
    label,
    format('결과 %L, 기대 %L', actual, expected)
  );
exception when others then
  return test.report(false, label, format('오류 %s: %s', sqlstate, sqlerrm));
end;
$$;

-- 요청이 기대한 오류 번호로 거부되는지 본다. 거부된 요청이 남긴 변경은 되돌려진다.
create function test.throws(query text, expected_state text, label text)
returns text
language plpgsql
as $$
begin
  execute query;
  return test.report(false, label, '오류 없이 통과했다');
exception when others then
  return test.report(
    sqlstate = expected_state,
    label,
    format('오류 %s (%s), 기대 %s', sqlstate, sqlerrm, expected_state)
  );
end;
$$;

-- 넣거나 고치거나 지운 행의 수를 본다. 접근 규칙에 막힌 수정과 삭제는 오류 없이 0 행이 된다.
create function test.affects(query text, expected_rows bigint, label text)
returns text
language plpgsql
as $$
declare
  actual bigint;
begin
  execute query;
  get diagnostics actual = row_count;
  return test.report(
    actual = expected_rows,
    label,
    format('바뀐 행 %s, 기대 %s', actual, expected_rows)
  );
exception when others then
  return test.report(false, label, format('오류 %s: %s', sqlstate, sqlerrm));
end;
$$;

-- 아래 두 함수는 접근 규칙을 거치지 않고 관리자 권한으로 실행한다. 시험 준비와 확인에만 쓴다.

-- 조회한 값을 이름을 붙여 기억해 둔다. 시험에서는 test.get('이름') 으로 꺼낸다.
create function test.remember(key text, query text)
returns void
language plpgsql
security definer
as $$
declare
  value text;
begin
  execute query into value;
  if value is null then
    raise exception '기억할 값이 없습니다: %', key;
  end if;
  perform set_config('test.' || key, value, false);
end;
$$;

create function test.get(key text)
returns text
language sql
stable
as $$
  select current_setting('test.' || key)
$$;

create function test.sudo(query text)
returns void
language plpgsql
security definer
as $$
begin
  execute query;
end;
$$;

-- 관리자 권한으로 조회한 값을 기대값과 비교한다.
create function test.sudo_is(query text, expected text, label text)
returns text
language plpgsql
security definer
as $$
declare
  actual text;
begin
  execute query into actual;
  return test.report(
    actual is not distinct from expected,
    label,
    format('결과 %L, 기대 %L', actual, expected)
  );
end;
$$;
