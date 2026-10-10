import { cache } from "react"

import { kstDateKey, kstToIso } from "@/features/session/time"
import { createClient } from "@/lib/supabase/server"

import { parseInsightContent, type InsightContent } from "./content"
import { monthKeyOf, monthKeysBetween, monthRange } from "./period"
import type { InsightSourceLog } from "./prompt"

export type InsightStatus = "draft" | "published"

export type Insight = {
  id: string
  clubId: string
  scope: "session" | "period"
  // 회차를 정리한 것이면 그 Session, 기간을 정리한 것이면 null 이다.
  session: { id: string; title: string } | null
  periodStart: string | null
  periodEnd: string | null
  status: InsightStatus
  // 저장된 값의 모양이 틀렸으면 null 이다.
  content: InsightContent | null
  sourceLogIds: string[]
  provider: string
  model: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

// unavailable 은 데이터베이스에 AI Insight 의 구조가 아직 없다는 뜻이다.
export type InsightResult =
  | { status: "ok"; insight: Insight | null }
  | { status: "unavailable" }
  | { status: "error" }

export type InsightListResult =
  | { status: "ok"; insights: Insight[] }
  | { status: "unavailable" }
  | { status: "error" }

type InsightRow = {
  id: string
  club_id: string
  scope: "session" | "period"
  period_start: string | null
  period_end: string | null
  status: InsightStatus
  content: unknown
  source_log_ids: string[]
  provider: string
  model: string
  created_at: string
  updated_at: string
  published_at: string | null
  session: { id: string; title: string } | null
}

const INSIGHT_COLUMNS =
  "id, club_id, scope, period_start, period_end, status, content, source_log_ids, provider, model, created_at, updated_at, published_at, session:sessions!ai_insights_session_fkey(id, title)"

// 한 번에 읽는 AI Insight 수와 AI 에 보낼 기록 수의 한도.
const INSIGHT_LIST_LIMIT = 100
const SOURCE_LOG_LIMIT = 500
// 한 달 정리에서 거슬러 올라가 보여 주는 달의 수.
const LOG_MONTH_LIMIT = 24

// AI Log 가 있는 달과 그 달의 기록 수.
export type LogMonth = { month: string; logCount: number }

// 테이블이 아직 없을 때 돌아오는 오류. 데이터베이스가 내는 것과 API 가 내는 것 두 가지다.
function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

// 열이 아직 없을 때의 오류 번호.
const MISSING_COLUMN = "42703"

// 정리할 대상. 한 회차이거나 한 기간이다.
export type InsightLogTarget =
  | { sessionId: string }
  | { from: string; to: string }

function toInsight(row: InsightRow): Insight {
  return {
    id: row.id,
    clubId: row.club_id,
    scope: row.scope,
    session: row.session,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status,
    content: parseInsightContent(row.content),
    sourceLogIds: row.source_log_ids,
    provider: row.provider,
    model: row.model,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

// 한 회차를 정리한 AI Insight. 없으면 insight 가 null 이다.
// 초안은 운영자에게만, 공개된 것은 Member 에게 보인다. 그 판단은 데이터베이스의 접근 규칙이 한다.
export const getSessionInsight = cache(
  async (clubId: string, sessionId: string): Promise<InsightResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ai_insights")
      .select(INSIGHT_COLUMNS)
      .eq("club_id", clubId)
      .eq("scope", "session")
      .eq("session_id", sessionId)
      .maybeSingle()

    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("AI Insight 를 불러오지 못했습니다.", error)
      return { status: "error" }
    }
    return {
      status: "ok",
      insight: data ? toInsight(data as unknown as InsightRow) : null,
    }
  }
)

// 한 기간을 정리한 AI Insight. 없으면 insight 가 null 이다.
export const getPeriodInsight = cache(
  async (clubId: string, from: string, to: string): Promise<InsightResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ai_insights")
      .select(INSIGHT_COLUMNS)
      .eq("club_id", clubId)
      .eq("scope", "period")
      .eq("period_start", from)
      .eq("period_end", to)
      .maybeSingle()

    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("AI Insight 를 불러오지 못했습니다.", error)
      return { status: "error" }
    }
    return {
      status: "ok",
      insight: data ? toInsight(data as unknown as InsightRow) : null,
    }
  }
)

