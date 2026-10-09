import Link from "next/link"
import { Calendar, CircleAlert, Clock, Info, MapPin } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import type { SessionResult } from "../queries"
import {
  formatKstDate,
  formatKstTimeRange,
  kstDateKey,
  kstTime,
  sessionStatus,
} from "../time"
import { SessionFormDialog } from "./session-form-dialog"
import { SessionStatusBadge } from "./session-status-badge"

const MESSAGES = {
  "not-found": {
    title: "Session 을 찾을 수 없습니다",
    description: "주소가 맞는지 확인하거나 Session 목록에서 다시 골라 주세요.",
  },
  error: {
    title: "Session 을 불러오지 못했습니다",
    description:
      "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.",
  },
}

export function SessionDetailScreen({
  clubId,
  clubName,
  canManage,
  result,
  now,
}: {
  clubId: string
  clubName: string
  canManage: boolean
  result: SessionResult
  now: Date
}) {
  const listHref = `/clubs/${clubId}/sessions`

  if (result.status !== "ok") {
    const { title, description } = MESSAGES[result.status]

    return (
      <div className="rounded-xl border bg-card">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <CircleAlert strokeWidth={1.5} />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link
              href={listHref}
              className={buttonVariants({ variant: "outline" })}
            >
              Session 목록으로
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const { session } = result

  return (
    <>
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: clubName, href: `/clubs/${clubId}` },
            { label: "Session", href: listHref },
            { label: session.title },
          ]}
        />
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-h1">{session.title}</h1>
              <SessionStatusBadge
                status={sessionStatus(session.startsAt, now)}
              />
            </div>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-s text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Calendar
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 text-icon-subtle"
                />
                {formatKstDate(session.startsAt)}
              </li>
              <li className="flex items-center gap-1.5">
                <Clock
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 text-icon-subtle"
                />
                {formatKstTimeRange(session.startsAt, session.endsAt)}
              </li>
              {session.location && (
                <li className="flex items-center gap-1.5">
                  <MapPin
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="size-4 text-icon-subtle"
                  />
                  {session.location}
                </li>
              )}
            </ul>
          </div>
          {canManage && (
            <SessionFormDialog
              target={{ clubId, sessionId: session.id }}
              defaults={{
                title: session.title,
                date: kstDateKey(session.startsAt),
                startTime: kstTime(session.startsAt),
                endTime: kstTime(session.endsAt),
                location: session.location,
                description: session.description,
              }}
            />
          )}
        </div>
      </div>
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-6">
        <h2 className="text-h4">목표와 소개</h2>
        {session.description ? (
          <p className="text-body-l whitespace-pre-wrap">
            {session.description}
          </p>
        ) : (
          <p className="text-muted-foreground">아직 적은 내용이 없습니다.</p>
        )}
      </section>
      <Alert tone="info">
        <Info aria-hidden="true" strokeWidth={1.5} />
        <AlertTitle>Attendance 와 AI Log 는 준비 중입니다</AlertTitle>
        <AlertDescription>
          출석을 기록하고 이 회차의 AI Log 를 남기는 기능은 다음 단계에서 이
          화면에 추가합니다.
        </AlertDescription>
      </Alert>
    </>
  )
}
