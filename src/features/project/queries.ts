import { cache } from "react"

import { memberName } from "@/features/member/name"
import { googleAvatarUrl } from "@/lib/google-avatar"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import type { ProjectStatus } from "./rules"

export type ProjectParticipant = {
  memberId: string
  userId: string
  name: string
  avatarUrl: string | null
}

export type ProjectTask = {
  id: string
  title: string
  done: boolean
}

// 할 일에 딸린 담당자와 기한.
export type ProjectTaskDetail = {
  // 맡은 Member. 맡은 사람이 없거나 그 사람이 Club 에서 나갔으면 null 이다.
  assignee: { memberId: string; name: string } | null
  // 끝내기로 한 날(YYYY-MM-DD). 없으면 null 이다.
  dueOn: string | null
}

export type ProjectJoinRequest = {
  memberId: string
  userId: string
  name: string
  avatarUrl: string | null
  requestedAt: string
}

// unavailable 은 데이터베이스에 참여 요청을 두는 구조가 아직 없다는 뜻이다.
export type ProjectJoinRequestsResult =
  | { status: "ok"; requests: ProjectJoinRequest[] }
  | { status: "unavailable" }
  | { status: "error" }

export type ProjectLink = {
  id: string
  label: string
  url: string
}

export type Project = {
  id: string
  clubId: string
  name: string
  goal: string
  status: ProjectStatus
  // 만든 사용자. 계정이 없어졌으면 null 이다.
  createdBy: string | null
  createdAt: string
  updatedAt: string
  participants: ProjectParticipant[]
  tasks: ProjectTask[]
  links: ProjectLink[]
  // 이 Project 에 묶인 AI Log 수. 세지 못했으면 null 이다.
  logCount: number | null
}

// unavailable 은 데이터베이스에 Project 의 구조가 아직 없다는 뜻이다.
// logsLinked 는 ai_logs 에 Project 연결이 있는지다. Project 테이블만 먼저 적용된 사이에는 false 이고,
// 그때는 AI Log 를 Project 에 묶을 수 없다.
export type ProjectListResult =
  | { status: "ok"; projects: Project[]; logsLinked: boolean }
  | { status: "unavailable" }
  | { status: "error" }

export type ProjectResult =
  | { status: "ok"; project: Project }
  | { status: "not-found" }
  | { status: "unavailable" }
  | { status: "error" }

type ProjectRow = {
  id: string
  club_id: string
  name: string
  goal: string
  status: ProjectStatus
  created_by: string | null
  created_at: string
  updated_at: string
  participants: {
    member: {
      id: string
      user_id: string
      display_name: string
      email: string | null
      avatar_url: string | null
    } | null
  }[]
  tasks: { id: string; title: string; done: boolean }[]
  links: { id: string; label: string; url: string }[]
  logs?: { count: number }[]
}

// 참여자, 할 일, 링크를 함께 읽는다.
const PROJECT_COLUMNS =
  "id, club_id, name, goal, status, created_by, created_at, updated_at, participants:project_members(member:members(id, user_id, display_name, email, avatar_url)), tasks:project_tasks(id, title, done), links:project_links(id, label, url)"
// 묶인 AI Log 수. ai_logs 에 Project 연결이 생긴 뒤에만 읽을 수 있다.
const LOG_COUNT = ", logs:ai_logs!ai_logs_project_fkey(count)"

const PROJECT_LIST_LIMIT = 200

// 테이블이 아직 없을 때 돌아오는 오류. 데이터베이스가 내는 것과 API 가 내는 것 두 가지다.
function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

// AI Log 와 Project 의 연결이 아직 없을 때 돌아오는 오류.
function isMissingLogLink(error: { code?: string }) {
  return error.code === "PGRST200"
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    clubId: row.club_id,
    name: row.name,
    goal: row.goal,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    participants: row.participants.flatMap(({ member }) =>
      member
        ? [
            {
              memberId: member.id,
              userId: member.user_id,
              name: memberName(member),
              avatarUrl: googleAvatarUrl(member.avatar_url),
            },
          ]
        : []
    ),
    tasks: row.tasks,
    links: row.links,
    logCount: row.logs ? (row.logs[0]?.count ?? 0) : null,
  }
}

