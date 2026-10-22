import Link from "next/link"
import { ChevronRight, Clock, MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

import type { Session } from "../queries"
import { formatKstTimeRange, kstMonthDay, sessionStatus } from "../time"
import { SessionStatusBadge } from "./session-status-badge"

export function SessionCard({ session, now }: { session: Session; now: Date }) {
  const status = sessionStatus(session.startsAt, now)
  // 날짜를 정하지 않은 회차는 null 이다.
  const date = session.startsAt === null ? null : kstMonthDay(session.startsAt)
  const today = status === "today"

  return (
    <Link
      href={`/clubs/${session.clubId}/sessions/${session.id}`}
      className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-input focus-visible:outline-2 focus-visible:outline-ring"
    >
      <span
        className={cn(
          "flex w-14 shrink-0 flex-col items-center rounded-lg py-2",
          today ? "bg-primary-subtle" : "bg-muted"
        )}
      >
        {date === null ? (
          // 날짜를 정하지 않은 회차는 날짜 자리에 미정이라고 적는다. 높이는 날짜를 적은 칸과 같다.
          <>
            <span className="text-label-s text-muted-foreground">날짜</span>
            <span className="text-h4 leading-8 text-muted-foreground">미정</span>
          </>
        ) : (
          <>
            <span
              className={cn(
                "text-label-s",
                today ? "text-brand" : "text-muted-foreground"
              )}
            >
              {date.month}
            </span>
            <span className={cn("text-h2", today && "text-brand")}>
              {date.day}
            </span>
          </>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 text-h4">{session.title}</span>
          <SessionStatusBadge status={status} />
        </span>
        {(session.startsAt !== null || session.location) && (
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-s text-muted-foreground">
            {session.startsAt !== null && (
              <span className="flex items-center gap-1.5">
                <Clock
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-3.5 text-icon-subtle"
                />
                {formatKstTimeRange(session.startsAt, session.endsAt)}
              </span>
            )}
            {session.location && (
              <span className="flex items-center gap-1.5">
                <MapPin
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-3.5 text-icon-subtle"
                />
                {session.location}
              </span>
            )}
          </span>
        )}
      </span>
      <ChevronRight
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-5 shrink-0 text-icon-subtle"
      />
    </Link>
  )
}
