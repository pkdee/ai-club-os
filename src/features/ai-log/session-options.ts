import type { Session } from "@/features/session/queries"
import {
  formatKstDate,
  formatKstTimeRange,
  sessionStatus,
} from "@/features/session/time"
import { isUuid } from "@/lib/uuid"

import type { SessionOption } from "./components/ai-log-form"

// 쓰기 화면의 Session 고르기에 넣을 값. 최근 회차가 위에 오게 한다.
export function toSessionOptions(sessions: Session[]): SessionOption[] {
  return [...sessions].reverse().map((session) => ({
    id: session.id,
    title: session.title,
    when: `${formatKstDate(session.startsAt)} ${formatKstTimeRange(session.startsAt, session.endsAt)}`,
    description: session.description,
  }))
}

// 새 기록에서 미리 골라 둘 Session.
// 주소로 받은 회차가 이 Club 의 것이면 그것을, 아니면 오늘 열리는 회차를 고른다. 둘 다 없으면 고르지 않는다.
export function defaultSessionId(
  sessions: Session[],
  requested: string | string[] | undefined,
  now: Date
) {
  if (typeof requested === "string" && isUuid(requested)) {
    const found = sessions.find((session) => session.id === requested)
    if (found) {
      return found.id
    }
  }

  const today = sessions.find(
    (session) => sessionStatus(session.startsAt, now) === "today"
  )
  return today ? today.id : ""
}
