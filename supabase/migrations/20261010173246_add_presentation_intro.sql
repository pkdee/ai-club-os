-- 발표에만 보이는 소개 글을 더한다.
-- 결정 배경은 docs/adr/0022-web-presentation-by-link.md 에 있다.

-- 이 파일은 기존 테이블 가운데 presentations 하나만 잠근다. 다시 실행해도 결과가 같다.

-- 잠금을 오래 기다리지 않는다. 앱의 요청과 엇갈려 기다리게 되면 이 파일이 먼저 물러나고 아무것도 바뀌지 않는다.
-- 그때는 다시 실행하면 된다.
set local lock_timeout = '800ms';

-- 공개하는 사람이 Club 밖의 사람에게 건네는 글이다. 비워 둘 수 있다.
alter table public.presentations
  add column if not exists intro text not null default '';

alter table public.presentations
  drop constraint if exists presentations_intro_length;
alter table public.presentations
  add constraint presentations_intro_length check (char_length(intro) <= 600);

comment on column public.presentations.intro is '발표에만 보이는 소개 글. 공개하는 사람이 적는다.';

-- 소개 글을 고쳐도 고친 시각이 바뀌게 한다.
drop trigger if exists presentations_set_updated_at on public.presentations;
create trigger presentations_set_updated_at
  before update of show_names, intro on public.presentations
  for each row
  when (old.* is distinct from new.*)
  execute function private.set_updated_at();

-- 공개하고 거둘 수 있는 사람이 소개 글도 적고 고친다.
grant insert (intro), update (intro) on table public.presentations to authenticated;

-- 링크로 발표를 읽는 함수가 소개 글도 함께 돌려주게 한다. 그 밖의 내용은 앞 파일의 것과 같다.
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
            and l.share_in_presentation
          order by l.created_at, l.id
          limit 100
        ) as shared
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
