-- AI Log 검색과 도구 목록에 쓰는 함수.
-- 결정 배경은 docs/adr/0011-ai-log-search-functions.md 에 있다.

-- 두 함수 모두 부른 사람의 권한으로 실행한다. 그래서 ai_logs 의 접근 규칙이 그대로 적용되고,
-- 자기 Club 이 아닌 식별자를 넣으면 아무것도 돌려받지 못한다.

-- Club 의 AI Log 가운데 제목, 내용, 도구 이름에 찾는 글자가 들어 있는 것을 돌려준다.
-- 대소문자를 가리지 않는다. 찾는 글자의 % 와 _ 는 글자 그대로 찾는다.
-- 돌려주는 모양이 ai_logs 와 같아서, 부르는 쪽이 고르기와 정렬, Session 과 작성자 읽기를 이어서 붙일 수 있다.
create function public.search_ai_logs(target_club_id uuid, search text)
returns setof public.ai_logs
language sql
stable
set search_path = ''
as $$
  with needle as (
    select '%' || replace(replace(replace(btrim(search), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern
  )
  select l.*
  from public.ai_logs as l
  cross join needle
  where l.club_id = target_club_id
    and (
      l.title ilike needle.pattern
      or l.attempt ilike needle.pattern
      or l.result ilike needle.pattern
      or l.learned ilike needle.pattern
      or l.next_action ilike needle.pattern
      or exists (
        select 1
        from unnest(l.tools) as tool
        where tool ilike needle.pattern
      )
    );
$$;

-- Club 의 AI Log 에 쓰인 도구 이름과 그 도구를 쓴 기록 수를 많이 쓰인 순서로 돌려준다.
create function public.club_tool_counts(target_club_id uuid)
returns table (tool text, log_count bigint)
language sql
stable
set search_path = ''
as $$
  select used.tool, count(*) as log_count
  from public.ai_logs as l
  cross join lateral unnest(l.tools) as used (tool)
  where l.club_id = target_club_id
  group by used.tool
  order by log_count desc, used.tool
  limit 100;
$$;

-- 로그인한 사용자만 부를 수 있다.
revoke all on function public.search_ai_logs(uuid, text) from public, anon;
revoke all on function public.club_tool_counts(uuid) from public, anon;
grant execute on function public.search_ai_logs(uuid, text) to authenticated;
grant execute on function public.club_tool_counts(uuid) to authenticated;
