import Link from "next/link"
import { ArrowRight, ClipboardCheck, Clock, MapPin } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

import type { DatedSession } from "../queries"
import { formatKstDate, formatKstTimeRange } from "../time"

// Club 개요 맨 위에 놓는 오늘 Session 안내.
// attendance 와 logCount 는 다른 기능이 센 값이고, null 이면 세지 못한 것이라 보여 주지 않는다.
export function TodaySessionCard({
  session,
  canManage,
  attendance,
  logCount,
}: {
  session: DatedSession
  canManage: boolean
  // recorded 는 기록이 남은 Member 수, total 은 전체 Member 수다.
  attendance: { recorded: number; total: number } | null
  logCount: number | null
}) {
  const href = `/clubs/${session.clubId}/sessions/${session.id}`
  const progress = [
    attendance && `Attendance ${attendance.recorded} / ${attendance.total} 기록`,
    logCount !== null && `AI Log ${logCount}개`,
  ].filter(Boolean)

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-brand-border bg-primary-subtle p-5 sm:p-6">
      <p className="flex items-center gap-2">
        <span className="flex h-[22px] items-center rounded-full bg-primary px-2 text-label-s text-primary-foreground">
          오늘
        </span>
        <span className="text-label-m text-brand">
          {formatKstDate(session.startsAt)}
        </span>
      </p>
      <h2 className="text-h2">{session.title}</h2>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-s text-muted-foreground">
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
      {session.description && (
        <p className="line-clamp-2 whitespace-pre-wrap">{session.description}</p>
      )}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-s text-muted-foreground">
          {progress.join(" · ")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`${href}/attendance`}
            className={buttonVariants({ variant: "outline" })}
          >
            <ClipboardCheck aria-hidden="true" strokeWidth={1.5} />
            {canManage ? "Attendance 기록" : "Attendance 보기"}
          </Link>
          <Link href={href} className={buttonVariants({ variant: "outline" })}>
            <ArrowRight aria-hidden="true" strokeWidth={1.5} />
            Session 열기
          </Link>
        </div>
      </div>
    </section>
  )
}
