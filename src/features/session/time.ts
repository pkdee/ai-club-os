// Session 의 시각은 한국 시간으로만 다룬다. 서버나 브라우저의 시간대에 기대지 않는다.
// 한국 시간은 일광 절약 시간이 없어서 UTC 와의 차이가 항상 9시간이다.
const TIME_ZONE = "Asia/Seoul"
const UTC_OFFSET = "+09:00"

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

const dateLabelFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  month: "long",
  day: "numeric",
  weekday: "long",
})

const weekdayFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  weekday: "long",
})

const DAY_MS = 24 * 60 * 60 * 1000

function kstParts(value: string | Date) {
  const parts = Object.fromEntries(
    partsFormatter
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value])
  )

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  }
}

// 예: 2026-10-08. 날짜 입력 칸의 값이자 날짜 비교에 쓰는 값이다.
export function kstDateKey(value: string | Date) {
  const { year, month, day } = kstParts(value)
  return `${year}-${month}-${day}`
}

// 예: 19:00
export function kstTime(value: string | Date) {
  const { hour, minute } = kstParts(value)
  return `${hour}:${minute}`
}

// 예: { month: "10월", day: "8" }
export function kstMonthDay(value: string | Date) {
  const { month, day } = kstParts(value)
  return { month: `${Number(month)}월`, day: String(Number(day)) }
}

// 예: 10월 8일 목요일
export function formatKstDate(value: string | Date) {
  return dateLabelFormatter.format(new Date(value))
}

// 예: 목요일
export function kstWeekday(value: string | Date) {
  return weekdayFormatter.format(new Date(value))
}

// 예: 19:00 ~ 21:00
export function formatKstTimeRange(start: string, end: string) {
  return `${kstTime(start)} ~ ${kstTime(end)}`
}

// 한국 시간의 날짜와 시각을 저장용 시각으로 바꾼다. 형식이 틀리거나 없는 날짜면 null 이다.
export function kstToIso(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null
  }

  const value = new Date(`${date}T${time}:00${UTC_OFFSET}`)
  if (Number.isNaN(value.getTime())) {
    return null
  }

  // 2월 31일처럼 없는 날짜는 다음 달로 넘어가 버리므로 되돌려서 확인한다.
  return kstDateKey(value) === date && kstTime(value) === time
    ? value.toISOString()
    : null
}

// 그 시각이 든 달의 첫날 0시(한국 시간)를 저장용 시각으로 돌려준다.
export function kstMonthStart(now: Date) {
  const { year, month } = kstParts(now)
  return new Date(`${year}-${month}-01T00:00:00${UTC_OFFSET}`).toISOString()
}

// 그 시각이 든 주의 월요일 0시(한국 시간)를 저장용 시각으로 돌려준다. 한 주는 월요일에 시작한다.
export function kstWeekStart(now: Date) {
  const midnight = new Date(`${kstDateKey(now)}T00:00:00${UTC_OFFSET}`)
  // 한국 시간으로 본 요일. 일요일이 0 이다.
  const weekday = new Date(midnight.getTime() + 9 * 60 * 60 * 1000).getUTCDay()
  const sinceMonday = (weekday + 6) % 7

  return new Date(midnight.getTime() - sinceMonday * DAY_MS).toISOString()
}

export type SessionStatus = "today" | "upcoming" | "done"

// 한국 시간의 날짜로 오늘, 예정, 종료를 나눈다.
export function sessionStatus(startsAt: string, now: Date): SessionStatus {
  const day = kstDateKey(startsAt)
  const today = kstDateKey(now)

  if (day === today) {
    return "today"
  }
  return day > today ? "upcoming" : "done"
}
