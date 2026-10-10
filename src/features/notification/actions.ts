"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"

export type NotificationActionResult =
  | { ok: true }
  | { ok: false; message: string }

// 지금까지의 알림을 확인한 것으로 적는다. 시각은 데이터베이스가 정한다.
// 들어온 참여 요청과 기한이 닥친 할 일은 확인한 뒤에도 챙길 것으로 남는다.
export async function markNotificationsSeen(
  clubId: string
): Promise<NotificationActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("mark_notifications_seen", {
    target_club_id: clubId,
  })

  if (error) {
    console.error("알림을 확인한 것으로 적지 못했습니다.", error)
    return {
      ok: false,
      message:
        "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.",
    }
  }

  // 메뉴의 알림 수가 달라지므로 Club 아래를 통째로 새로 읽는다.
  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}
