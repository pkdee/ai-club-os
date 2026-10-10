-- 발표의 구조와 접근 규칙, 그리고 링크로 발표를 읽는 함수.
-- 결정 배경은 docs/adr/0022-web-presentation-by-link.md 에 있다.

-- 앞 파일들(create_projects, add_ai_log_options)을 먼저 적용해야 한다.
-- 이 파일은 새 테이블과 함수만 만든다. 다시 실행해도 결과가 같다.

-- ---------------------------------------------------------------------------
-- 테이블
-- ---------------------------------------------------------------------------

-- 행이 있으면 공개된 것이다. 공개를 거두려면 행을 지우고, 그러면 링크는 바로 쓸 수 없다.
-- Project 하나에 하나, Club 전체에 하나만 둔다.
create table if not exists public.presentations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  scope text not null,
  project_id uuid,
  token text not null default replace(gen_random_uuid()::text, '-', ''),
  show_names boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presentations_scope_check check (scope in ('project', 'club')),
  -- Project 발표에는 Project 가 있어야 하고, Club 발표에는 없어야 한다.
  constraint presentations_target_check check ((scope = 'project') = (project_id is not null)),
  constraint presentations_token_key unique (token),
  -- 같은 Club 의 Project 만 가리킬 수 있다. Project 가 삭제되면 발표도 함께 삭제된다.
  constraint presentations_project_fkey foreign key (project_id, club_id)
    references public.projects (id, club_id) on delete cascade
);

comment on table public.presentations is '링크를 아는 사람이 로그인 없이 볼 수 있는 발표. 행이 있으면 공개된 것이다.';
comment on column public.presentations.scope is 'project 는 Project 하나를, club 은 Club 의 활동 전체를 보여 준다.';
comment on column public.presentations.token is '링크에 들어가는 값. 데이터베이스가 무작위로 만들고 고칠 수 없다.';
comment on column public.presentations.show_names is '켜면 참여자와 기록 작성자의 이름을 보인다. 이메일과 사진은 어느 경우에도 보이지 않는다.';

create unique index if not exists presentations_project_id_key
  on public.presentations (project_id) where scope = 'project';
create unique index if not exists presentations_club_id_key
  on public.presentations (club_id) where scope = 'club';
create index if not exists presentations_created_by_idx on public.presentations (created_by);

drop trigger if exists presentations_set_updated_at on public.presentations;
create trigger presentations_set_updated_at
  before update of show_names on public.presentations
  for each row
  when (old.* is distinct from new.*)
  execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- 행 단위 보안
-- ---------------------------------------------------------------------------

alter table public.presentations enable row level security;

-- 지금 로그인한 사용자가 그 발표를 공개하고 거둘 수 있는지 확인한다.
-- Project 발표는 그 Project 를 고칠 수 있는 사람이, Club 발표는 운영자가 한다.
create or replace function private.can_manage_presentation(
  target_club_id uuid,
  target_scope text,
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case target_scope
    when 'project' then private.can_edit_project(target_project_id)
    when 'club' then private.is_club_admin(target_club_id)
    else false
  end;
$$;

revoke all on function private.can_manage_presentation(uuid, text, uuid) from public;
grant execute on function private.can_manage_presentation(uuid, text, uuid) to authenticated;

-- Club 의 Member 는 공개된 발표와 그 링크를 본다.
drop policy if exists presentations_select_for_members on public.presentations;
create policy presentations_select_for_members on public.presentations
  for select
  to authenticated
  using (private.is_club_member(club_id));

drop policy if exists presentations_insert_for_managers on public.presentations;
create policy presentations_insert_for_managers on public.presentations
  for insert
  to authenticated
  with check (
    private.can_manage_presentation(club_id, scope, project_id)
    and created_by = (select auth.uid())
  );

drop policy if exists presentations_update_for_managers on public.presentations;
create policy presentations_update_for_managers on public.presentations
  for update
  to authenticated
  using (private.can_manage_presentation(club_id, scope, project_id))
  with check (private.can_manage_presentation(club_id, scope, project_id));

drop policy if exists presentations_delete_for_managers on public.presentations;
create policy presentations_delete_for_managers on public.presentations
  for delete
  to authenticated
  using (private.can_manage_presentation(club_id, scope, project_id));

revoke all on table public.presentations from anon, authenticated;

-- 링크 값과 공개한 사람은 넣을 수 없다. 고칠 수 있는 것은 이름을 보일지뿐이다.
grant select, delete on table public.presentations to authenticated;
grant insert (club_id, scope, project_id, show_names) on table public.presentations to authenticated;
grant update (show_names) on table public.presentations to authenticated;

-- ---------------------------------------------------------------------------
-- 링크로 발표 읽기
-- ---------------------------------------------------------------------------

-- 밖으로 내보내도 되는 이름을 고른다. 이름이 없어 이메일을 이름으로 쓰는 Member 가 있으므로,
-- 이메일처럼 보이는 값은 이름으로 치지 않고 비운다. 발표에는 이메일이 어떤 모양으로도 나가지 않는다.
create or replace function private.public_name(name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when name is null or btrim(name) = '' or position('@' in name) > 0 then null
    else btrim(name)
  end;
$$;

revoke all on function private.public_name(text) from public;

-- 링크 값으로 발표에 담을 내용을 돌려준다. 로그인하지 않은 사람도 부를 수 있는 단 하나의 길이다.
-- 테이블은 로그인하지 않은 사람에게 열지 않고, 이 함수가 보여 줘도 되는 것만 골라 돌려준다.
--   링크가 틀렸거나 공개를 거뒀으면 null 을 돌려준다.
--   AI Log 는 그 Project 에 묶여 있고 작성자가 발표에 넣어도 된다고 한 것만 넣는다.
--   이름은 show_names 가 켜져 있을 때만 넣는다. 이메일, 사진, 식별자는 어느 경우에도 넣지 않는다.
--   이름 대신 이메일을 쓰는 Member 의 이름은 비워서 넣는다.
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

-- 로그인하지 않은 사람도 부를 수 있다. 링크 값을 아는 사람만 내용을 받는다.
revoke all on function public.get_presentation(text) from public;
grant execute on function public.get_presentation(text) to anon, authenticated;
