import Link from "next/link"
import { ChevronRight, Clock, MapPin } from "lucide-react"

import { cn } from "@/lib/utils"

import type { Session } from "../queries"
import { formatKstTimeRange, kstMonthDay, sessionStatus } from "../time"
import { SessionStatusBadge } from "./session-status-badge"

export function SessionCard({ session, now }: { session: Session; now: Date }) {
  const status = sessionStatus(session.startsAt, now)
  const { month, day } = kstMonthDay(session.startsAt)
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
        <span
          className={cn(
            "text-label-s",
            today ? "text-brand" : "text-muted-foreground"
          )}
        >
          {month}
        </span>
        <span className={cn("text-h2", today && "text-brand")}>{day}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 text-h4">{session.title}</span>
          <SessionStatusBadge status={status} />
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-s text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-3.5 text-icon-subtle"
            />
            {formatKstTimeRange(session.startsAt, session.endsAt)}
          </span>
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
      </span>
      <ChevronRight
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-5 shrink-0 text-icon-subtle"
      />
    </Link>
  )
}
