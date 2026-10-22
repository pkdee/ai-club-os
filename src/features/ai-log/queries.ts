import { cache } from "react"

import { memberName } from "@/features/member/name"
import { googleAvatarUrl } from "@/lib/google-avatar"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import { NO_SESSION, type AiLogFilters } from "./filters"
import type { AiLogRevision } from "./revisions"
import type { ToolSpelling } from "./tool-merge"
import { expandSearch, mergeToolCounts, toolFilterValue } from "./tool-catalog"

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
  // 어느 Project 에도 묶지 않은 기록이면 null 이다.
  project: { id: string; name: string } | null
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

export type ClubToolsResult =
  | { status: "ok"; tools: { name: string; logCount: number }[] }
  | { status: "error" }

export type SessionLogCount = { id: string; title: string; logCount: number }

export type SessionLogCountsResult =
  | { status: "ok"; sessions: SessionLogCount[] }
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
  // Project 연결이 아직 없는 데이터베이스에서 읽으면 이 값이 없다.
  project?: { id: string; name: string } | null
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
// 묶인 Project 의 이름. ai_logs 에 Project 연결이 생긴 뒤에만 읽을 수 있다.
const PROJECT_EMBED = ", project:projects!ai_logs_project_fkey(id, name)"

// 나중에 더해진 것이 아직 없을 때 돌아오는 오류. 관계를 찾지 못했거나 열이 없다는 것이다.
function isMissingAddition(error: { code?: string }) {
  return error.code === "PGRST200" || error.code === "42703"
}

// additions 를 모두 붙여 읽어 보고, 아직 없는 것이 있으면 늦게 더해진 것부터 하나씩 빼고 다시 읽는다.
// 사용자가 마이그레이션을 적용하기 전에도 기록 화면이 멈추지 않게 하려는 것이다.
async function readWithAdditions<T extends { error: { code?: string } | null }>(
  additions: string[],
  read: (columns: string) => PromiseLike<T>
): Promise<T> {
  for (let count = additions.length; count > 0; count--) {
    const response = await read(additions.slice(0, count).join(""))
    if (!(response.error && isMissingAddition(response.error))) {
      return response
    }
  }
  return read("")
}

// 먼저 Project 와 함께 읽고, 연결이 아직 없으면 Project 없이 다시 읽는다.
function readWithProject<T extends { error: { code?: string } | null }>(
  read: (project: string) => PromiseLike<T>
): Promise<T> {
  return readWithAdditions([PROJECT_EMBED], read)
}

// 한 Session 이나 한 Project 에서 한 번에 읽는 기록 수. 넉넉히 둔다.
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
    project: row.project ?? null,
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
    const { data, error, count } = await readWithProject((project) => {
      let query = supabase
        .from("ai_logs")
        .select(SUMMARY_COLUMNS + project, { count: "exact" })
        .eq("club_id", clubId)
      if (authorId) {
        query = query.eq("author_id", authorId)
      }

      return query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, limit - 1)
    })

    if (error) {
      console.error("AI Log 목록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const logs = (data as unknown as SummaryRow[]).map(toSummary)
    return { status: "ok", logs, total: count ?? logs.length }
  }
)

// 걸러 보기에 쓰는 조건들. 조회와 함수 호출 양쪽에 같은 조건을 걸려고 필요한 것만 적는다.
type Filterable = {
  eq(column: string, value: string): Filterable
  is(column: string, value: null): Filterable
}

// 조건을 건 뒤에도 원래 모양 그대로 이어 쓸 수 있게 받은 형식으로 돌려준다.
function applyConditions<T>(
  builder: T,
  filters: AiLogFilters,
  userId: string
): T {
  let next = builder as unknown as Filterable
  if (filters.view === "mine") {
    next = next.eq("author_id", userId)
  }
  if (filters.session === NO_SESSION) {
    next = next.is("session_id", null)
  } else if (filters.session) {
    next = next.eq("session_id", filters.session)
  }
  return next as unknown as T
}

