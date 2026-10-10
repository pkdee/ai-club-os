-- 접근 규칙 시험용 데이터베이스에만 쓰는 파일이다. 실제 프로젝트에는 적용하지 않는다.
-- Supabase 가 미리 만들어 두는 것 가운데 마이그레이션이 기대는 최소한을 흉내 낸다.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;

create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'
);

-- 요청에 실린 로그인 정보에서 사용자 식별자를 읽는다. 로그인하지 않았으면 null 이다.
create function auth.uid()
returns uuid
language sql
stable
as $$
  select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- Supabase 는 public 에 새로 만드는 테이블, 함수, 시퀀스의 모든 권한을 이 역할들에 기본으로 준다.
-- 마이그레이션이 권한을 거두는 것을 빠뜨리면 시험에서 드러나도록 같은 기본값을 둔다.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
