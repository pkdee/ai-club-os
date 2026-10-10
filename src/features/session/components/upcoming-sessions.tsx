import Link from "next/link"

import type { Session } from "../queries"
import { kstMonthDay, kstTime, kstWeekday, sessionStatus } from "../time"

// Club 개요의 옆 칸에 놓는 예정 Session. 가까운 것부터 세 개까지 보여 준다.
// 오늘 Session 은 본문의 안내가 따로 보여 주므로 여기에는 넣지 않는다.
export function UpcomingSessions({
  sessions,
  now,
}: {
  sessions: Session[]
  now: Date
}) {
  const upcoming = sessions
    .filter((session) => sessionStatus(session.startsAt, now) === "upcoming")
    .slice(0, 3)

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <h2 className="text-h4">다가오는 Session</h2>
      {upcoming.length > 0 ? (
        <ul className="-mx-2 flex flex-col gap-1">
          {upcoming.map((session) => {
            const { month, day } = kstMonthDay(session.startsAt)
            const when = `${kstWeekday(session.startsAt)} ${kstTime(session.startsAt)}`

            return (
              <li key={session.id}>
                <Link
                  href={`/clubs/${session.clubId}/sessions/${session.id}`}
                  className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-muted py-1.5">
                    <span className="text-caption text-muted-foreground">
                      {month}
                    </span>
                    <span className="text-label-l">{day}</span>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-label-m">
                      {session.title}
                    </span>
                    <span className="truncate text-caption text-muted-foreground">
                      {session.location ? `${when} · ${session.location}` : when}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-body-s text-muted-foreground">
          예정된 Session 이 없습니다.
        </p>
      )}
    </section>
  )
}
