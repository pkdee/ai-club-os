import Link from "next/link"
import { CircleAlert, FileText, RefreshCw, SearchX } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { LinkTabs } from "@/components/ui/link-tabs"
import { cn } from "@/lib/utils"

import {
  clearedLogsHref,
  isFiltered,
  logsHref,
  type AiLogFilters,
} from "../filters"
import { AI_LOG_LIMIT_MAX, AI_LOG_PAGE_SIZE } from "../paging"
import type { AiLogListResult } from "../queries"
import { AiLogCardList } from "./ai-log-card"
import { AiLogFilterBar } from "./ai-log-filter-bar"
import {
  AiLogSideSummary,
  hasAiLogSummary,
  type AiLogSummaryData,
} from "./ai-log-side-summary"
import { WriteLogLink } from "./write-log-link"

// counts 는 조건을 걸지 않았을 때의 전체 수와 내가 쓴 수다. 값이 null 이면 세지 못한 것이다.
// sessions 와 tools 는 고르는 칸에 넣을 목록이고, summary 는 목록 옆에 놓는 요약이다.
export function AiLogListScreen({
  clubId,
  filters,
  result,
  counts,
  sessions,
  tools,
  summary,
  now,
}: {
  clubId: string
  filters: AiLogFilters
  result: AiLogListResult
  counts: { all: number | null; mine: number | null }
  sessions: { id: string; title: string }[]
  tools: string[]
  summary: AiLogSummaryData
  now: Date
}) {
  const mine = filters.view === "mine"
  const filtered = isFiltered(filters)
  const logs = result.status === "ok" ? result.logs : []
  const total = result.status === "ok" ? result.total : 0
  const firstPage = { limit: AI_LOG_PAGE_SIZE }
  const clearHref = clearedLogsHref(clubId, filters)
  const writeLink = <WriteLogLink clubId={clubId} />
  // 기록이 하나도 없는 Club 에서는 찾을 것이 없으므로 찾는 칸을 감춘다.
  const hasAnyLog = counts.all !== 0 || filtered
  const showSummary = hasAnyLog && hasAiLogSummary(summary)

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1">AI Log</h1>
          <p className="text-muted-foreground">
            구성원이 남긴 AI 활용 기록입니다. 원본 기록은 언제든 다시 볼 수
            있습니다.
          </p>
        </div>
        {(logs.length > 0 || filtered) && writeLink}
      </div>
      <LinkTabs
        label="AI Log 보기"
        tabs={[
          {
            href: logsHref(clubId, filters, { view: "all", ...firstPage }),
            label: "전체",
            count: counts.all,
            active: !mine,
          },
          {
            href: logsHref(clubId, filters, { view: "mine", ...firstPage }),
            label: "내가 쓴 기록",
            count: counts.mine,
            active: mine,
          },
        ]}
      />
      {/* 좁은 화면에서는 요약이 목록 아래로 내려간다. */}
      <div
        className={cn(
          "grid grid-cols-1 items-start gap-6",
          showSummary && "xl:grid-cols-[minmax(0,1fr)_20rem]"
        )}
      >
        <div className="flex min-w-0 flex-col gap-6">
          {hasAnyLog && (
            <AiLogFilterBar
              // 주소가 바뀌면 칸의 값도 주소에 맞게 다시 채운다.
              key={logsHref(clubId, filters, firstPage)}
              clubId={clubId}
              filters={filters}
              sessions={sessions}
              tools={tools}
            />
          )}
          {result.status === "error" ? (
            <div className="rounded-xl border bg-card">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <CircleAlert strokeWidth={1.5} />
                  </EmptyMedia>
                  <EmptyTitle>AI Log 를 불러오지 못했습니다</EmptyTitle>
                  <EmptyDescription>
                    연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해
                    주세요.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link
                    href={logsHref(clubId, filters)}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <RefreshCw aria-hidden="true" strokeWidth={1.5} />
                    다시 시도
                  </Link>
                </EmptyContent>
              </Empty>
            </div>
          ) : logs.length === 0 && filtered ? (
            <div className="rounded-xl border bg-card">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <SearchX strokeWidth={1.5} />
                  </EmptyMedia>
                  <EmptyTitle>조건에 맞는 기록이 없습니다</EmptyTitle>
                  <EmptyDescription>
                    찾는 글자를 줄이거나 고른 조건을 지워 보세요.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link
                    href={clearHref}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    조건 지우기
                  </Link>
                </EmptyContent>
              </Empty>
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-xl border bg-card">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <FileText strokeWidth={1.5} />
                  </EmptyMedia>
                  <EmptyTitle>
                    {mine ? "아직 내가 쓴 기록이 없습니다" : "아직 AI Log 가 없습니다"}
                  </EmptyTitle>
                  <EmptyDescription>
                    오늘 써 본 도구와 시도한 내용을 짧게 남겨 보세요. 완성된 글이
                    아니어도 됩니다.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>{writeLink}</EmptyContent>
              </Empty>
            </div>
          ) : (
            <>
              {filtered && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p role="status" className="text-body-s text-muted-foreground">
                    조건에 맞는 기록 {total}개
                  </p>
                  <Link
                    href={clearHref}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    조건 지우기
                  </Link>
                </div>
              )}
              <AiLogCardList logs={logs} now={now} />
              {total > logs.length &&
                (filters.limit < AI_LOG_LIMIT_MAX ? (
                  <Link
                    href={logsHref(clubId, filters, {
                      limit: filters.limit + AI_LOG_PAGE_SIZE,
                    })}
                    scroll={false}
                    className={buttonVariants({
                      variant: "outline",
                      className: "self-center",
                    })}
                  >
                    더 보기
                  </Link>
                ) : (
                  <p className="text-center text-body-s text-muted-foreground">
                    {AI_LOG_LIMIT_MAX}개까지 보여 줍니다. 모두 {total}개입니다. 찾는
                    글자나 조건으로 좁혀 보세요.
                  </p>
                ))}
            </>
          )}
        </div>
        {showSummary && (
          <AiLogSideSummary clubId={clubId} filters={filters} summary={summary} />
        )}
      </div>
    </>
  )
}
