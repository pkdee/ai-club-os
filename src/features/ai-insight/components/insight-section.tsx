import Link from "next/link"
import { CircleAlert, Info, RefreshCw, Sparkles } from "lucide-react"

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
import { formatLogDateTime } from "@/features/ai-log/format"

import type { InsightActionResult } from "../actions"
import { insightShownLogIds, insightToText } from "../content"
import { INSIGHT_DAILY_LIMIT } from "../limit"
import { INSIGHT_MIN_LOGS } from "../prompt"
import { getInsightProvider } from "../provider"
import { listLogTitles, type InsightResult } from "../queries"
import { CopyInsightButton } from "./copy-insight-button"
import { GenerateInsightDialog } from "./generate-insight-dialog"
import { InsightManager } from "./insight-manager"
import { InsightView } from "./insight-view"

// 한 대상(회차나 기간)의 AI Insight 를 보여 주는 영역. 상태에 따라 빈 화면, 초안, 공개된 내용을 그린다.
// 운영자에게는 만들고 고치고 공개하는 버튼이 함께 보인다. 구성원에게는 공개된 내용만 보인다.
export async function InsightSection({
  clubId,
  canManage,
  result,
  targetLabel,
  logCount,
  excludedCount = 0,
  retrospectiveCount = 0,
  runsLeft = null,
  retryHref,
  onGenerate,
  now,
}: {
  clubId: string
  canManage: boolean
  result: InsightResult
  // 예: 3회차 · RAG 기초 실습, 2026년 10월
  targetLabel: string
  // 지금 이 대상에서 정리에 쓸 수 있는 AI Log 수. 세지 못했으면 null 이다.
  logCount: number | null
  // 작성자가 AI Insight 에 쓰지 말라고 해서 보내지 않는 기록 수.
  excludedCount?: number
  // 작성자가 AI Insight 에 써도 된다고 해서 함께 보내는 회고 수.
  retrospectiveCount?: number
  // 오늘 더 만들 수 있는 횟수. 알 수 없으면 null 이고 그때는 보여 주지 않는다.
  runsLeft?: number | null
  retryHref: string
  onGenerate: () => Promise<InsightActionResult>
  now: Date
}) {
  if (result.status === "unavailable") {
    return (
      <Alert tone="info">
        <Info aria-hidden="true" strokeWidth={1.5} />
        <AlertTitle>AI Insight 를 아직 쓸 수 없습니다</AlertTitle>
        <AlertDescription>
          {canManage
            ? "데이터베이스에 AI Insight 의 구조가 아직 없습니다. 최신 마이그레이션을 적용하면 여기에서 만들 수 있습니다."
            : "준비가 끝나면 운영자가 정리한 내용이 여기에 보입니다."}
        </AlertDescription>
      </Alert>
    )
  }

  if (result.status === "error") {
    return (
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
            <Link
              href={retryHref}
              className={buttonVariants({ variant: "outline" })}
            >
              <RefreshCw aria-hidden="true" strokeWidth={1.5} />
              다시 시도
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const { insight } = result
  const provider = canManage ? getInsightProvider() : null
  const enoughLogs = logCount === null || logCount >= INSIGHT_MIN_LOGS
  // 운영자에게만 만드는 버튼을 준다. 만들 수 없을 때는 까닭을 대신 보여 준다.
  const generate = (replaces: boolean) =>
    provider && enoughLogs && runsLeft !== 0 ? (
      <GenerateInsightDialog
        targetLabel={targetLabel}
        logCount={logCount ?? 0}
        excludedCount={excludedCount}
        retrospectiveCount={retrospectiveCount}
        runsLeft={runsLeft}
        providerLabel={provider.label}
        replaces={replaces}
        published={insight?.status === "published"}
        onGenerate={onGenerate}
      />
    ) : null
  const blocked = !provider
    ? "AI Provider 가 설정되지 않았습니다. 서버의 환경 변수에 ANTHROPIC_API_KEY 를 넣으면 만들 수 있습니다."
    : !enoughLogs
      ? `AI Log 가 ${INSIGHT_MIN_LOGS}개 이상 있어야 정리할 수 있습니다. 지금은 ${logCount}개입니다.${
          excludedCount > 0
            ? ` 작성자가 AI Insight 에 쓰지 말라고 한 기록 ${excludedCount}개는 세지 않았습니다.`
            : ""
        }`
      : runsLeft === 0
        ? `오늘은 이 Club 에서 AI Insight 를 ${INSIGHT_DAILY_LIMIT}번 만들었습니다. 내일 다시 만들 수 있습니다.`
        : null

  if (!insight) {
    return (
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
                ? "AI 가 AI Log 를 읽고 반복된 주제, 배운 점, 다음 행동을 정리합니다. 만든 내용은 초안으로 저장되고, 확인해서 공개하기 전에는 운영자에게만 보입니다."
                : "운영자가 AI Log 를 정리해서 공개하면 여기에 보입니다."}
            </EmptyDescription>
          </EmptyHeader>
          {canManage && (
            <EmptyContent>
              {generate(false)}
              {blocked && (
                <p className="text-body-s text-muted-foreground">{blocked}</p>
              )}
            </EmptyContent>
          )}
        </Empty>
      </div>
    )
  }

  const logTitles = insight.content
    ? await listLogTitles(clubId, insightShownLogIds(insight.content))
    : {}
  const published = insight.status === "published"
  const added =
    logCount === null ? 0 : Math.max(0, logCount - insight.sourceLogIds.length)

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <Badge tone={published ? "success" : "warning"}>
              {published ? "공개됨" : "초안 · 운영자에게만 보임"}
            </Badge>
          )}
          <p className="text-body-s text-muted-foreground">
            AI 가 AI Log {insight.sourceLogIds.length}개를 읽고 정리 ·{" "}
            {formatLogDateTime(insight.updatedAt, now)}
            {canManage && ` · ${insight.model}`}
          </p>
        </div>
        <p className="text-caption text-muted-foreground">
          AI 가 정리한 내용이라 원본 기록과 다를 수 있습니다. 근거 기록을 눌러
          원본을 확인할 수 있습니다.
        </p>
        {insight.content && (
          <div className="flex flex-wrap items-center gap-2">
            <CopyInsightButton
              text={insightToText(targetLabel, insight.content)}
            />
          </div>
        )}
      </div>
      {canManage && added > 0 && (
        <Alert tone="info">
          <Info aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>그 뒤로 AI Log 가 {added}개 더 생겼습니다</AlertTitle>
          <AlertDescription>
            다시 만들면 새 기록까지 읽고 정리합니다.
          </AlertDescription>
        </Alert>
      )}
      {canManage ? (
        <InsightManager
          clubId={clubId}
          insight={{
            id: insight.id,
            status: insight.status,
            content: insight.content,
          }}
          logTitles={logTitles}
          regenerate={generate(true)}
        />
      ) : insight.content ? (
        <InsightView
          clubId={clubId}
          content={insight.content}
          logTitles={logTitles}
        />
      ) : (
        <p className="rounded-xl border bg-card p-5 text-muted-foreground">
          내용을 읽을 수 없습니다. 운영자에게 알려 주세요.
        </p>
      )}
    </>
  )
}