// 조건에 맞는 AI Log 를 읽는다. 찾는 글자나 도구가 있으면 데이터베이스의 search_ai_logs 함수가 찾는다.
// 이 함수는 띄어쓰기와 대소문자의 차이를 넘어 찾는다. 사용자가 넣은 글자를 조건 문자열에 끼워 넣지 않고
// 함수의 값으로 넘기므로, 어떤 글자를 넣어도 조건이 깨지지 않는다.
export async function searchClubLogs(
  clubId: string,
  filters: AiLogFilters,
  userId: string
): Promise<AiLogListResult> {
  const supabase = await createClient()
  const ascending = filters.sort === "oldest"

  // search 와 tool 은 함수에 넘길 값이다. 둘 다 비어 있으면 함수를 거치지 않고 바로 읽는다.
  function read(search: string, tool: string | null) {
    return readWithProject((project) => {
      const selected =
        search || tool
          ? applyConditions(
              supabase.rpc(
                "search_ai_logs",
                { target_club_id: clubId, search, tool_name: tool },
                { count: "exact" }
              ),
              filters,
              userId
            ).select(SUMMARY_COLUMNS + project)
          : applyConditions(
              supabase
                .from("ai_logs")
                .select(SUMMARY_COLUMNS + project, { count: "exact" })
                .eq("club_id", clubId),
              filters,
              userId
            )

      // 같은 시각에 만든 기록끼리도 순서가 바뀌지 않게 식별자로 한 번 더 정렬한다. 더 보기에서 빠지거나 겹치지 않게 하려는 것이다.
      return selected
        .order("created_at", { ascending })
        .order("id", { ascending })
        .range(0, filters.limit - 1)
    })
  }

  // 도구를 가리키는 말은 그 도구의 다른 표기까지 함께 찾도록 넓혀서 넘긴다.
  const widenedSearch = expandSearch(filters.query)
  const widenedTool = filters.tool ? toolFilterValue(filters.tool) : null
  let response = await read(widenedSearch, widenedTool)

  // 넓힌 값으로 아무것도 나오지 않으면 적은 그대로 한 번 더 찾는다.
  // 데이터베이스의 검색 함수가 여러 표기를 받도록 바뀌기 전이면 넓힌 값이 글자 그대로 읽혀 결과가 빈다.
  // 그 상태에서도 검색이 멈추지 않게 하려는 것이다. 함수가 바뀐 뒤에는 대부분 같은 빈 결과가 돌아온다.
  const widened =
    widenedSearch !== filters.query || widenedTool !== filters.tool
  if (!response.error && widened && (response.count ?? 0) === 0) {
    response = await read(filters.query, filters.tool)
  }

  const { data, error, count } = response
  if (error) {
    console.error("AI Log 를 찾지 못했습니다.", error.code, error.message)
    return { status: "error" }
  }

  const logs = (data as unknown as SummaryRow[]).map(toSummary)
  return { status: "ok", logs, total: count ?? logs.length }
}

// Club 의 AI Log 에 쓰인 도구 이름을 많이 쓰인 순서로 읽는다. 표기만 다른 이름은 하나로 합쳐져 온다.
// 도구로 고르는 칸과, 쓸 때 표기를 맞추는 데 쓴다.
export const listClubTools = cache(
  async (clubId: string): Promise<ClubToolsResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("club_tool_counts", {
      target_club_id: clubId,
    })

    if (error) {
      console.error("도구 목록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    // 널리 쓰는 도구는 정해 둔 표기로 보여 주고, 그래서 같은 도구가 된 것은 합친다.
    return {
      status: "ok",
      tools: mergeToolCounts(
        (data as { tool: string; log_count: number }[]).map((row) => ({
          name: row.tool,
          logCount: row.log_count,
        }))
      ),
    }
  }
)

// Session 마다 달린 AI Log 수를 최근 회차부터 읽는다. 기록이 없는 Session 도 0 으로 들어 있다.
// 날짜를 정하지 않은 회차는 쓰기 화면의 Session 고르기처럼 맨 뒤에 둔다.
// Session 으로 고르는 칸과 목록 옆의 요약이 함께 쓴다.
export const listSessionLogCounts = cache(
  async (clubId: string): Promise<SessionLogCountsResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sessions")
      .select("id, title, ai_logs!ai_logs_session_fkey(count)")
      .eq("club_id", clubId)
      .order("starts_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Session 별 AI Log 수를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return {
      status: "ok",
      sessions: (
        data as unknown as {
          id: string
          title: string
          ai_logs: { count: number }[]
        }[]
      ).map((row) => ({
        id: row.id,
        title: row.title,
        logCount: row.ai_logs[0]?.count ?? 0,
      })),
    }
  }
)

// Member 마다 쓴 AI Log 수를 사용자 식별자로 묶어 읽는다. 불러오지 못하면 null 이다.
// Club 에서 빠진 사람의 기록은 작성자가 비어 있어 여기에 들어가지 않는다.
export const countLogsByAuthor = cache(
  async (clubId: string): Promise<Record<string, number> | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("members")
      .select("user_id, ai_logs!ai_logs_author_fkey(count)")
      .eq("club_id", clubId)

    if (error) {
      console.error("Member 별 AI Log 수를 불러오지 못했습니다.", error)
      return null
    }

    const counts: Record<string, number> = {}
    for (const row of data as unknown as {
      user_id: string
      ai_logs: { count: number }[]
    }[]) {
      counts[row.user_id] = row.ai_logs[0]?.count ?? 0
    }
    return counts
  }
)

