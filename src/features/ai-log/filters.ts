import { isUuid } from "@/lib/uuid"

import { AI_LOG_PAGE_SIZE, logLimit } from "./paging"

// 찾는 글자의 최대 길이.
export const AI_LOG_SEARCH_MAX = 100
// Session 을 고르는 칸에서 "Session 없는 기록" 을 뜻하는 값.
export const NO_SESSION = "none"

export type AiLogSort = "newest" | "oldest"

// AI Log 목록을 걸러 보는 조건. 모두 주소의 값에서 온다.
export type AiLogFilters = {
  view: "all" | "mine"
  // 제목, 내용, 도구 이름에서 찾을 글자. 비어 있으면 찾지 않는다.
  query: string
  // Session 의 식별자이거나 NO_SESSION. 고르지 않았으면 null 이다.
  session: string | null
  tool: string | null
  sort: AiLogSort
  limit: number
}

type Params = Record<string, string | string[] | undefined>

function text(value: string | string[] | undefined) {
  return typeof value === "string" ? value.trim() : ""
}

// 주소의 값을 조건으로 바꾼다. 형식이 틀린 값은 고르지 않은 것으로 본다.
export function parseLogFilters(params: Params): AiLogFilters {
  const session = text(params.session)
  const tool = text(params.tool)

  return {
    view: params.view === "mine" ? "mine" : "all",
    query: Array.from(text(params.q)).slice(0, AI_LOG_SEARCH_MAX).join(""),
    session: session === NO_SESSION || isUuid(session) ? session : null,
    tool: tool || null,
    sort: params.sort === "oldest" ? "oldest" : "newest",
    limit: logLimit(params.n),
  }
}

// 찾는 글자나 고른 조건이 하나라도 있는지. 정렬과 보기는 조건으로 치지 않는다.
export function isFiltered(filters: AiLogFilters) {
  return Boolean(filters.query || filters.session || filters.tool)
}

// 조건을 주소로 바꾼다. 기본값은 주소에 적지 않는다.
export function logsHref(
  clubId: string,
  filters: AiLogFilters,
  overrides: Partial<AiLogFilters> = {}
) {
  const next = { ...filters, ...overrides }
  const params = new URLSearchParams()

  if (next.view === "mine") params.set("view", "mine")
  if (next.query) params.set("q", next.query)
  if (next.session) params.set("session", next.session)
  if (next.tool) params.set("tool", next.tool)
  if (next.sort === "oldest") params.set("sort", "oldest")
  if (next.limit > AI_LOG_PAGE_SIZE) params.set("n", String(next.limit))

  const search = params.toString()
  return `/clubs/${clubId}/logs${search ? `?${search}` : ""}`
}

// 조건을 모두 지운 주소. 보기와 정렬은 남긴다.
export function clearedLogsHref(clubId: string, filters: AiLogFilters) {
  return logsHref(clubId, filters, {
    query: "",
    session: null,
    tool: null,
    limit: AI_LOG_PAGE_SIZE,
  })
}
