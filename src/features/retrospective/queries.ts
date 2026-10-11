import { cache } from "react"

import { monthKeyOf, monthRange } from "@/features/ai-insight/period"
import { memberName } from "@/features/member/name"
import { googleAvatarUrl } from "@/lib/google-avatar"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import {
  monthStartDate,
  type RetrospectiveOptions,
  type RetrospectiveScope,
} from "./rules"

export type RetrospectiveAuthor = {
  userId: string
  name: string
  avatarUrl: string | null
}

export type Retrospective = {
  id: string
  scope: RetrospectiveScope
  sessionId: string | null
  projectId: string | null
  // 한 달 회고일 때의 달. 예: 2026-10
  month: string | null
  // 작성자가 Club 에서 빠졌으면 null 이다.
  author: RetrospectiveAuthor | null
  wentWell: string
  toImprove: string
  toTry: string
  createdAt: string
  updatedAt: string
  // 작성자가 정한 쓰임. 그 열이 아직 없는 데이터베이스에서 읽으면 null 이다.
  options: RetrospectiveOptions | null
}

// unavailable 은 데이터베이스에 회고의 구조가 아직 없다는 뜻이다.
// optionsReady 는 쓰임을 정하는 열이 있다는 뜻이다. 없으면 쓰는 창에 그 칸을 그리지 않는다.
export type RetrospectiveListResult =
  | { status: "ok"; retrospectives: Retrospective[]; optionsReady: boolean }
  | { status: "unavailable" }
  | { status: "error" }

type Row = {
  id: string
  scope: RetrospectiveScope
  session_id: string | null
  project_id: string | null
  period_start: string | null
  author_id: string | null
  went_well: string
  to_improve: string
  to_try: string
  created_at: string
  updated_at: string
  // 쓰임을 정하는 열이 아직 없는 데이터베이스에서 읽으면 이 값들이 없다.
  use_in_insight?: boolean
  share_in_presentation?: boolean
  author: {
    display_name: string
    email: string | null
    avatar_url: string | null
  } | null
}

// 작성자가 정한 쓰임. 그 열이 생긴 뒤에만 읽을 수 있다.
const OPTION_COLUMNS = ", use_in_insight, share_in_presentation"
// 열이 아직 없을 때의 오류 번호.
const MISSING_COLUMN = "42703"

type ReadResponse = { data: unknown; error: { code?: string } | null }

// 쓰임과 함께 읽어 보고, 그 열이 아직 없으면 쓰임 없이 다시 읽는다.
async function readWithOptions(
  read: (columns: string) => PromiseLike<ReadResponse>,
  label: string
): Promise<RetrospectiveListResult> {
  let response = await read(COLUMNS + OPTION_COLUMNS)
  const optionsReady = response.error?.code !== MISSING_COLUMN
  if (!optionsReady) {
    response = await read(COLUMNS)
  }
  return toResult(response.data, response.error, label, optionsReady)
}

// 작성자 이름을 함께 읽는다. 어느 외래 키를 따라갈지 이름으로 정해 둔다.
const COLUMNS =
  "id, scope, session_id, project_id, period_start, author_id, went_well, to_improve, to_try, created_at, updated_at, author:members!retrospectives_author_fkey(display_name, email, avatar_url)"

// 한 대상에서 한 번에 읽는 회고 수. 사람마다 하나라서 Member 수를 넘지 않는다.
const TARGET_LIMIT = 500

// 테이블이 아직 없을 때의 오류 번호. 뒤의 것은 데이터 API 가 테이블을 모를 때다.
function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

function toRetrospective(row: Row): Retrospective {
  return {
    id: row.id,
    scope: row.scope,
    sessionId: row.session_id,
    projectId: row.project_id,
    month: row.period_start ? row.period_start.slice(0, 7) : null,
    author:
      row.author_id && row.author
        ? {
            userId: row.author_id,
            name: memberName(row.author),
            avatarUrl: googleAvatarUrl(row.author.avatar_url),
          }
        : null,
    wentWell: row.went_well,
    toImprove: row.to_improve,
    toTry: row.to_try,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    options:
      typeof row.use_in_insight === "boolean" &&
      typeof row.share_in_presentation === "boolean"
        ? {
            useInInsight: row.use_in_insight,
            shareInPresentation: row.share_in_presentation,
          }
        : null,
  }
}

