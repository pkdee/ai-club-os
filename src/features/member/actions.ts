"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"

import { isInviteToken } from "./invite"

export type InviteActionResult = { ok: true } | { ok: false; message: string }

export type JoinState = {
  status: "idle" | "error"
  message?: string
}

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
const ADMIN_ONLY_MESSAGE =
  "운영자만 초대 링크를 만들 수 있습니다. 역할이 바뀌었는지 다른 운영자에게 확인해 주세요."
const INVALID_INVITE_MESSAGE =
  "이 초대 링크는 쓸 수 없습니다. 만료됐거나 운영자가 새 링크를 만들었습니다. 초대한 사람에게 새 링크를 받아 주세요."

// 초대 링크를 새로 만든다. 이전 링크가 있으면 지우므로 그 링크는 바로 쓸 수 없게 된다.
// 누가 할 수 있는지는 데이터베이스의 접근 규칙이 판단한다.
export async function renewClubInvite(
  clubId: string
): Promise<InviteActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()
  const removed = await supabase
    .from("club_invites")
    .delete()
    .eq("club_id", clubId)

  if (removed.error) {
    console.error("이전 초대 링크를 지우지 못했습니다.", removed.error)
    return { ok: false, message: RETRY_MESSAGE }
  }

  const { error } = await supabase
    .from("club_invites")
    .insert({ club_id: clubId })

  // 23505 는 그사이 다른 운영자가 먼저 만든 경우다. 그 링크를 보여 주면 되므로 성공으로 본다.
  if (error && error.code !== "23505") {
    console.error("초대 링크를 만들지 못했습니다.", error)
    return {
      ok: false,
      message: error.code === "42501" ? ADMIN_ONLY_MESSAGE : RETRY_MESSAGE,
    }
  }

  revalidatePath(`/clubs/${clubId}/members`)
  return { ok: true }
}

// 초대 링크로 Club 에 참여한다. 성공하면 그 Club 으로 이동한다.
// 링크가 맞는지와 만료 여부는 데이터베이스의 join_club 함수가 확인한다.
export async function joinClub(token: string): Promise<JoinState> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isInviteToken(token)) {
    return { status: "error", message: INVALID_INVITE_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("join_club", {
    invite_token: token,
  })

  if (error) {
    console.error("Club 에 참여하지 못했습니다.", error)
    return { status: "error", message: RETRY_MESSAGE }
  }
  if (typeof data !== "string") {
    return { status: "error", message: INVALID_INVITE_MESSAGE }
  }

  // 내 Club 목록과 Club 안쪽 화면이 모두 달라지므로 통째로 새로 읽는다.
  revalidatePath("/", "layout")
  redirect(`/clubs/${data}`)
}
