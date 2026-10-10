import Link from "next/link"
import { Calendar, CircleAlert, Clock, MapPin } from "lucide-react"

import { DeleteDialog } from "@/components/delete-dialog"
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

import { deleteSession } from "../actions"
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

// 지울 때 함께 지워지는 Attendance 와 남는 AI Log 를 알려 주는 글. 수가 null 이면 세지 못한 것이다.
function deleteNotes(
  attendanceCount: number | null,
  logCount: number | null,
  hasInsight: boolean
) {
  return [
    ...(hasInsight ? ["이 회차의 AI Insight 도 함께 지워집니다."] : []),
    attendanceCount === null
      ? "이 회차의 Attendance 기록이 함께 지워집니다."
      : attendanceCount === 0
        ? "이 회차에는 Attendance 기록이 없습니다."
        : `이 회차의 Attendance 기록 ${attendanceCount}건이 함께 지워집니다.`,
    logCount === null
      ? "이 회차의 AI Log 는 지워지지 않고, Session 연결만 끊긴 채 Club 의 기록으로 남습니다."
      : logCount === 0
        ? "이 회차에 남긴 AI Log 는 없습니다."
        : `AI Log ${logCount}개는 지워지지 않고, Session 연결만 끊긴 채 Club 의 기록으로 남습니다.`,
    "지우면 되돌릴 수 없습니다.",
  ]
}

// Session 상세의 모든 탭 위에 놓이는 제목 영역.
// actions 에는 다른 기능이 이 회차에 올리는 버튼을 넣는다.
// attendanceCount 와 logCount 는 지우기 전에 보여 주는 수이고, hasInsight 는 이 회차를 정리한 AI Insight 가 있다는 뜻이다.
// 모두 다른 기능이 읽은 값을 받는다.
export function SessionHeader({
  clubName,
  session,
  canManage,
  attendanceCount,
  logCount,
  hasInsight,
  actions,
  now,
}: {
  clubName: string
  session: Session
  canManage: boolean
  attendanceCount: number | null
  logCount: number | null
  hasInsight: boolean
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
              <DeleteDialog
                label="삭제"
                title="이 Session 을 지울까요?"
                description={deleteNotes(
                  attendanceCount,
                  logCount,
                  hasInsight
                ).map(
                  (note) => (
                    <p key={note}>{note}</p>
                  )
                )}
                onDelete={deleteSession.bind(null, session.clubId, session.id)}
              />
            )}
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
