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
