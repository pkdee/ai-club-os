-- Project 발표에 그 Project 에 묶인 AI Log 를 모두 넣는다. 작성자가 기록마다 허락하던 선택을 없앴다.
-- 결정 배경은 docs/adr/0036-ai-logs-always-in-insight-and-presentation.md 에 있다.

-- 이 파일은 함수만 바꾸고 테이블을 잠그지 않는다. 다시 실행해도 결과가 같다.
-- ai_logs 의 선택 열을 지우는 다음 파일(drop_ai_log_options)보다 먼저 적용한다. 이 함수가 그 열을 더 읽지 않게 하려는 것이다.

-- 링크로 발표를 읽는 함수. AI Log 를 거르는 조건만 빼고 앞 파일(add_retrospective_options)의 것과 같다.
create or replace function public.get_presentation(presentation_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.presentations;
  club public.clubs;
  project public.projects;
begin
  if presentation_token is null or presentation_token !~ '^[0-9a-f]{32}$' then
    return null;
  end if;

  select * into p from public.presentations where token = presentation_token;
  if not found then
    return null;
  end if;

  select * into club from public.clubs where id = p.club_id;

  if p.scope = 'project' then
    select * into project from public.projects where id = p.project_id;

    return jsonb_build_object(
      'scope', 'project',
      'clubName', club.name,
      'showNames', p.show_names,
      'intro', p.intro,
      'publishedAt', p.created_at,
      'project', jsonb_build_object(
        'name', project.name,
        'goal', project.goal,
        'status', project.status,
        'createdAt', project.created_at
      ),
      'participantCount', (
        select count(*) from public.project_members as pm where pm.project_id = project.id
      ),
      'participantNames', case when p.show_names then (
        select coalesce(jsonb_agg(private.public_name(m.display_name) order by pm.created_at, m.id), '[]'::jsonb)
        from public.project_members as pm
        join public.members as m on m.id = pm.member_id
        where pm.project_id = project.id
      ) end,
      'links', (
        select coalesce(
          jsonb_agg(jsonb_build_object('label', l.label, 'url', l.url) order by l.created_at, l.id),
          '[]'::jsonb
        )
        from public.project_links as l
        where l.project_id = project.id
      ),
      'tasks', (
        select coalesce(
          jsonb_agg(jsonb_build_object('title', t.title, 'done', t.done) order by t.created_at, t.id),
          '[]'::jsonb
        )
        from public.project_tasks as t
        where t.project_id = project.id
      ),
      'logCount', (
        select count(*) from public.ai_logs as l where l.project_id = project.id
      ),
      -- Project 에 묶인 AI Log 는 작성자와 상관없이 모두 내보낸다.
      'logs', (
        select coalesce(jsonb_agg(item order by created_at, id), '[]'::jsonb)
        from (
          select
            l.created_at,
            l.id,
            jsonb_build_object(
              'title', l.title,
              'tools', to_jsonb(l.tools),
              'attempt', l.attempt,
              'result', l.result,
              'learned', l.learned,
              'nextAction', l.next_action,
              'createdAt', l.created_at,
              'author', case when p.show_names then (
                select private.public_name(m.display_name)
                from public.members as m
                where m.club_id = l.club_id
                  and m.user_id = l.author_id
              ) end
            ) as item
          from public.ai_logs as l
          where l.project_id = project.id
          order by l.created_at, l.id
          limit 100
        ) as shared
      ),
      -- 회고는 작성자가 발표에 넣어도 된다고 한 것만 내보낸다.
      'retrospectives', (
        select coalesce(jsonb_agg(item order by created_at, id), '[]'::jsonb)
        from (
          select
            r.created_at,
            r.id,
            jsonb_build_object(
              'wentWell', r.went_well,
              'toImprove', r.to_improve,
              'toTry', r.to_try,
              'createdAt', r.created_at,
              'author', case when p.show_names then (
                select private.public_name(m.display_name)
                from public.members as m
                where m.club_id = r.club_id
                  and m.user_id = r.author_id
              ) end
            ) as item
          from public.retrospectives as r
          where r.scope = 'project'
            and r.project_id = project.id
            and r.share_in_presentation
          order by r.created_at, r.id
          limit 50
        ) as shared_retrospectives
      )
    );
  end if;

  return jsonb_build_object(
    'scope', 'club',
    'clubName', club.name,
    'clubDescription', club.description,
    'showNames', p.show_names,
    'intro', p.intro,
    'publishedAt', p.created_at,
    'memberCount', (select count(*) from public.members as m where m.club_id = club.id),
    'memberNames', case when p.show_names then (
      select coalesce(jsonb_agg(private.public_name(m.display_name) order by m.created_at, m.id), '[]'::jsonb)
      from public.members as m
      where m.club_id = club.id
    ) end,
    'logCount', (select count(*) from public.ai_logs as l where l.club_id = club.id),
    'projectCount', (select count(*) from public.projects as pr where pr.club_id = club.id),
    -- 이미 시작한 회차만 넣는다. 앞으로 열 회차의 날짜와 제목은 밖으로 내보내지 않는다.
    'sessions', (
      select coalesce(jsonb_agg(item order by starts_at, id), '[]'::jsonb)
      from (
        select
          s.starts_at,
          s.id,
          jsonb_build_object('title', s.title, 'startsAt', s.starts_at) as item
        from public.sessions as s
        where s.club_id = club.id
          and s.starts_at <= now()
        order by s.starts_at desc, s.id desc
        limit 100
      ) as held
    ),
    -- 발표가 공개된 Project 만 넣는다. 공개하지 않은 Project 는 이름도 내보내지 않는다.
    'projects', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'name', pr.name,
            'goal', pr.goal,
            'status', pr.status,
            'token', pp.token
          )
          order by pp.created_at, pp.id
        ),
        '[]'::jsonb
      )
      from public.presentations as pp
      join public.projects as pr on pr.id = pp.project_id
      where pp.club_id = club.id
        and pp.scope = 'project'
    )
  );
end;
$$;

revoke all on function public.get_presentation(text) from public;
grant execute on function public.get_presentation(text) to anon, authenticated;
