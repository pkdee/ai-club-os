-- AI Log 검색이 띄어쓰기 차이를 넘어 찾고, 도구 이름을 대소문자와 공백 구분 없이 다루게 한다.
-- 결정 배경은 docs/adr/0012-loose-matching-for-search-and-tools.md 에 있다.

-- 글자를 비교할 때 쓰는 값. 대소문자와 공백의 차이를 없앤다.
-- "청크 크기" 와 "청크크기", "ChatGPT" 와 "chatgpt", "Claude Code" 와 "ClaudeCode" 가 같은 값이 된다.
create function private.search_key(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(value, '\s+', '', 'g'));
$$;

revoke all on function private.search_key(text) from public;
-- 아래 두 함수가 부른 사람의 권한으로 실행되므로 로그인한 사용자가 이 함수를 쓸 수 있어야 한다.
grant execute on function private.search_key(text) to authenticated;

-- 값의 개수가 달라지므로 예전 함수를 지우고 다시 만든다.
drop function public.search_ai_logs(uuid, text);

-- Club 의 AI Log 를 찾는다.
-- search 는 공백으로 나눈 낱말이 모두 들어 있는 기록을 찾는다. 낱말은 제목, 내용, 도구 이름 어디에 있어도 된다.
-- tool_name 을 주면 그 도구를 쓴 기록만 찾는다. 둘 다 대소문자와 공백의 차이를 무시한다.
-- 부른 사람의 권한으로 실행하므로 ai_logs 의 접근 규칙이 그대로 적용된다.
create function public.search_ai_logs(
  target_club_id uuid,
  search text default '',
  tool_name text default null
)
returns setof public.ai_logs
language sql
stable
set search_path = ''
as $$
  with terms as (
    select coalesce(array_agg(distinct private.search_key(word)), '{}') as list
    from (
      select word
      from regexp_split_to_table(btrim(coalesce(search, '')), '\s+') as word
      where word <> ''
      limit 10
    ) as words
  )
  select l.*
  from public.ai_logs as l
  cross join terms
  cross join lateral (
    -- 칸 사이에는 입력할 수 없는 글자를 끼워서, 낱말이 두 칸에 걸쳐 찾아지지 않게 한다.
    select private.search_key(
      concat_ws(
        chr(31),
        l.title,
        l.attempt,
        l.result,
        l.learned,
        l.next_action,
        array_to_string(l.tools, chr(31))
      )
    ) as content
  ) as haystack
  where l.club_id = target_club_id
    and (
      coalesce(btrim(tool_name), '') = ''
      or exists (
        select 1
        from unnest(l.tools) as tool
        where private.search_key(tool) = private.search_key(tool_name)
      )
    )
    and not exists (
      select 1
      from unnest(terms.list) as term
      where position(term in haystack.content) = 0
    );
$$;

-- Club 의 AI Log 에 쓰인 도구 이름과 그 도구를 쓴 횟수를 많이 쓰인 순서로 돌려준다.
-- 대소문자나 공백만 다른 이름은 하나로 합치고, 그 가운데 가장 많이 쓰인 표기를 보여 준다.
create or replace function public.club_tool_counts(target_club_id uuid)
returns table (tool text, log_count bigint)
language sql
stable
set search_path = ''
as $$
  select
    (array_agg(spelled.spelling order by spelled.uses desc, spelled.spelling))[1] as tool,
    sum(spelled.uses)::bigint as log_count
  from (
    select
      private.search_key(used.tool) as key,
      used.tool as spelling,
      count(*) as uses
    from public.ai_logs as l
    cross join lateral unnest(l.tools) as used (tool)
    where l.club_id = target_club_id
    group by 1, 2
  ) as spelled
  group by spelled.key
  order by log_count desc, tool
  limit 100;
$$;

-- 로그인한 사용자만 부를 수 있다. club_tool_counts 는 바꿔 쓴 것이라 권한이 그대로 남아 있다.
revoke all on function public.search_ai_logs(uuid, text, text) from public, anon;
grant execute on function public.search_ai_logs(uuid, text, text) to authenticated;