function toResult(
  data: unknown,
  error: { code?: string } | null,
  label: string,
  optionsReady: boolean
): RetrospectiveListResult {
  if (error) {
    if (isMissingTable(error)) {
      return { status: "unavailable" }
    }
    console.error(`${label} 회고를 불러오지 못했습니다.`, error)
    return { status: "error" }
  }
  return {
    status: "ok",
    retrospectives: ((data ?? []) as unknown as Row[]).map(toRetrospective),
    optionsReady,
  }
}

// 한 Project 의 회고를 쓴 순서로 읽는다.
export const listProjectRetrospectives = cache(
  async (clubId: string, projectId: string): Promise<RetrospectiveListResult> => {
    if (!isUuid(projectId)) {
      return { status: "ok", retrospectives: [], optionsReady: false }
    }

    const supabase = await createClient()
    return readWithOptions(
      (columns) =>
        supabase
          .from("retrospectives")
          .select(columns)
          .eq("club_id", clubId)
          .eq("scope", "project")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true })
          .range(0, TARGET_LIMIT - 1),
      "Project 의"
    )
  }
)

// 한 Session 의 회고를 쓴 순서로 읽는다.
export const listSessionRetrospectives = cache(
  async (clubId: string, sessionId: string): Promise<RetrospectiveListResult> => {
    if (!isUuid(sessionId)) {
      return { status: "ok", retrospectives: [], optionsReady: false }
    }

    const supabase = await createClient()
    return readWithOptions(
      (columns) =>
        supabase
          .from("retrospectives")
          .select(columns)
          .eq("club_id", clubId)
          .eq("scope", "session")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true })
          .range(0, TARGET_LIMIT - 1),
      "Session 의"
    )
  }
)

// 한 달의 회고를 쓴 순서로 읽는다. month 는 2026-10 같은 값이다.
export const listMonthRetrospectives = cache(
  async (clubId: string, month: string): Promise<RetrospectiveListResult> => {
    const supabase = await createClient()
    return readWithOptions(
      (columns) =>
        supabase
          .from("retrospectives")
          .select(columns)
          .eq("club_id", clubId)
          .eq("scope", "month")
          .eq("period_start", monthStartDate(month))
          .order("created_at", { ascending: true })
          .range(0, TARGET_LIMIT - 1),
      "한 달의"
    )
  }
)

// 달마다 한 달 회고를 쓴 사람의 수와, 내가 썼는지.
export type MonthRetrospectiveCount = { total: number; mine: boolean }

export type MonthCountsResult =
  | { status: "ok"; counts: Record<string, MonthRetrospectiveCount> }
  | { status: "unavailable" }
  | { status: "error" }

// since 달부터의 한 달 회고를 달마다 센다. since 는 2026-10 같은 값이다.
export const countMonthRetrospectives = cache(
  async (
    clubId: string,
    userId: string,
    since: string
  ): Promise<MonthCountsResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("retrospectives")
      .select("period_start, author_id")
      .eq("club_id", clubId)
      .eq("scope", "month")
      .gte("period_start", monthStartDate(since))
      .range(0, 4999)

    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("한 달 회고의 수를 세지 못했습니다.", error)
      return { status: "error" }
    }

    const counts: Record<string, MonthRetrospectiveCount> = {}
    for (const row of (data ?? []) as {
      period_start: string
      author_id: string | null
    }[]) {
      const month = row.period_start.slice(0, 7)
      const entry = (counts[month] ??= { total: 0, mine: false })
      entry.total += 1
      entry.mine ||= row.author_id === userId
    }
    return { status: "ok", counts }
  }
)

// 최근에 올라온 회고 한 줄. 무엇을 돌아봤는지 이름과 함께 보여 준다.
export type RecentRetrospective = Retrospective & {
  // 돌아본 Project 나 Session 의 이름. 한 달 회고에서는 null 이다.
  targetName: string | null
}

export type RecentRetrospectivesResult =
  | { status: "ok"; retrospectives: RecentRetrospective[] }
  | { status: "unavailable" }
  | { status: "error" }

// Club 에 최근 올라온 회고를 최신순으로 읽는다.
export const listRecentRetrospectives = cache(
  async (clubId: string, limit: number): Promise<RecentRetrospectivesResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("retrospectives")
      .select(
        `${COLUMNS}, session:sessions!retrospectives_session_fkey(title), project:projects!retrospectives_project_fkey(name)`
      )
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .range(0, limit - 1)

    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("최근 회고를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return {
      status: "ok",
      retrospectives: (
        (data ?? []) as unknown as (Row & {
          session: { title: string } | null
          project: { name: string } | null
        })[]
      ).map((row) => ({
        ...toRetrospective(row),
        targetName: row.project?.name ?? row.session?.title ?? null,
      })),
    }
  }
)

