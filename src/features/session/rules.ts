import { kstToIso } from "./time"

// Session 입력 규칙. 데이터베이스의 check 제약과 같은 값이어야 한다.
export const SESSION_TITLE_MAX = 80
export const SESSION_LOCATION_MAX = 80
export const SESSION_DESCRIPTION_MAX = 2000
export const SESSION_AGENDA_MAX = 2000

export type SessionInput = {
  title: string
  // 날짜를 아직 정하지 않았다는 표시. 켜면 날짜와 시각을 보지 않고 비워 둔다.
  dateUndecided: boolean
  date: string
  startTime: string
  endTime: string
  location: string
  description: string
  // 시간표. 한 줄에 하나씩 적는다. 비워 둘 수 있다.
  agenda: string
}

export type SessionInputErrors = Partial<Record<keyof SessionInput, string>>

// 저장하는 시작과 종료 시각. 날짜를 정하지 않은 회차는 둘 다 비어 있다. 데이터베이스의 check 제약과 같다.
export type SessionTimes =
  | { startsAt: string; endsAt: string }
  | { startsAt: null; endsAt: null }

export type SessionValidation =
  | ({ ok: true } & SessionTimes)
  | { ok: false; errors: SessionInputErrors }

// 데이터베이스가 글자 수를 세는 방식과 맞춘다.
function length(value: string) {
  return Array.from(value).length
}

export function validateSession(input: SessionInput): SessionValidation {
  const errors: SessionInputErrors = {}

  if (length(input.title) === 0) {
    errors.title = "제목을 입력해 주세요."
  } else if (length(input.title) > SESSION_TITLE_MAX) {
    errors.title = `제목은 ${SESSION_TITLE_MAX}자 이내로 적어 주세요.`
  }

  // 날짜를 정하지 않은 회차는 날짜와 시각을 보지 않는다. 칸에 남은 값이 있어도 저장하지 않는다.
  const startsAt = input.dateUndecided
    ? null
    : kstToIso(input.date, input.startTime)
  const endsAt = input.dateUndecided
    ? null
    : kstToIso(input.date, input.endTime)

  if (!input.dateUndecided) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
      errors.date = "날짜를 골라 주세요."
    } else if (!kstToIso(input.date, "00:00")) {
      errors.date = "달력에 없는 날짜입니다. 다시 골라 주세요."
    }
    if (!/^\d{2}:\d{2}$/.test(input.startTime)) {
      errors.startTime = "시작 시각을 골라 주세요."
    }
    if (!/^\d{2}:\d{2}$/.test(input.endTime)) {
      errors.endTime = "종료 시각을 골라 주세요."
    } else if (startsAt && endsAt && endsAt <= startsAt) {
      errors.endTime = "종료 시각은 시작 시각보다 뒤여야 합니다."
    }
  }

  if (length(input.location) > SESSION_LOCATION_MAX) {
    errors.location = `장소는 ${SESSION_LOCATION_MAX}자 이내로 적어 주세요.`
  }
  if (length(input.description) > SESSION_DESCRIPTION_MAX) {
    errors.description = `목표와 소개는 ${SESSION_DESCRIPTION_MAX}자 이내로 적어 주세요.`
  }
  if (length(input.agenda) > SESSION_AGENDA_MAX) {
    errors.agenda = `시간표는 ${SESSION_AGENDA_MAX}자 이내로 적어 주세요.`
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }
  if (input.dateUndecided) {
    return { ok: true, startsAt: null, endsAt: null }
  }
  if (!startsAt || !endsAt) {
    return { ok: false, errors }
  }
  return { ok: true, startsAt, endsAt }
}
