import { cache } from "react"

import { memberName } from "@/features/member/name"
import { googleAvatarUrl } from "@/lib/google-avatar"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

export type AiLogAuthor = {
  userId: string
  name: string
  avatarUrl: string | null
}

export type AiLogSummary = {
  id: string
  clubId: string
  title: string
  attempt: string
  tools: string[]
  createdAt: string
  // 작성자가 Club 에서 빠졌으면 null 이다.
  author: AiLogAuthor | null
  // Session 없이 남긴 기록이면 null 이다.
  session: { id: string; title: string } | null
}

export type AiLog = AiLogSummary & {
  result: string
  learned: string
  nextAction: string
  updatedAt: string
}

export type AiLogListResult =
  | { status: "ok"; logs: AiLogSummary[]; total: number }
  | { status: "error" }

export type AiLogResult =
  | { status: "ok"; log: AiLog }
  | { status: "not-found" }
  | { status: "error" }

type SummaryRow = {
  id: string
  club_id: string
  title: string
  attempt: string
  tools: string[]
  created_at: string
  author_id: string | null
  session: { id: string; title: string } | null
  author: {
    display_name: string
    email: string | null
    avatar_url: string | null
  } | null
}

type DetailRow = SummaryRow & {
  result: string
  learned: string
  next_action: string
  updated_at: string
}

// Session 제목과 작성자 이름을 함께 읽는다. 어느 외래 키를 따라갈지 이름으로 정해 둔다.
const SUMMARY_COLUMNS =
  "id, club_id, title, attempt, tools, created_at, author_id, session:sessions!ai_logs_session_fkey(id, title), author:members!ai_logs_author_fkey(display_name, email, avatar_url)"
const DETAIL_COLUMNS = `${SUMMARY_COLUMNS}, result, learned, next_action, updated_at`

// 한 Session 에서 한 번에 읽는 기록 수. Member 수를 넘는 일이 드물어 넉넉히 둔다.
const SESSION_LOG_LIMIT = 200

function toSummary(row: SummaryRow): AiLogSummary {
  return {
    id: row.id,
    clubId: row.club_id,
    title: row.title,
    attempt: row.attempt,
    tools: row.tools,
    createdAt: row.created_at,
    author:
      row.author_id && row.author
        ? {
            userId: row.author_id,
            name: memberName(row.author),
            avatarUrl: googleAvatarUrl(row.author.avatar_url),
          }
        : null,
    session: row.session,
  }
}

// Club 의 AI Log 를 최신순으로 limit 개까지 읽는다. authorId 를 주면 그 사람이 쓴 것만 읽는다.
// 다른 Club 의 기록은 데이터베이스의 접근 규칙이 막는다.
export const listClubLogs = cache(
  async (
    clubId: string,
    limit: number,
    authorId: string | null
  ): Promise<AiLogListResult> => {
    const supabase = await createClient()
    let query = supabase
      .from("ai_logs")
      .select(SUMMARY_COLUMNS, { count: "exact" })
      .eq("club_id", clubId)
    if (authorId) {
      query = query.eq("author_id", authorId)
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(0, limit - 1)

    if (error) {
      console.error("AI Log 목록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const logs = (data as unknown as SummaryRow[]).map(toSummary)
    return { status: "ok", logs, total: count ?? logs.length }
  }
)

// 기록 수만 센다. 불러오지 못하면 null 이다.
export const countClubLogs = cache(
  async (clubId: string, authorId: string | null): Promise<number | null> => {
    const supabase = await createClient()
    let query = supabase
      .from("ai_logs")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
    if (authorId) {
      query = query.eq("author_id", authorId)
    }

    const { error, count } = await query
    if (error) {
      console.error("AI Log 수를 세지 못했습니다.", error)
      return null
    }
    return count
  }
)

// 한 Session 의 AI Log 를 최신순으로 읽는다.
export const listSessionLogs = cache(
  async (clubId: string, sessionId: string): Promise<AiLogListResult> => {
    const supabase = await createClient()
    const { data, error, count } = await supabase
      .from("ai_logs")
      .select(SUMMARY_COLUMNS, { count: "exact" })
      .eq("club_id", clubId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .range(0, SESSION_LOG_LIMIT - 1)

    if (error) {
      console.error("Session 의 AI Log 를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const logs = (data as unknown as SummaryRow[]).map(toSummary)
    return { status: "ok", logs, total: count ?? logs.length }
  }
)

export const getAiLog = cache(
  async (clubId: string, logId: string): Promise<AiLogResult> => {
    if (!isUuid(logId)) {
      return { status: "not-found" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ai_logs")
      .select(DETAIL_COLUMNS)
      .eq("club_id", clubId)
      .eq("id", logId)
      .maybeSingle()

    if (error) {
      console.error("AI Log 를 불러오지 못했습니다.", error)
      return { status: "error" }
    }
    if (!data) {
      return { status: "not-found" }
    }

    const row = data as unknown as DetailRow
    return {
      status: "ok",
      log: {
        ...toSummary(row),
        result: row.result,
        learned: row.learned,
        nextAction: row.next_action,
        updatedAt: row.updated_at,
      },
    }
  }
)
