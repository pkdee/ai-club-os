-- AI Log 검색이 한 도구의 여러 표기를 함께 찾게 한다.
-- 결정 배경은 docs/adr/0013-known-tool-catalog.md 에 있다.

-- 값의 개수와 모양은 그대로이고 두 가지가 달라진다.
-- search 의 낱말 안에서 | 로 이은 것은 그 가운데 하나만 들어 있어도 맞는 것으로 본다.
--   예: '클로드|claude 요약' 은 "클로드" 나 "claude" 가 있고 "요약" 도 있는 기록을 찾는다.
-- tool_name 도 | 로 여러 표기를 이을 수 있고, 그 가운데 하나를 쓴 기록을 찾는다.
--   예: 'ChatGPT|챗지피티'
-- 어느 도구가 어떤 표기를 갖는지는 앱이 알고, 이 함수는 받은 표기를 그대로 쓴다.
create or replace function public.search_ai_logs(
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
    -- 공백으로 나눈 낱말. | 만 있는 낱말은 버린다.
    select coalesce(array_agg(distinct word), '{}') as list
    from (
      select word
      from regexp_split_to_table(btrim(coalesce(search, '')), '\s+') as word
      where replace(word, '|', '') <> ''
      limit 10
    ) as words
  ),
  wanted_tools as (
    select coalesce(array_agg(distinct private.search_key(spelling)), '{}') as keys
    from regexp_split_to_table(coalesce(tool_name, ''), '\|') as spelling
    where private.search_key(spelling) <> ''
  )
  select l.*
  from public.ai_logs as l
  cross join terms
  cross join wanted_tools
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
      cardinality(wanted_tools.keys) = 0
      or exists (
        select 1
        from unnest(l.tools) as tool
        where private.search_key(tool) = any (wanted_tools.keys)
      )
    )
    and not exists (
      -- 맞는 표기가 하나도 없는 낱말이 있으면 그 기록은 뺀다.
      select 1
      from unnest(terms.list) as term
      where not exists (
        select 1
        from regexp_split_to_table(term, '\|') as spelling
        where private.search_key(spelling) <> ''
          and position(private.search_key(spelling) in haystack.content) > 0
      )
    );
$$;
