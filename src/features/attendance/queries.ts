import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

import type { AttendanceStatus } from "./status"

export type AttendanceRecords = Record<string, AttendanceStatus | undefined>

export type AttendanceResult =
  | { status: "ok"; records: AttendanceRecords }
  | { status: "error" }

// 한 Session 의 기록을 Member 별로 읽는다. 기록이 없는 Member 는 들어 있지 않다.
export const listAttendance = cache(
  async (clubId: string, sessionId: string): Promise<AttendanceResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("attendance")
      .select("member_id, status")
      .eq("club_id", clubId)
      .eq("session_id", sessionId)

    if (error) {
      console.error("Attendance 를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const records: AttendanceRecords = {}
    for (const row of data as { member_id: string; status: AttendanceStatus }[]) {
      records[row.member_id] = row.status
    }
    return { status: "ok", records }
  }
)

// 한 Session 에 기록이 남은 Member 수. 불러오지 못하면 null 이다.
export const countSessionAttendance = cache(
  async (clubId: string, sessionId: string): Promise<number | null> => {
    const supabase = await createClient()
    const { error, count } = await supabase
      .from("attendance")
      .select("member_id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("session_id", sessionId)

    if (error) {
      console.error("Attendance 수를 세지 못했습니다.", error)
      return null
    }
    return count
  }
)

// 여러 Session 의 기록을 한꺼번에 읽는다. Club 개요의 평균 출석에 쓴다. 불러오지 못하면 null 이다.
// 한 번에 읽는 행 수에 한도가 있으므로 최근 몇 회차만 넘긴다.
export async function listSessionsAttendance(
  clubId: string,
  sessionIds: string[]
): Promise<{ sessionId: string; status: AttendanceStatus }[] | null> {
  if (sessionIds.length === 0) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("attendance")
    .select("session_id, status")
    .eq("club_id", clubId)
    .in("session_id", sessionIds)

  if (error) {
    console.error("최근 Attendance 를 불러오지 못했습니다.", error)
    return null
  }
  return (data as { session_id: string; status: AttendanceStatus }[]).map(
    (row) => ({ sessionId: row.session_id, status: row.status })
  )
}

// 한 Member 의 기록을 모두 읽는다. 개요의 내 기록에 쓴다. 불러오지 못하면 null 이다.
export async function listMemberAttendance(
  clubId: string,
  memberId: string
): Promise<AttendanceStatus[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("attendance")
    .select("status")
    .eq("club_id", clubId)
    .eq("member_id", memberId)

  if (error) {
    console.error("내 Attendance 를 불러오지 못했습니다.", error)
    return null
  }
  return (data as { status: AttendanceStatus }[]).map((row) => row.status)
}
