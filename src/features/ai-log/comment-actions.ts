"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import { cleanComment, commentError } from "./comment-rules"

export type CommentActionResult = { ok: true } | { ok: false; message: string }

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요. 적은 내용은 그대로 남아 있습니다."
// 테이블이 아직 없을 때의 안내.
const NOT_READY_MESSAGE =
  "데이터베이스에 댓글의 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const LOG_GONE_MESSAGE =
  "이 AI Log 를 찾을 수 없습니다. 지워졌거나 내 소속이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const AUTHOR_ONLY_MESSAGE =
  "댓글은 쓴 사람만 고칠 수 있습니다. 이미 지워졌을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const DELETE_NOT_ALLOWED_MESSAGE =
  "댓글은 쓴 사람과 운영자만 지울 수 있습니다. 이미 지워졌을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const OWN_LOG_MESSAGE = "내가 쓴 기록에는 표시할 수 없습니다."

async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

// 댓글과 표시는 기록 화면에 보이고 알림의 수를 바꾸므로 Club 아래를 통째로 새로 읽는다.
function refresh(clubId: string) {
  revalidatePath(`/clubs/${clubId}`, "layout")
}

// 기록에 댓글을 단다. Club 의 Member 는 누구나 달 수 있다.
export async function addAiLogComment(
  clubId: string,
  logId: string,
  body: string
): Promise<CommentActionResult> {
  await requireUser()
  if (!isUuid(logId)) {
    return { ok: false, message: LOG_GONE_MESSAGE }
  }
  const cleaned = cleanComment(body)
  const invalid = commentError(cleaned)
  if (invalid) {
    return { ok: false, message: invalid }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("ai_log_comments")
    .insert({ club_id: clubId, log_id: logId, body: cleaned })

  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    // 42501 은 접근 규칙에 막힌 것이고 23503 은 기록이 없는 것이다.
    if (error.code === "42501" || error.code === "23503") {
      return { ok: false, message: LOG_GONE_MESSAGE }
    }
    console.error("댓글을 달지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }

  refresh(clubId)
  return { ok: true }
}

// 내가 쓴 댓글을 고친다.
export async function updateAiLogComment(
  clubId: string,
  commentId: string,
  body: string
): Promise<CommentActionResult> {
  await requireUser()
  if (!isUuid(commentId)) {
    return { ok: false, message: AUTHOR_ONLY_MESSAGE }
  }
  const cleaned = cleanComment(body)
  const invalid = commentError(cleaned)
  if (invalid) {
    return { ok: false, message: invalid }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_log_comments")
    .update({ body: cleaned })
    .eq("club_id", clubId)
    .eq("id", commentId)
    .select("id")

  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    console.error("댓글을 고치지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  // 접근 규칙에 막히면 오류 없이 바뀐 행이 0개로 돌아온다.
  if (data.length === 0) {
    return { ok: false, message: AUTHOR_ONLY_MESSAGE }
  }

  refresh(clubId)
  return { ok: true }
}

// 댓글을 지운다. 쓴 사람과 운영자가 지운다. 되살릴 수 없다.
export async function deleteAiLogComment(
  clubId: string,
  commentId: string
): Promise<CommentActionResult> {
  await requireUser()
  if (!isUuid(commentId)) {
    return { ok: false, message: DELETE_NOT_ALLOWED_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_log_comments")
    .delete()
    .eq("club_id", clubId)
    .eq("id", commentId)
    .select("id")

  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    console.error("댓글을 지우지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: DELETE_NOT_ALLOWED_MESSAGE }
  }

  refresh(clubId)
  return { ok: true }
}

// 기록이 도움이 됐다고 표시하거나 표시를 거둔다. 내가 쓴 기록에는 표시할 수 없다.
export async function setAiLogHelpful(
  clubId: string,
  logId: string,
  helpful: boolean
): Promise<CommentActionResult> {
  const user = await requireUser()
  if (!isUuid(logId)) {
    return { ok: false, message: LOG_GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { error } = helpful
    ? await supabase
        .from("ai_log_reactions")
        .insert({ club_id: clubId, log_id: logId })
    : await supabase
        .from("ai_log_reactions")
        .delete()
        .eq("club_id", clubId)
        .eq("log_id", logId)
        .eq("user_id", user.id)

  // 23505 는 이미 표시해 둔 것이다. 바라던 상태이므로 성공으로 본다.
  if (error && error.code !== "23505") {
    if (isMissingTable(error)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    // 42501 은 접근 규칙에 막힌 것이다. 내 기록이거나, 기록이 없거나, Member 가 아니다.
    if (error.code === "42501" || error.code === "23503") {
      return { ok: false, message: OWN_LOG_MESSAGE }
    }
    console.error("도움이 됐다는 표시를 바꾸지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }

  refresh(clubId)
  return { ok: true }
}
