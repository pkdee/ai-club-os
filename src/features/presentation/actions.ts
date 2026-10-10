"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import { isPresentationToken, presentationPath } from "./token"

export type PresentationActionResult =
  | { ok: true }
  | { ok: false; message: string }

// 발표의 대상. Project 하나이거나 Club 전체다.
export type PresentationTarget =
  | { scope: "project"; projectId: string }
  | { scope: "club" }

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
const NOT_ALLOWED_MESSAGE = {
  project:
    "이 Project 의 참여자와 운영자만 발표를 공개하고 거둘 수 있습니다. 참여가 끝났거나 Project 가 지워졌을 수 있습니다. 화면을 새로 고쳐 확인해 주세요.",
  club: "운영자만 Club 발표를 공개하고 거둘 수 있습니다. 내 역할이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요.",
}
const NOT_READY_MESSAGE =
  "데이터베이스에 발표의 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const GONE_MESSAGE =
  "발표를 찾을 수 없습니다. 다른 사람이 먼저 공개를 거뒀을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."

function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

// 발표를 공개한다. 링크는 데이터베이스가 만든다. 누가 할 수 있는지는 데이터베이스의 접근 규칙이 판단한다.
// showNames 가 true 이면 참여자와 기록 작성자의 이름을 보인다.
export async function publishPresentation(
  clubId: string,
  target: PresentationTarget,
  showNames: boolean
): Promise<PresentationActionResult> {
  await requireUser()
  if (target.scope === "project" && !isUuid(target.projectId)) {
    return { ok: false, message: NOT_ALLOWED_MESSAGE.project }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("presentations").insert({
    club_id: clubId,
    scope: target.scope,
    project_id: target.scope === "project" ? target.projectId : null,
    show_names: showNames === true,
  })

  // 23505 는 그사이 다른 사람이 먼저 공개한 경우다. 바라는 상태가 됐으므로 성공으로 본다.
  if (error && error.code !== "23505") {
    if (isMissingTable(error)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    console.error("발표를 공개하지 못했습니다.", error)
    return {
      ok: false,
      message:
        error.code === "42501" || error.code === "23503"
          ? NOT_ALLOWED_MESSAGE[target.scope]
          : RETRY_MESSAGE,
    }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// 발표에 이름을 보일지 바꾼다. 링크는 그대로다.
export async function setPresentationNames(
  clubId: string,
  presentationId: string,
  showNames: boolean
): Promise<PresentationActionResult> {
  await requireUser()
  if (!isUuid(presentationId)) {
    return { ok: false, message: GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("presentations")
    .update({ show_names: showNames === true })
    .eq("club_id", clubId)
    .eq("id", presentationId)
    .select("token")

  if (error) {
    console.error("발표의 이름 표시를 바꾸지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  // 접근 규칙에 막혔거나 이미 거둔 발표이면 오류 없이 0개가 돌아온다.
  if (data.length === 0) {
    return { ok: false, message: GONE_MESSAGE }
  }

  refresh(clubId, (data as { token: string }[])[0]?.token)
  return { ok: true }
}

// 공개를 거둔다. 행을 지우므로 링크는 바로 쓸 수 없고, 다시 공개하면 새 링크가 된다.
export async function unpublishPresentation(
  clubId: string,
  presentationId: string
): Promise<PresentationActionResult> {
  await requireUser()
  if (!isUuid(presentationId)) {
    return { ok: false, message: GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("presentations")
    .delete()
    .eq("club_id", clubId)
    .eq("id", presentationId)
    .select("token")

  if (error) {
    console.error("발표의 공개를 거두지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: GONE_MESSAGE }
  }

  refresh(clubId, (data as { token: string }[])[0]?.token)
  return { ok: true }
}

// 발표를 다루는 화면과 발표 화면을 함께 새로 읽게 한다.
function refresh(clubId: string, token: string | undefined) {
  revalidatePath(`/clubs/${clubId}`, "layout")
  if (isPresentationToken(token)) {
    revalidatePath(presentationPath(token))
  }
}
