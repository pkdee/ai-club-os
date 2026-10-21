-- Club 에 로고 사진을 더한다.
-- 결정 배경은 docs/adr/0032-club-directory-and-logos.md 에 있다.

-- 이 파일은 기존 테이블 가운데 clubs 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 로고 파일의 Storage 경로. 로고가 없으면 null 이다.
-- 경로는 Club 식별자와 앱이 만든 파일 이름의 두 마디다. 다른 Club 의 자리나 앱이 만들지 않은 이름은 받지 않는다.
alter table public.clubs
  add column if not exists logo_path text;

alter table public.clubs
  drop constraint if exists clubs_logo_path_format;
alter table public.clubs
  add constraint clubs_logo_path_format check (
    logo_path is null
    or logo_path ~ (
      '^' || id::text
      || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$'
    )
  );

comment on column public.clubs.logo_path is 'Club 로고 파일의 Storage 경로. club-logos 저장 공간의 <Club>/<파일 이름> 이다.';

-- 고칠 수 있는 사람은 이름과 소개처럼 운영자뿐이다. 규칙은 clubs_update_for_admins 를 그대로 쓴다.
grant update (logo_path) on table public.clubs to authenticated;

-- 로고 파일이 Storage 에 남아 있는 동안에는 Club 을 지우지 못하게 한다.
-- Club 이 먼저 사라지면 그 파일을 지울 수 있는 운영자가 없어져 아무도 지울 수 없는 파일이 남는다.
-- 그래서 앱은 Club 을 지우기 전과, 계정을 지우면서 Club 이 함께 지워지기 전에 그 Club 의 로고 파일을 먼저 지운다.
-- 지금 쓰는 로고만이 아니라 그 Club 의 자리에 남은 파일을 모두 본다.
-- storage.objects 를 읽어야 해서 만든 사람의 권한으로 실행한다. 읽기만 한다.
create or replace function private.keep_club_until_logo_is_gone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from storage.objects as o
    where o.bucket_id = 'club-logos'
      and o.name like old.id::text || '/%'
  ) then
    raise exception '로고 파일이 Storage 에 남아 있는 Club 은 지울 수 없습니다. 파일을 먼저 지워야 합니다.'
      using errcode = '23503';
  end if;
  return old;
end;
$$;

revoke all on function private.keep_club_until_logo_is_gone() from public;

drop trigger if exists clubs_keep_until_logo_is_gone on public.clubs;
create trigger clubs_keep_until_logo_is_gone
  before delete on public.clubs
  for each row
  execute function private.keep_club_until_logo_is_gone();
