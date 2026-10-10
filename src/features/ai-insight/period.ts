import { kstDateKey } from "@/features/session/time"

// 기간을 정리한 AI Insight 는 한국 시간의 한 달을 단위로 한다. 달은 2026-10 같은 값으로 가리킨다.

const UTC_OFFSET = "+09:00"

export function isMonthKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
    return false
  }
  const month = Number(value.slice(5))
  return month >= 1 && month <= 12
}

// 그 시각이 든 달. 예: 2026-10
export function monthKeyOf(value: string | Date) {
  return kstDateKey(value).slice(0, 7)
}

// 그 달의 시작과 다음 달의 시작을 저장용 시각으로 돌려준다. 끝은 그 달에 들지 않는다.
export function monthRange(key: string) {
  const year = Number(key.slice(0, 4))
  const month = Number(key.slice(5))
  const next =
    month === 12
      ? `${year + 1}-01`
      : `${year}-${String(month + 1).padStart(2, "0")}`

  return {
    start: new Date(`${key}-01T00:00:00${UTC_OFFSET}`).toISOString(),
    end: new Date(`${next}-01T00:00:00${UTC_OFFSET}`).toISOString(),
  }
}

// 예: 2026년 10월
export function monthLabel(key: string) {
  return `${Number(key.slice(0, 4))}년 ${Number(key.slice(5))}월`
}

// last 달부터 first 달까지 거슬러 올라가며 달을 돌려준다. 최근 달이 앞에 오고, limit 개를 넘으면 오래된 달을 뺀다.
// first 가 last 보다 뒤면 빈 목록이다.
export function monthKeysBetween(first: string, last: string, limit: number) {
  let year = Number(last.slice(0, 4))
  let month = Number(last.slice(5))
  const keys: string[] = []

  while (keys.length < limit) {
    const key = `${year}-${String(month).padStart(2, "0")}`
    if (key < first) {
      break
    }
    keys.push(key)
    month -= 1
    if (month === 0) {
      month = 12
      year -= 1
    }
  }
  return keys
}
