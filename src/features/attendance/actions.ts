"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"

import { isAttendanceStatus, type AttendanceStatus } from "./status"

export type AttendanceTarget = {
  clubId: string
  sessionId: string
}

export type AttendanceSaveResult = { ok: true } | { ok: false; message: string }

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 화면의 표시는 저장된 값으로 되돌아갔습니다. 다시 골라 주세요."
const ADMIN_ONLY_MESSAGE =
  "운영자만 Attendance 를 기록할 수 있습니다. 역할이 바뀌었는지 운영자에게 확인해 주세요."

function refresh(target: AttendanceTarget) {
  revalidatePath(
    `/clubs/${target.clubId}/sessions/${target.sessionId}`,
    "layout"
  )
}

// 한 Member 의 상태를 정한다. status 가 null 이면 기록을 지워 미기록으로 되돌린다.
// 누가 할 수 있는지는 데이터베이스의 접근 규칙이 판단한다.
export async function setAttendance(
  target: AttendanceTarget,
  memberId: string,
  status: AttendanceStatus | null
): Promise<AttendanceSaveResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (status !== null && !isAttendanceStatus(status)) {
    return { ok: false, message: RETRY_MESSAGE }
  }

  const supabase = await createClient()
  const row = () =>
    supabase
      .from("attendance")
      .update({ status })
      .eq("club_id", target.clubId)
      .eq("session_id", target.sessionId)
      .eq("member_id", memberId)
      .select("id")

  if (status === null) {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("club_id", target.clubId)
      .eq("session_id", target.sessionId)
      .eq("member_id", memberId)

    if (error) {
      console.error("Attendance 를 지우지 못했습니다.", error)
      return { ok: false, message: RETRY_MESSAGE }
    }
    refresh(target)
    return { ok: true }
  }

  // 이미 기록이 있으면 고치고, 없으면 새로 넣는다.
  const updated = await row()
  if (updated.error) {
    console.error("Attendance 를 고치지 못했습니다.", updated.error)
    return { ok: false, message: RETRY_MESSAGE }
  }

  if (updated.data.length === 0) {
    const { error } = await supabase.from("attendance").insert({
      club_id: target.clubId,
      session_id: target.sessionId,
      member_id: memberId,
      status,
    })

    // 그사이 다른 운영자가 먼저 기록했으면 겹친다. 그때는 다시 고친다.
    if (error?.code === "23505") {
      const retried = await row()
      if (retried.error || retried.data.length === 0) {
        return { ok: false, message: RETRY_MESSAGE }
      }
    } else if (error) {
      console.error("Attendance 를 기록하지 못했습니다.", error)
      return {
        ok: false,
        message: error.code === "42501" ? ADMIN_ONLY_MESSAGE : RETRY_MESSAGE,
      }
    }
  }

  refresh(target)
  return { ok: true }
}

// 아직 기록이 없는 Member 를 모두 출석으로 기록한다. 이미 기록된 Member 는 건드리지 않는다.
export async function markUnrecordedPresent(
  target: AttendanceTarget,
  memberIds: string[]
): Promise<AttendanceSaveResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (memberIds.length === 0) {
    return { ok: true }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("attendance").upsert(
    memberIds.map((memberId) => ({
      club_id: target.clubId,
      session_id: target.sessionId,
      member_id: memberId,
      status: "present" as const,
    })),
    { onConflict: "session_id,member_id", ignoreDuplicates: true }
  )

  if (error) {
    console.error("Attendance 를 한꺼번에 기록하지 못했습니다.", error)
    return {
      ok: false,
      message: error.code === "42501" ? ADMIN_ONLY_MESSAGE : RETRY_MESSAGE,
    }
  }

  refresh(target)
  return { ok: true }
}
