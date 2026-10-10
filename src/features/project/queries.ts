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
