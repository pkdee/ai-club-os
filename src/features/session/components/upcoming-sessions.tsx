import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

import type { Session } from "../queries"
import { sessionStatus } from "../time"
import { SessionCard } from "./session-card"

// Club 개요에 보여 주는 오늘과 예정 Session. 가까운 것부터 세 개까지 보여 준다.
export function UpcomingSessions({
  clubId,
  sessions,
  now,
}: {
  clubId: string
  sessions: Session[]
  now: Date
}) {
  const upcoming = sessions
    .filter((session) => sessionStatus(session.startsAt, now) !== "done")
    .slice(0, 3)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-h3">다가오는 Session</h2>
        <Link
          href={`/clubs/${clubId}/sessions`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          모두 보기
        </Link>
      </div>
      {upcoming.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {upcoming.map((session) => (
            <li key={session.id}>
              <SessionCard session={session} now={now} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border bg-card p-5 text-muted-foreground">
          예정된 Session 이 없습니다.
        </p>
      )}
    </section>
  )
}
