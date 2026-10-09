import Link from "next/link"
import { Calendar, CircleAlert, Clock, MapPin } from "lucide-react"

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

import type { Session } from "../queries"
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

export function SessionUnavailable({
  clubId,
  reason,
}: {
  clubId: string
  reason: keyof typeof MESSAGES
}) {
  const { title, description } = MESSAGES[reason]

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
            href={`/clubs/${clubId}/sessions`}
            className={buttonVariants({ variant: "outline" })}
          >
            Session 목록으로
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}

// Session 상세의 모든 탭 위에 놓이는 제목 영역.
// actions 에는 다른 기능이 이 회차에 올리는 버튼을 넣는다.
export function SessionHeader({
  clubName,
  session,
  canManage,
  actions,
  now,
}: {
  clubName: string
  session: Session
  canManage: boolean
  actions?: React.ReactNode
  now: Date
}) {
  const clubHref = `/clubs/${session.clubId}`

  return (
    <div className="flex flex-col gap-3">
      <Breadcrumb
        items={[
          { label: clubName, href: clubHref },
          { label: "Session", href: `${clubHref}/sessions` },
          { label: session.title },
        ]}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1">{session.title}</h1>
            <SessionStatusBadge status={sessionStatus(session.startsAt, now)} />
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
        {(canManage || actions) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canManage && (
              <SessionFormDialog
                target={{ clubId: session.clubId, sessionId: session.id }}
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
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
