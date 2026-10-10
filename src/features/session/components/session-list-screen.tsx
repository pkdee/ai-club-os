import Link from "next/link"
import { Calendar, CircleAlert, RefreshCw } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import type { Session, SessionListResult } from "../queries"
import { kstDateKey, sessionStatus } from "../time"
import { SessionCard } from "./session-card"
import { SessionFormDialog } from "./session-form-dialog"

function SessionGroup({
  title,
  sessions,
  now,
}: {
  title: string
  sessions: Session[]
  now: Date
}) {
  if (sessions.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-h4">
        {title}
        <span className="text-label-m text-tertiary">{sessions.length}</span>
      </h2>
      <ul className="flex flex-col gap-3">
        {sessions.map((session) => (
          <li key={session.id}>
            <SessionCard session={session} now={now} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function SessionListScreen({
  clubId,
  canManage,
  result,
  now,
}: {
  clubId: string
  canManage: boolean
  result: SessionListResult
  now: Date
}) {
  const sessions = result.status === "ok" ? result.sessions : []
  const current = sessions.filter(
    (session) => sessionStatus(session.startsAt, now) !== "done"
  )
  // 지난 Session 은 최근 것이 위에 오게 한다.
  const past = sessions
    .filter((session) => sessionStatus(session.startsAt, now) === "done")
    .reverse()
  const createDialog = canManage ? (
    <SessionFormDialog
      target={{ clubId }}
      defaults={{
        date: kstDateKey(now),
        // 시간표 열이 아직 없으면 넘기지 않아서 창에 칸이 나오지 않는다.
        ...(result.status === "ok" && result.agendaReady && { agenda: "" }),
      }}
    />
  ) : null

  return (
    <>
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1">Session</h1>
          <p className="text-muted-foreground">
            학습, 실험, 공유가 이루어지는 회차입니다.
          </p>
        </div>
        {sessions.length > 0 && createDialog}
      </div>
      {result.status === "error" ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <CircleAlert strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>Session 목록을 불러오지 못했습니다</EmptyTitle>
              <EmptyDescription>
                연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해
                주세요.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link
                href={`/clubs/${clubId}/sessions`}
                className={buttonVariants({ variant: "outline" })}
              >
                <RefreshCw aria-hidden="true" strokeWidth={1.5} />
                다시 시도
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Calendar strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>아직 Session 이 없습니다</EmptyTitle>
              <EmptyDescription>
                {canManage
                  ? "첫 회차를 만들어 날짜와 장소를 알려 주세요."
                  : "운영자가 Session 을 만들면 여기에 보입니다."}
              </EmptyDescription>
            </EmptyHeader>
            {createDialog && <EmptyContent>{createDialog}</EmptyContent>}
          </Empty>
        </div>
      ) : (
        <>
          <SessionGroup title="오늘과 예정" sessions={current} now={now} />
          <SessionGroup title="지난 Session" sessions={past} now={now} />
        </>
      )}
    </>
  )
}
