"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import type { ClubRole } from "@/features/club/roles"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import { isMissingTable } from "./bans"
import { isInviteToken } from "./invite"

export type InviteActionResult = { ok: true } | { ok: false; message: string }

export type MemberActionResult = { ok: true } | { ok: false; message: string }

export type JoinState = {
  status: "idle" | "error"
  message?: string
}

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
const ADMIN_ONLY_MESSAGE =
  "운영자만 초대 링크를 만들 수 있습니다. 역할이 바뀌었는지 다른 운영자에게 확인해 주세요."
const LAST_ADMIN_MESSAGE =
  "Club 에는 운영자가 한 명 이상 있어야 합니다. 다른 Member 를 먼저 운영자로 지정해 주세요."
const NOT_ALLOWED_MESSAGE =
  "운영자만 할 수 있는 일입니다. 내 역할이 바뀌었거나 이미 나간 Member 일 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const BLOCK_UNAVAILABLE_MESSAGE =
  "다시 들어오지 못하게 막는 기능을 아직 쓸 수 없습니다. 데이터베이스에 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
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

// 데이터베이스가 마지막 운영자를 지키려고 막았을 때의 오류 번호.
const LAST_ADMIN_ERROR = "P0001"

// Member 의 역할을 바꾼다. 운영자만 할 수 있고, 마지막 운영자는 구성원으로 내릴 수 없다.
// 두 규칙 모두 데이터베이스가 판단한다.
export async function changeMemberRole(
  clubId: string,
  memberId: string,
  role: ClubRole
): Promise<MemberActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(memberId) || (role !== "admin" && role !== "member")) {
    return { ok: false, message: NOT_ALLOWED_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("members")
    .update({ role })
    .eq("club_id", clubId)
    .eq("id", memberId)
    .select("id")

  if (error) {
    console.error("Member 의 역할을 바꾸지 못했습니다.", error)
    return {
      ok: false,
      message: error.code === LAST_ADMIN_ERROR ? LAST_ADMIN_MESSAGE : RETRY_MESSAGE,
    }
  }
  // 접근 규칙에 막히면 오류 없이 바뀐 행이 0개로 돌아온다.
  if (data.length === 0) {
    return { ok: false, message: NOT_ALLOWED_MESSAGE }
  }

  // 역할에 따라 메뉴와 버튼이 달라지므로 Club 아래를 통째로 새로 읽는다.
  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// Member 를 Club 에서 내보낸다. 그 사람의 Attendance 는 함께 삭제되고 AI Log 는 작성자 없이 남는다.
// block 이 true 이면 초대 링크가 있어도 다시 들어오지 못하게 막는다. 운영자가 나중에 풀어 줄 수 있다.
export async function removeMember(
  clubId: string,
  memberId: string,
  block = false
): Promise<MemberActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(memberId)) {
    return { ok: false, message: NOT_ALLOWED_MESSAGE }
  }

  const supabase = await createClient()
  // 막을 사람의 사용자 식별자. 내보내지 못하면 막은 것도 되돌려야 해서 기억해 둔다.
  let blockedUserId: string | null = null

  if (block) {
    const target = await supabase
      .from("members")
      .select("user_id")
      .eq("club_id", clubId)
      .eq("id", memberId)
      .maybeSingle()

    if (target.error) {
      console.error("내보낼 Member 를 확인하지 못했습니다.", target.error)
      return { ok: false, message: RETRY_MESSAGE }
    }
    if (!target.data) {
      return { ok: false, message: NOT_ALLOWED_MESSAGE }
    }

    // 막는 것을 먼저 한다. 내보낸 뒤에 막으면 그사이에 다시 들어올 수 있고, Member 가 아닌 사람은 막을 수 없다.
    const userId = (target.data as { user_id: string }).user_id
    const banned = await supabase
      .from("club_bans")
      .insert({ club_id: clubId, user_id: userId })

    // 23505 는 이미 막혀 있는 경우다. 그대로 내보내면 된다.
    if (banned.error && banned.error.code !== "23505") {
      if (isMissingTable(banned.error)) {
        return { ok: false, message: BLOCK_UNAVAILABLE_MESSAGE }
      }
      console.error("다시 들어오지 못하게 막지 못했습니다.", banned.error)
      return {
        ok: false,
        message:
          banned.error.code === "42501" || banned.error.code === "P0001"
            ? NOT_ALLOWED_MESSAGE
            : RETRY_MESSAGE,
      }
    }
    if (!banned.error) {
      blockedUserId = userId
    }
  }

  const { data, error } = await supabase
    .from("members")
    .delete()
    .eq("club_id", clubId)
    .eq("id", memberId)
    .select("id")

  if (error || data.length === 0) {
    // 내보내지 못했으면 방금 막은 것도 푼다. Member 인 채로 막혀 있으면 운영자가 알아채기 어렵다.
    if (blockedUserId) {
      const undone = await supabase
        .from("club_bans")
        .delete()
        .eq("club_id", clubId)
        .eq("user_id", blockedUserId)
      if (undone.error) {
        console.error("막은 것을 되돌리지 못했습니다.", undone.error)
      }
    }
    if (error) {
      console.error("Member 를 내보내지 못했습니다.", error)
      return {
        ok: false,
        message:
          error.code === LAST_ADMIN_ERROR ? LAST_ADMIN_MESSAGE : RETRY_MESSAGE,
      }
    }
    return { ok: false, message: NOT_ALLOWED_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// 다시 들어오지 못하게 막아 둔 사람을 풀어 준다. 풀린 사람은 초대 링크로 다시 참여할 수 있다.
export async function unblockMember(
  clubId: string,
  userId: string
): Promise<MemberActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(userId)) {
    return { ok: false, message: NOT_ALLOWED_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("club_bans")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .select("user_id")

  if (error) {
    console.error("막은 사람을 풀어 주지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  // 운영자가 아니면 오류 없이 0개로 돌아온다. 다른 운영자가 먼저 풀었을 때도 같다.
  if (data.length === 0) {
    return { ok: false, message: NOT_ALLOWED_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}/members`)
  return { ok: true }
}

// 스스로 Club 에서 나간다. 성공하면 내 Club 목록으로 이동한다.
export async function leaveClub(clubId: string): Promise<MemberActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Club 에서 나가지 못했습니다.", error)
    return {
      ok: false,
      message: error.code === LAST_ADMIN_ERROR ? LAST_ADMIN_MESSAGE : RETRY_MESSAGE,
    }
  }

  revalidatePath("/", "layout")
  redirect("/")
}