// Club 의 Project 를 최근에 만든 순서로 읽는다. 다른 Club 의 Project 는 데이터베이스의 접근 규칙이 막는다.
export const listProjects = cache(
  async (clubId: string): Promise<ProjectListResult> => {
    const supabase = await createClient()
    const read = (columns: string) =>
      supabase
        .from("projects")
        .select(columns)
        .eq("club_id", clubId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .order("created_at", { referencedTable: "project_tasks", ascending: true })
        .order("id", { referencedTable: "project_tasks", ascending: true })
        .order("created_at", { referencedTable: "project_links", ascending: true })
        .order("id", { referencedTable: "project_links", ascending: true })
        .range(0, PROJECT_LIST_LIMIT - 1)

    let response = await read(PROJECT_COLUMNS + LOG_COUNT)
    // 연결이 아직 없으면 기록 수 없이 읽는다.
    const logsLinked = !(response.error && isMissingLogLink(response.error))
    if (!logsLinked) {
      response = await read(PROJECT_COLUMNS)
    }

    const { data, error } = response
    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("Project 목록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }
    return {
      status: "ok",
      projects: (data as unknown as ProjectRow[]).map(toProject),
      logsLinked,
    }
  }
)

export const getProject = cache(
  async (clubId: string, projectId: string): Promise<ProjectResult> => {
    if (!isUuid(projectId)) {
      return { status: "not-found" }
    }

    const supabase = await createClient()
    const read = (columns: string) =>
      supabase
        .from("projects")
        .select(columns)
        .eq("club_id", clubId)
        .eq("id", projectId)
        .order("created_at", { referencedTable: "project_tasks", ascending: true })
        .order("id", { referencedTable: "project_tasks", ascending: true })
        .order("created_at", { referencedTable: "project_links", ascending: true })
        .order("id", { referencedTable: "project_links", ascending: true })
        .maybeSingle()

    let response = await read(PROJECT_COLUMNS + LOG_COUNT)
    if (response.error && isMissingLogLink(response.error)) {
      response = await read(PROJECT_COLUMNS)
    }

    const { data, error } = response
    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("Project 를 불러오지 못했습니다.", error)
      return { status: "error" }
    }
    return data
      ? { status: "ok", project: toProject(data as unknown as ProjectRow) }
      : { status: "not-found" }
  }
)

// 할 일의 담당자와 기한을 할 일의 식별자별로 읽는다.
// 그 열이 아직 없거나 읽지 못하면 null 이다. 그때는 담당자와 기한을 보여 주지도 고치지도 않는다.
export const getProjectTaskDetails = cache(
  async (
    clubId: string,
    projectId: string
  ): Promise<Record<string, ProjectTaskDetail> | null> => {
    if (!isUuid(projectId)) {
      return null
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("project_tasks")
      .select(
        "id, due_on, assignee:members!project_tasks_assignee_fkey(id, display_name, email)"
      )
      .eq("club_id", clubId)
      .eq("project_id", projectId)

    if (error) {
      // 열이나 관계가 아직 없을 때의 오류는 남기지 않는다.
      if (error.code !== "42703" && error.code !== "PGRST200") {
        console.error("할 일의 담당자와 기한을 불러오지 못했습니다.", error)
      }
      return null
    }

    const rows = data as unknown as {
      id: string
      due_on: string | null
      assignee: { id: string; display_name: string; email: string | null } | null
    }[]
    return Object.fromEntries(
      rows.map((row) => [
        row.id,
        {
          assignee: row.assignee
            ? { memberId: row.assignee.id, name: memberName(row.assignee) }
            : null,
          dueOn: row.due_on,
        },
      ])
    )
  }
)

// Project 에 들어온 참여 요청을 요청한 순서로 읽는다.
// 그 Project 를 고칠 수 있는 사람에게는 모두 보이고, 다른 Member 에게는 자기 요청만 보인다.
export const listProjectJoinRequests = cache(
  async (
    clubId: string,
    projectId: string
  ): Promise<ProjectJoinRequestsResult> => {
    if (!isUuid(projectId)) {
      return { status: "ok", requests: [] }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("project_join_requests")
      .select(
        "created_at, member:members!project_join_requests_member_fkey(id, user_id, display_name, email, avatar_url)"
      )
      .eq("club_id", clubId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })

    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("참여 요청을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const rows = data as unknown as {
      created_at: string
      member: {
        id: string
        user_id: string
        display_name: string
        email: string | null
        avatar_url: string | null
      } | null
    }[]
    return {
      status: "ok",
      requests: rows.flatMap((row) =>
        row.member
          ? [
              {
                memberId: row.member.id,
                userId: row.member.user_id,
                name: memberName(row.member),
                avatarUrl: googleAvatarUrl(row.member.avatar_url),
                requestedAt: row.created_at,
              },
            ]
          : []
      ),
    }
  }
)
