import Link from "next/link"

import { cn } from "@/lib/utils"

import { logsHref, type AiLogFilters } from "../filters"
import { AI_LOG_PAGE_SIZE } from "../paging"
import type { SessionLogCount } from "../queries"
import { toolKey } from "../tool-key"
import { ToolChip } from "./tool-chips"

// 요약에 보여 주는 줄 수.
const SUMMARY_LIMIT = 5

const ROW =
  "flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"

export type AiLogSummaryData = {
  // 많이 쓰인 순서의 도구.
  tools: { name: string; logCount: number }[]
  // 최근 회차부터 놓인 Session.
  sessions: SessionLogCount[]
}

function shownTools(summary: AiLogSummaryData) {
  return summary.tools.slice(0, SUMMARY_LIMIT)
}

// 기록이 하나도 없는 Session 은 요약에 넣지 않는다.
function shownSessions(summary: AiLogSummaryData) {
  return summary.sessions
    .filter((session) => session.logCount > 0)
    .slice(0, SUMMARY_LIMIT)
}

// 요약에 보여 줄 것이 있는지. 없으면 목록이 화면 폭을 다 쓴다.
export function hasAiLogSummary(summary: AiLogSummaryData) {
  return shownTools(summary).length > 0 || shownSessions(summary).length > 0
}

// AI Log 목록 옆에 놓는 요약. 자주 쓴 도구와 Session 별 기록 수를 보여 주고, 누르면 그 조건으로 목록을 고른다.
// 수는 Club 전체 기준이라서 누르면 전체 보기로 옮겨 간다. 보여 줄 것이 없으면 아무것도 그리지 않는다.
export function AiLogSideSummary({
  clubId,
  filters,
  summary,
}: {
  clubId: string
  filters: AiLogFilters
  summary: AiLogSummaryData
}) {
  const tools = shownTools(summary)
  const sessions = shownSessions(summary)
  if (tools.length === 0 && sessions.length === 0) {
    return null
  }

  // 요약에서 고르면 다른 조건은 지우고 그 하나만 건다.
  const pick = (condition: Partial<AiLogFilters>) =>
    logsHref(clubId, filters, {
      view: "all",
      query: "",
      session: null,
      tool: null,
      limit: AI_LOG_PAGE_SIZE,
      ...condition,
    })

  return (
    <aside className="flex flex-col gap-6">
      {tools.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border bg-card p-5">
          <h2 className="text-h4">자주 쓴 도구</h2>
          <ul className="-mx-2 flex flex-col">
            {tools.map((tool) => {
              const active =
                filters.tool !== null &&
                toolKey(filters.tool) === toolKey(tool.name)

              return (
                <li key={tool.name}>
                  <Link
                    href={pick({ tool: tool.name })}
                    aria-current={active ? "true" : undefined}
                    className={cn(ROW, active && "bg-accent")}
                  >
                    <ToolChip tool={tool.name} />
                    <span className="text-body-s text-muted-foreground">
                      {tool.logCount}개
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {sessions.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border bg-card p-5">
          <h2 className="text-h4">Session 별 기록</h2>
          <ul className="-mx-2 flex flex-col">
            {sessions.map((session) => {
              const active = filters.session === session.id

              return (
                <li key={session.id}>
                  <Link
                    href={pick({ session: session.id })}
                    aria-current={active ? "true" : undefined}
                    className={cn(ROW, active && "bg-accent")}
                  >
                    <span className="min-w-0 truncate text-body-s">
                      {session.title}
                    </span>
                    <span className="shrink-0 text-body-s text-muted-foreground">
                      {session.logCount}개
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </aside>
  )
}