// 기록 수만 센다. 불러오지 못하면 null 이다.
// authorId 를 주면 그 사람이 쓴 것만, since 를 주면 그 시각부터 남긴 것만 센다.
export const countClubLogs = cache(
  async (
    clubId: string,
    authorId: string | null,
    since: string | null = null
  ): Promise<number | null> => {
    const supabase = await createClient()
    let query = supabase
      .from("ai_logs")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
    if (authorId) {
      query = query.eq("author_id", authorId)
    }
    if (since) {
      query = query.gte("created_at", since)
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
    const { data, error, count } = await readWithProject((project) =>
      supabase
        .from("ai_logs")
        .select(SUMMARY_COLUMNS + project, { count: "exact" })
        .eq("club_id", clubId)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, SESSION_LOG_LIMIT - 1)
    )

    if (error) {
      console.error("Session 의 AI Log 를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const logs = (data as unknown as SummaryRow[]).map(toSummary)
    return { status: "ok", logs, total: count ?? logs.length }
  }
)

// 한 Project 에 묶인 AI Log 를 최신순으로 읽는다.
export const listProjectLogs = cache(
  async (clubId: string, projectId: string): Promise<AiLogListResult> => {
    const supabase = await createClient()
    const { data, error, count } = await supabase
      .from("ai_logs")
      .select(SUMMARY_COLUMNS + PROJECT_EMBED, { count: "exact" })
      .eq("club_id", clubId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(0, SESSION_LOG_LIMIT - 1)

    if (error) {
      console.error("Project 의 AI Log 를 불러오지 못했습니다.", error)
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
    const { data, error } = await readWithAdditions(
      [PROJECT_EMBED],
      (additions) =>
        supabase
          .from("ai_logs")
          .select(DETAIL_COLUMNS + additions)
          .eq("club_id", clubId)
          .eq("id", logId)
          .maybeSingle()
    )

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

// 고치기 전의 내용을 수정 기록으로 남기는 구조가 있는지 본다. 쓰는 화면이 그 사실을 알릴지 정하는 데 쓴다.
// 확인하지 못하면 없는 것으로 본다.
export const keepsAiLogRevisions = cache(async (): Promise<boolean> => {
  const supabase = await createClient()
  const { error } = await supabase.from("ai_log_revisions").select("id").limit(1)

  return !error
})

// unavailable 은 데이터베이스에 수정 기록을 두는 구조가 아직 없다는 뜻이다.
export type AiLogRevisionsResult =
  | { status: "ok"; revisions: AiLogRevision[] }
  | { status: "unavailable" }
  | { status: "error" }

// 한 기록의 수정 기록을 최근에 남은 것부터 읽는다.
// 그 기록의 작성자와 운영자에게만 보이고, 다른 Member 에게는 빈 목록이 돌아온다.
export const listAiLogRevisions = cache(
  async (clubId: string, logId: string): Promise<AiLogRevisionsResult> => {
    if (!isUuid(logId)) {
      return { status: "ok", revisions: [] }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ai_log_revisions")
      .select("id, title, tools, attempt, result, learned, next_action, replaced_at")
      .eq("club_id", clubId)
      .eq("log_id", logId)
      .order("replaced_at", { ascending: false })
      .order("id", { ascending: false })

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        return { status: "unavailable" }
      }
      console.error("AI Log 의 수정 기록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return {
      status: "ok",
      revisions: (
        data as {
          id: string
          title: string
          tools: string[]
          attempt: string
          result: string
          learned: string
          next_action: string
          replaced_at: string
        }[]
      ).map((row) => ({
        id: row.id,
        title: row.title,
        tools: row.tools,
        attempt: row.attempt,
        result: row.result,
        learned: row.learned,
        nextAction: row.next_action,
        replacedAt: row.replaced_at,
      })),
    }
  }
)

// unavailable 은 데이터베이스에 도구 표기를 세는 함수가 아직 없다는 뜻이다.
export type ToolSpellingsResult =
  | { status: "ok"; spellings: ToolSpelling[] }
  | { status: "unavailable" }
  | { status: "error" }

// 이 Club 의 기록에 쓰인 도구 이름을 적힌 그대로, 많이 쓴 순서로 읽는다.
// listClubTools 와 달리 표기만 다른 이름을 합치지 않는다. 같은 도구의 다른 표기를 찾아 합칠 때 쓴다.
export const listToolSpellings = cache(
  async (clubId: string): Promise<ToolSpellingsResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("club_tool_spellings", {
      target_club_id: clubId,
    })

    if (error) {
      if (error.code === "PGRST202" || error.code === "42883") {
        return { status: "unavailable" }
      }
      console.error("도구 표기를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return {
      status: "ok",
      spellings: (data as { tool: string; log_count: number }[]).map((row) => ({
        tool: row.tool,
        logCount: Number(row.log_count),
      })),
    }
  }
)
