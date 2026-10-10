import Link from "next/link"
import { CircleAlert, FileText } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import type { AiLogListResult, AiLogSummary } from "../queries"
import { AiLogCardList } from "./ai-log-card"

export type Attendee = {
  userId: string
  name: string
  avatarUrl: string | null
}

// 출석하거나 지각한 Member 가운데 몇 명이 이 회차의 기록을 남겼는지 보여 준다.
// attendees 가 null 이면 Attendance 를 불러오지 못한 것이다.
function WritingProgress({
  attendees,
  logs,
}: {
  attendees: Attendee[] | null
  logs: AiLogSummary[]
}) {
  const writers = new Set(logs.map((log) => log.author?.userId))
  const waiting = (attendees ?? []).filter(
    (attendee) => !writers.has(attendee.userId)
  )
  const total = attendees?.length ?? 0
  const written = total - waiting.length

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <h2 className="text-h4">작성 현황</h2>
      {!attendees ? (
        <p className="text-body-s text-muted-foreground">
          Attendance 를 불러오지 못해 작성 현황을 셀 수 없습니다. 잠시 뒤 다시
          열어 주세요.
        </p>
      ) : total === 0 ? (
        <p className="text-body-s text-muted-foreground">
          Attendance 에서 출석이나 지각으로 기록된 Member 가 아직 없습니다.
          기록되면 그 가운데 몇 명이 썼는지 여기에 보입니다.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <p className="flex items-baseline gap-2">
              <span className="text-h1">
                {written} / {total}
              </span>
              <span className="text-body-s text-muted-foreground">명 작성</span>
            </p>
            <p className="text-caption text-tertiary">
              출석과 지각으로 기록된 Member 기준
            </p>
            <div
              aria-hidden="true"
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(written / total) * 100}%` }}
              />
            </div>
          </div>
          {waiting.length > 0 ? (
            <div className="flex flex-col gap-3 border-t pt-4">
              <h3 className="text-body-s text-muted-foreground">
                아직 쓰지 않은 Member
              </h3>
              <ul className="flex flex-col gap-2">
                {waiting.map((attendee) => (
                  <li key={attendee.userId} className="flex items-center gap-2">
                    <Avatar
                      size="sm"
                      name={attendee.name}
                      src={attendee.avatarUrl}
                    />
                    <span className="text-label-m">{attendee.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="border-t pt-4 text-body-s text-muted-foreground">
              출석한 Member 가 모두 기록을 남겼습니다.
            </p>
          )}
        </>
      )}
    </section>
  )
}

// Session 상세의 AI Log 탭.
export function SessionLogs({
  result,
  attendees,
  retryHref,
  now,
}: {
  result: AiLogListResult
  attendees: Attendee[] | null
  retryHref: string
  now: Date
}) {
  if (result.status === "error") {
    return (
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
              href={retryHref}
              className={buttonVariants({ variant: "outline" })}
            >
              다시 시도
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex flex-col gap-3">
        <h2 className="text-h3">AI Log {result.total}개</h2>
        {result.logs.length > 0 ? (
          <AiLogCardList logs={result.logs} now={now} />
        ) : (
          <div className="rounded-xl border bg-card">
            <Empty>
              <EmptyHeader>
                <EmptyMedia>
                  <FileText strokeWidth={1.5} />
                </EmptyMedia>
                <EmptyTitle>아직 이 회차의 AI Log 가 없습니다</EmptyTitle>
                <EmptyDescription>
                  위의 AI Log 쓰기로 이 회차에서 해 본 것을 남겨 보세요. 완성된
                  글이 아니어도 됩니다.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </section>
      <WritingProgress attendees={attendees} logs={result.logs} />
    </div>
  )
}