// 한 달 동안 내가 한 것. 한 달 회고를 쓸 때 옆에서 돌아볼 거리로 보여 준다.
export type MonthActivity = {
  // 그 달에 내가 남긴 AI Log. 쓴 순서다.
  logs: { id: string; title: string; createdAt: string; nextAction: string }[]
  // 그 달에 열린 Session 수와 내 출석. recorded 는 기록된 회차 수다.
  sessions: number
  attendance: {
    present: number
    late: number
    absent: number
    excused: number
  }
}

// 한 화면에 보여 주는 내 AI Log 수.
const ACTIVITY_LOG_LIMIT = 100

// 그 달의 내 AI Log 와 출석을 읽는다. 불러오지 못하면 null 이다.
// memberId 는 이 Club 에서의 내 Member 식별자다. 없으면 출석은 세지 않는다.
export const getMonthActivity = cache(
  async (
    clubId: string,
    userId: string,
    memberId: string | null,
    month: string
  ): Promise<MonthActivity | null> => {
    const supabase = await createClient()
    const { start, end } = monthRange(month)
    const [logs, sessions] = await Promise.all([
      supabase
        .from("ai_logs")
        .select("id, title, created_at, next_action")
        .eq("club_id", clubId)
        .eq("author_id", userId)
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: true })
        .range(0, ACTIVITY_LOG_LIMIT - 1),
      supabase
        .from("sessions")
        .select("id")
        .eq("club_id", clubId)
        .gte("starts_at", start)
        .lt("starts_at", end)
        .range(0, 199),
    ])

    if (logs.error || sessions.error) {
      console.error(
        "한 달의 활동을 불러오지 못했습니다.",
        logs.error ?? sessions.error
      )
      return null
    }

    const sessionIds = ((sessions.data ?? []) as { id: string }[]).map(
      (session) => session.id
    )
    const attendance = { present: 0, late: 0, absent: 0, excused: 0 }
    if (memberId && sessionIds.length > 0) {
      const records = await supabase
        .from("attendance")
        .select("status")
        .eq("club_id", clubId)
        .eq("member_id", memberId)
        .in("session_id", sessionIds)

      if (records.error) {
        console.error("한 달의 출석을 불러오지 못했습니다.", records.error)
        return null
      }
      for (const row of (records.data ?? []) as {
        status: keyof typeof attendance
      }[]) {
        if (row.status in attendance) {
          attendance[row.status] += 1
        }
      }
    }

    return {
      logs: (
        (logs.data ?? []) as {
          id: string
          title: string
          created_at: string
          next_action: string
        }[]
      ).map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        nextAction: row.next_action,
      })),
      sessions: sessionIds.length,
      attendance,
    }
  }
)

// 내가 이 Club 에 참여한 시각. 한 달 회고에서 고를 수 있는 달을 정하는 데 쓴다. 알 수 없으면 null 이다.
export const getMyJoinedAt = cache(
  async (clubId: string, userId: string): Promise<string | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("members")
      .select("created_at")
      .eq("club_id", clubId)
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("참여한 시각을 불러오지 못했습니다.", error)
      return null
    }
    return (data as { created_at: string } | null)?.created_at ?? null
  }
)

// 내가 이번 달 회고를 썼는지. 개요의 내 기록에서 쓰거나 보러 가는 길을 정하는 데 쓴다.
// unavailable 은 회고의 구조가 아직 없다는 뜻이다.
export const hasMonthRetrospective = cache(
  async (
    clubId: string,
    userId: string,
    now: Date
  ): Promise<"written" | "none" | "unavailable"> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("retrospectives")
      .select("id")
      .eq("club_id", clubId)
      .eq("scope", "month")
      .eq("author_id", userId)
      .eq("period_start", monthStartDate(monthKeyOf(now)))
      .limit(1)

    if (error) {
      if (!isMissingTable(error)) {
        console.error("이번 달 회고를 확인하지 못했습니다.", error)
      }
      return "unavailable"
    }
    return (data ?? []).length > 0 ? "written" : "none"
  }
)
