-- 로그인한 사용자 모두가 보는 Club 목록.
-- 결정 배경은 docs/adr/0032-club-directory-and-logos.md 에 있다.

-- 이 파일은 함수 하나만 만든다. 테이블을 잠그지 않는다. 다시 실행해도 결과가 같다.
-- 돌려주는 logo_path 열은 앞 파일(add_club_logo)이 만든다.

-- clubs 와 members 의 접근 규칙은 그대로 둔다. Club 안은 지금처럼 Member 만 본다.
-- Member 가 아닌 사람은 이 함수가 돌려주는 값만 본다. 이름, 소개, 로고 경로, Member 수, 만든 때다.
-- Member 의 이름과 Club 안의 기록은 돌려주지 않는다. my_role 은 내 역할이고 Member 가 아니면 null 이다.
-- Member 가 아닌 사람도 clubs 와 members 를 읽어야 해서 만든 사람의 권한으로 실행한다.
create or replace function public.list_clubs()
returns table (
  id uuid,
  name text,
  description text,
  logo_path text,
  member_count bigint,
  my_role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.name,
    c.description,
    c.logo_path,
    (select count(*) from public.members as m where m.club_id = c.id),
    (
      select m.role
      from public.members as m
      where m.club_id = c.id
        and m.user_id = (select auth.uid())
    ),
    c.created_at
  from public.clubs as c
  where (select auth.uid()) is not null
  order by c.created_at desc, c.id;
$$;

revoke all on function public.list_clubs() from public, anon;
grant execute on function public.list_clubs() to authenticated;