// 가장 최근에 공개된 AI Insight. 없으면 insight 가 null 이다. Club 개요에 쓴다.
export const getLatestPublishedInsight = cache(
  async (clubId: string): Promise<InsightResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ai_insights")
      .select(INSIGHT_COLUMNS)
      .eq("club_id", clubId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .range(0, 0)

    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("최근 AI Insight 를 불러오지 못했습니다.", error)
      return { status: "error" }
    }
    const row = (data as unknown as InsightRow[])[0]
    return { status: "ok", insight: row ? toInsight(row) : null }
  }
)

// Club 의 AI Insight 를 최근에 만든 순서로 읽는다.
export const listClubInsights = cache(
  async (clubId: string): Promise<InsightListResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ai_insights")
      .select(INSIGHT_COLUMNS)
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(0, INSIGHT_LIST_LIMIT - 1)

    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("AI Insight 목록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }
    return {
      status: "ok",
      insights: (data as unknown as InsightRow[]).map(toInsight),
    }
  }
)

// AI 에 보낼 기록을 남긴 순서대로 읽는다. 작성자는 읽지 않는다. 불러오지 못하면 null 이다.
// 회차를 주면 그 회차의 기록을, 기간을 주면 그 기간에 남긴 Club 의 기록을 읽는다.
// 작성자가 AI Insight 에 쓰지 말라고 한 기록은 읽지 않는다. 그 기록은 AI 로 나가지 않는다.
export async function listInsightSourceLogs(
  clubId: string,
  target: InsightLogTarget
): Promise<InsightSourceLog[] | null> {
  const supabase = await createClient()
  const read = (respectChoice: boolean) => {
    let query = supabase
      .from("ai_logs")
      .select("id, title, tools, attempt, result, learned, next_action")
      .eq("club_id", clubId)
    query =
      "sessionId" in target
        ? query.eq("session_id", target.sessionId)
        : query.gte("created_at", target.from).lt("created_at", target.to)
    if (respectChoice) {
      query = query.eq("exclude_from_insight", false)
    }

    // 한도를 넘으면 최근 것을 남기려고 최신순으로 읽은 뒤 뒤집는다.
    return query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(0, SOURCE_LOG_LIMIT - 1)
  }

  let response = await read(true)
  // 선택을 담는 열이 아직 없으면 빼 달라고 한 기록도 없으므로 모두 읽는다.
  if (response.error?.code === MISSING_COLUMN) {
    response = await read(false)
  }
  const { data, error } = response

  if (error) {
    console.error("AI Insight 에 쓸 AI Log 를 불러오지 못했습니다.", error)
    return null
  }

  return (
    data as {
      id: string
      title: string
      tools: string[]
      attempt: string
      result: string
      learned: string
      next_action: string
    }[]
  )
    .reverse()
    .map((row) => ({
      id: row.id,
      title: row.title,
      tools: row.tools,
      attempt: row.attempt,
      result: row.result,
      learned: row.learned,
      nextAction: row.next_action,
    }))
}

// 한 대상에서 정리에 쓸 수 있는 AI Log 수와, 작성자가 쓰지 말라고 한 기록 수. 세지 못하면 null 이다.
// 만들기 전에 몇 개를 보내는지 알릴 때와, 만든 뒤로 기록이 더 생겼는지 볼 때 쓴다.
export async function countInsightLogs(
  clubId: string,
  target: InsightLogTarget
): Promise<{ usable: number; excluded: number } | null> {
  const supabase = await createClient()
  const count = (onlyExcluded: boolean) => {
    let query = supabase
      .from("ai_logs")
      .select("id", { count: "exact" })
      .eq("club_id", clubId)
    query =
      "sessionId" in target
        ? query.eq("session_id", target.sessionId)
        : query.gte("created_at", target.from).lt("created_at", target.to)
    if (onlyExcluded) {
      query = query.eq("exclude_from_insight", true)
    }
    return query.range(0, 0)
  }

  const [all, excluded] = await Promise.all([count(false), count(true)])
  if (all.error || all.count === null) {
    console.error("정리에 쓸 AI Log 수를 세지 못했습니다.", all.error)
    return null
  }
  // 선택을 담는 열이 아직 없으면 빼 달라고 한 기록은 없다.
  if (excluded.error?.code === MISSING_COLUMN) {
    return { usable: all.count, excluded: 0 }
  }
  if (excluded.error || excluded.count === null) {
    console.error("AI Insight 에서 뺀 AI Log 수를 세지 못했습니다.", excluded.error)
    return null
  }
  return { usable: all.count - excluded.count, excluded: excluded.count }
}

