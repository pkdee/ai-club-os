import Link from "next/link"

import { formatLogDate } from "@/features/ai-log/format"

import type { MonthActivity } from "../queries"

// 한 화면에 보여 주는 내 AI Log 수. 넘으면 나머지는 수로만 알린다.
const SHOWN_LOGS = 8

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-body-s text-muted-foreground">{label}</dt>
      <dd className="text-label-m">{children}</dd>
    </div>
  )
}

// 한 달 동안 내가 한 것. 회고를 쓰기 전에 돌아볼 거리로 보여 준다. 나에게만 내 것이 보인다.
// activity 가 null 이면 불러오지 못한 것이다.
export function MonthActivityCard({
  clubId,
  activity,
  now,
}: {
  clubId: string
  activity: MonthActivity | null
  now: Date
}) {
  if (!activity) {
    return (
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <h2 className="text-h4">내 한 달</h2>
        <p className="text-body-s text-muted-foreground">
          이 달의 활동을 불러오지 못했습니다. 잠시 뒤 화면을 새로 고쳐 주세요.
        </p>
      </section>
    )
  }

  const { logs, sessions, attendance } = activity
  const actions = logs.filter((log) => log.nextAction.trim() !== "")
  const recorded =
    attendance.present + attendance.late + attendance.absent + attendance.excused

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">내 한 달</h2>
        <p className="text-body-s text-muted-foreground">
          이 달에 내가 한 것입니다. 돌아볼 때 참고하세요.
        </p>
      </div>
      <dl className="flex flex-col gap-2">
        <Row label="남긴 AI Log">{logs.length}개</Row>
        <Row label="열린 Session">{sessions}회</Row>
        {sessions > 0 && (
          <Row label="내 출석">
            {recorded > 0
              ? [
                  attendance.present > 0 && `출석 ${attendance.present}`,
                  attendance.late > 0 && `지각 ${attendance.late}`,
                  attendance.absent > 0 && `결석 ${attendance.absent}`,
                  attendance.excused > 0 && `공결 ${attendance.excused}`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "기록 없음"}
          </Row>
        )}
      </dl>
      {logs.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <h3 className="text-label-m">내가 남긴 AI Log</h3>
          <ul className="flex flex-col gap-1.5">
            {logs.slice(0, SHOWN_LOGS).map((log) => (
              <li key={log.id} className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/clubs/${clubId}/logs/${log.id}`}
                  className="min-w-0 truncate rounded-sm text-body-s transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {log.title}
                </Link>
                <span className="shrink-0 text-caption text-muted-foreground">
                  {formatLogDate(log.createdAt, now)}
                </span>
              </li>
            ))}
          </ul>
          {logs.length > SHOWN_LOGS && (
            <p className="text-caption text-muted-foreground">
              외 {logs.length - SHOWN_LOGS}개
            </p>
          )}
        </div>
      )}
      {actions.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <h3 className="text-label-m">적어 둔 다음 행동</h3>
          <ul className="flex flex-col gap-2">
            {actions.slice(0, SHOWN_LOGS).map((log) => (
              <li key={log.id} className="flex flex-col gap-0.5">
                <p className="line-clamp-3 text-body-s break-words whitespace-pre-wrap">
                  {log.nextAction}
                </p>
                <Link
                  href={`/clubs/${clubId}/logs/${log.id}`}
                  className="self-start rounded-sm text-caption text-muted-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {log.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
