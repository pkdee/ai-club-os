import Link from "next/link"
import { CircleAlert, FileText, RefreshCw } from "lucide-react"

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

import { AI_LOG_LIMIT_MAX, AI_LOG_PAGE_SIZE } from "../paging"
import type { AiLogListResult } from "../queries"
import { AiLogCardList } from "./ai-log-card"
import { WriteLogLink } from "./write-log-link"

// view 가 mine 이면 내가 쓴 기록만 보는 중이다. counts 의 값이 null 이면 그 수를 세지 못한 것이다.
export function AiLogListScreen({
  clubId,
  view,
  result,
  counts,
  limit,
  now,
}: {
  clubId: string
  view: "all" | "mine"
  result: AiLogListResult
  counts: { all: number | null; mine: number | null }
  limit: number
  now: Date
}) {
  const base = `/clubs/${clubId}/logs`
  const mine = view === "mine"
  const viewHref = mine ? `${base}?view=mine` : base
  const logs = result.status === "ok" ? result.logs : []
  const total = result.status === "ok" ? result.total : 0
  const moreHref = `${base}?${mine ? "view=mine&" : ""}n=${limit + AI_LOG_PAGE_SIZE}`
  const writeLink = <WriteLogLink clubId={clubId} />

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
        {logs.length > 0 && writeLink}
      </div>
      <LinkTabs
        label="AI Log 보기"
        tabs={[
          { href: base, label: "전체", count: counts.all, active: !mine },
          {
            href: `${base}?view=mine`,
            label: "내가 쓴 기록",
            count: counts.mine,
            active: mine,
          },
        ]}
      />
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
                href={viewHref}
                className={buttonVariants({ variant: "outline" })}
              >
                <RefreshCw aria-hidden="true" strokeWidth={1.5} />
                다시 시도
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
          <AiLogCardList logs={logs} now={now} />
          {total > logs.length &&
            (limit < AI_LOG_LIMIT_MAX ? (
              <Link
                href={moreHref}
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
                최근 {AI_LOG_LIMIT_MAX}개까지 보여 줍니다. 전체는 {total}
                개입니다.
              </p>
            ))}
        </>
      )}
    </>
  )
}