// 오늘 이 Club 에서 AI Insight 를 만든 횟수. 하루는 한국 시간의 날짜로 나눈다. 운영자에게만 보인다.
// 횟수를 두는 구조가 아직 없거나 세지 못하면 null 이다. 그때는 남은 횟수를 보여 주지 않는다.
export async function countTodayInsightRuns(
  clubId: string,
  now: Date
): Promise<number | null> {
  const dayStart = kstToIso(kstDateKey(now), "00:00")
  if (!dayStart) {
    return null
  }

  const supabase = await createClient()
  const { error, count } = await supabase
    .from("ai_insight_runs")
    .select("id", { count: "exact" })
    .eq("club_id", clubId)
    .gte("created_at", dayStart)
    .range(0, 0)

  if (error) {
    if (!isMissingTable(error)) {
      console.error("오늘 AI Insight 를 만든 횟수를 세지 못했습니다.", error)
    }
    return null
  }
  return count
}

// 한 기간에 남긴 AI Log 수. 불러오지 못하면 null 이다.
export async function countPeriodLogs(
  clubId: string,
  from: string,
  to: string
): Promise<number | null> {
  const supabase = await createClient()
  const { error, count } = await supabase
    .from("ai_logs")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .gte("created_at", from)
    .lt("created_at", to)

  if (error) {
    console.error("기간의 AI Log 수를 세지 못했습니다.", error)
    return null
  }
  return count
}

// AI Log 가 하나라도 있는 달을 최근 달부터 돌려준다. 한 달 정리에서 고를 달이 된다. 불러오지 못하면 null 이다.
// 가장 오래된 기록이 든 달부터 이번 달까지를 달마다 세고, 기록이 없는 달은 뺀다. 달은 한국 시간으로 나눈다.
export async function listLogMonths(
  clubId: string,
  now: Date
): Promise<LogMonth[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_logs")
    .select("created_at")
    .eq("club_id", clubId)
    .order("created_at", { ascending: true })
    .range(0, 0)

  if (error) {
    console.error("가장 오래된 AI Log 를 불러오지 못했습니다.", error)
    return null
  }
  const first = (data as { created_at: string }[])[0]
  if (!first) {
    return []
  }

  const months = monthKeysBetween(
    monthKeyOf(first.created_at),
    monthKeyOf(now),
    LOG_MONTH_LIMIT
  )
  const counts = await Promise.all(
    months.map((month) => {
      const { start, end } = monthRange(month)
      return countPeriodLogs(clubId, start, end)
    })
  )
  if (counts.some((count) => count === null)) {
    return null
  }

  return months
    .map((month, index) => ({ month, logCount: counts[index] ?? 0 }))
    .filter((item) => item.logCount > 0)
}

// 근거로 달린 기록의 제목을 식별자로 묶어 읽는다. 지워진 기록은 들어 있지 않다.
export async function listLogTitles(
  clubId: string,
  logIds: string[]
): Promise<Record<string, string>> {
  if (logIds.length === 0) {
    return {}
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_logs")
    .select("id, title")
    .eq("club_id", clubId)
    .in("id", logIds)

  if (error) {
    console.error("근거 기록의 제목을 불러오지 못했습니다.", error)
    return {}
  }

  const titles: Record<string, string> = {}
  for (const row of data as { id: string; title: string }[]) {
    titles[row.id] = row.title
  }
  return titles
}
