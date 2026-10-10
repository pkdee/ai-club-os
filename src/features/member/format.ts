import { kstDateKey, kstMonthDay, kstTime } from "@/features/session/time"

// 예: 2026. 9. 1. 한국 시간 기준이다.
export function formatJoinDate(value: string) {
  const [year, month, day] = kstDateKey(value).split("-").map(Number)
  return `${year}. ${month}. ${day}.`
}

// 예: 10월 17일 14:30
export function formatInviteExpiry(value: string) {
  const { month, day } = kstMonthDay(value)
  return `${month} ${day}일 ${kstTime(value)}`
}
