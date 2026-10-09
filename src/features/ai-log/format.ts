import { kstDateKey, kstMonthDay, kstTime } from "@/features/session/time"

import type { AiLogAuthor } from "./queries"

// 작성자가 Club 에서 빠진 기록에 보여 주는 이름.
export function authorName(author: AiLogAuthor | null) {
  return author ? author.name : "탈퇴한 Member"
}

// 예: 10월 8일. 올해가 아니면 연도를 붙인다. 한국 시간 기준이다.
export function formatLogDate(value: string, now: Date) {
  const { month, day } = kstMonthDay(value)
  const year = kstDateKey(value).slice(0, 4)
  const label = `${month} ${day}일`

  return year === kstDateKey(now).slice(0, 4) ? label : `${year}년 ${label}`
}

// 예: 10월 8일 20:52
export function formatLogDateTime(value: string, now: Date) {
  return `${formatLogDate(value, now)} ${kstTime(value)}`
}
