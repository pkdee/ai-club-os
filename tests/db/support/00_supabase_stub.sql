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

-- Storage 의 최소한. 저장 공간 목록과 파일 목록, 경로의 마디를 읽는 함수를 흉내 낸다.
-- 실제 Supabase 처럼 파일 목록에는 행 단위 보안이 켜져 있고, 접근 규칙이 없으면 아무도 다루지 못한다.
-- 파일의 주인인 사용자는 지울 수 없다는 것도 같다.
create schema storage;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  unique (bucket_id, name)
);

alter table storage.objects enable row level security;

-- 경로에서 파일 이름을 뺀 앞마디들을 돌려준다. 예: a/b/c.png 는 {a,b}
create function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1]
$$;

grant usage on schema storage to anon, authenticated, service_role;
grant all on table storage.objects to anon, authenticated, service_role;
grant select on table storage.buckets to anon, authenticated, service_role;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;
