import Link from "next/link"
import {
  Calendar,
  CalendarRange,
  CircleAlert,
  Info,
  RefreshCw,
  Sparkles,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatLogDate } from "@/features/ai-log/format"

import { monthKeyOf, monthLabel } from "../period"
import type { Insight, InsightListResult, LogMonth } from "../queries"

function insightHref(clubId: string, insight: Insight) {
  return insight.session
    ? `/clubs/${clubId}/sessions/${insight.session.id}/insight`
    : `/clubs/${clubId}/insights/${monthKeyOf(insight.periodStart ?? insight.createdAt)}`
}

function InsightCard({
  clubId,
  insight,
  canManage,
  now,
}: {
  clubId: string
  insight: Insight
  canManage: boolean
  now: Date
}) {
  const period = insight.scope === "period"
  const Icon = period ? CalendarRange : Calendar
  const title = period
    ? monthLabel(monthKeyOf(insight.periodStart ?? insight.createdAt))
    : (insight.session?.title ?? "Session")

  return (
    <Link
      href={insightHref(clubId, insight)}
      className="flex flex-col gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-input focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Icon
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-3.5 shrink-0 text-icon-subtle"
          />
          {period ? "한 달 정리" : "Session 정리"} · AI Log{" "}
          {insight.sourceLogIds.length}개 ·{" "}
          {formatLogDate(insight.updatedAt, now)}
        </p>
        {canManage && (
          <Badge tone={insight.status === "published" ? "success" : "warning"}>
            {insight.status === "published" ? "공개됨" : "초안"}
          </Badge>
        )}
      </div>
      <h3 className="text-h4">{title}</h3>
      <p className="line-clamp-2 text-muted-foreground">
        {insight.content?.overview ||
          "요약이 없습니다. 열어서 항목을 확인해 주세요."}
      </p>
    </Link>
  )
}

// Club 의 AI Insight 를 모아 보는 화면. 구성원에게는 공개된 것만, 운영자에게는 초안까지 보인다.
// 운영자에게는 한 달 정리를 만들 달을 고르는 줄이 함께 보인다. months 는 AI Log 가 실제로 있는 달이고, null 이면 불러오지 못한 것이다.
export function InsightListScreen({
  clubId,
  canManage,
  result,
  months,
  now,
}: {
  clubId: string
  canManage: boolean
  result: InsightListResult
  months: LogMonth[] | null
  now: Date
}) {
  const base = `/clubs/${clubId}/insights`
  const insights = result.status === "ok" ? result.insights : []
  // 달마다 한 달 정리가 있는지와 그 상태.
  const periodStatus = new Map(
    insights
      .filter((insight) => insight.scope === "period" && insight.periodStart)
      .map((insight) => [monthKeyOf(insight.periodStart!), insight.status])
  )

  return (
    <>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-h1">AI Insight</h1>
        <p className="text-muted-foreground">
          AI 가 AI Log 를 읽고 반복된 주제, 배운 점, 다음 행동을 정리한
          내용입니다. 운영자가 확인해 공개한 것만 Member 에게 보입니다.
        </p>
      </div>
      {result.status === "unavailable" ? (
        <Alert tone="info">
          <Info aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>AI Insight 를 아직 쓸 수 없습니다</AlertTitle>
          <AlertDescription>
            {canManage
              ? "데이터베이스에 AI Insight 의 구조가 아직 없습니다. 최신 마이그레이션을 적용하면 여기에서 만들 수 있습니다."
              : "준비가 끝나면 운영자가 정리한 내용이 여기에 보입니다."}
          </AlertDescription>
        </Alert>
      ) : result.status === "error" ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <CircleAlert strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>AI Insight 를 불러오지 못했습니다</EmptyTitle>
              <EmptyDescription>
                연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해
                주세요.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href={base} className={buttonVariants({ variant: "outline" })}>
                <RefreshCw aria-hidden="true" strokeWidth={1.5} />
                다시 시도
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          {canManage && (
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-h4">한 달 정리</h2>
                <p className="text-body-s text-muted-foreground">
                  AI Log 가 있는 달을 고르면 그 달에 남긴 Club 의 기록을
                  한꺼번에 정리할 수 있습니다. 한 회차의 정리는 Session 의 AI
                  Insight 탭에서 만듭니다.
                </p>
              </div>
              {months === null ? (
                <p className="text-body-s text-muted-foreground">
                  AI Log 가 있는 달을 불러오지 못했습니다. 잠시 뒤 다시 열어
                  주세요.
                </p>
              ) : months.length === 0 ? (
                <p className="text-body-s text-muted-foreground">
                  아직 AI Log 가 없습니다. 기록이 쌓이면 여기에서 달을 골라
                  정리할 수 있습니다.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {months.map(({ month, logCount }) => {
                    const status = periodStatus.get(month)

                    return (
                      <li key={month}>
                        <Link
                          href={`${base}/${month}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          {monthLabel(month)}
                          <span className="text-caption text-muted-foreground">
                            AI Log {logCount}개
                            {status &&
                              ` · ${status === "published" ? "공개됨" : "초안"}`}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}
          {insights.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {insights.map((insight) => (
                <li key={insight.id}>
                  <InsightCard
                    clubId={clubId}
                    insight={insight}
                    canManage={canManage}
                    now={now}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border bg-card">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia>
                    <Sparkles strokeWidth={1.5} />
                  </EmptyMedia>
                  <EmptyTitle>
                    {canManage
                      ? "아직 AI Insight 가 없습니다"
                      : "아직 공개된 AI Insight 가 없습니다"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {canManage
                      ? "위에서 달을 골라 한 달 정리를 만들거나, Session 의 AI Insight 탭에서 그 회차의 정리를 만들어 보세요."
                      : "운영자가 AI Log 를 정리해서 공개하면 여기에 보입니다."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </>
      )}
    </>
  )
}
