"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import {
  AI_LOG_IMAGE_LIMIT,
  aiLogImagePath,
  imageFileError,
  isAiLogImageType,
  parseAiLogImagePath,
} from "./image-rules"
import {
  createAiLogImageUploadToken,
  removeAiLogImageFiles,
} from "./image-store"

export type ImageUploadStart =
  // path 는 올릴 자리이고 token 은 그 자리에만 쓰는 표다.
  | { ok: true; path: string; token: string }
  | { ok: false; message: string }

export type ImageActionResult = { ok: true } | { ok: false; message: string }

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
const NOT_READY_MESSAGE =
  "데이터베이스에 이미지의 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const AUTHOR_ONLY_MESSAGE =
  "이미지는 기록의 작성자만 붙일 수 있습니다. 기록이 지워졌거나 내 소속이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const LIMIT_MESSAGE = `한 기록에 이미지는 ${AI_LOG_IMAGE_LIMIT}장까지 붙일 수 있습니다. 화면을 새로 고쳐 지금 붙어 있는 것을 확인해 주세요.`
const REMOVE_NOT_ALLOWED_MESSAGE =
  "이미지는 기록의 작성자와 운영자만 지울 수 있습니다. 이미 지워졌을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."

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

// 이미지 한 장을 올릴 자리를 만든다. 목록에 먼저 적고, 그 자리에만 쓰는 표를 돌려준다.
// 파일은 브라우저가 그 표로 Storage 에 바로 올린다. 서버는 파일을 받지 않는다.
// 기록의 작성자만 할 수 있고, 그 판단과 장수 제한은 데이터베이스가 한다.
export async function startAiLogImageUpload(
  clubId: string,
  logId: string,
  file: { type: string; size: number }
): Promise<ImageUploadStart> {
  await requireUser()
  if (!isUuid(clubId) || !isUuid(logId)) {
    return { ok: false, message: AUTHOR_ONLY_MESSAGE }
  }
  const invalid = imageFileError(file)
  if (invalid || !isAiLogImageType(file.type)) {
    return { ok: false, message: invalid ?? RETRY_MESSAGE }
  }

  const supabase = await createClient()
  // 데이터베이스는 경로의 앞 두 마디를 소문자로 적은 식별자와 견준다.
  const club = clubId.toLowerCase()
  const log = logId.toLowerCase()
  const path = aiLogImagePath(club, log, randomUUID(), file.type)
  const { error } = await supabase.from("ai_log_attachments").insert({
    club_id: club,
    log_id: log,
    path,
    mime_type: file.type,
    size_bytes: file.size,
  })

  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    // 42501 은 접근 규칙에 막힌 것이고 23503 은 기록이 없는 것이다.
    if (error.code === "42501" || error.code === "23503") {
      return { ok: false, message: AUTHOR_ONLY_MESSAGE }
    }
    // 형식과 크기는 위에서 걸렀으므로 여기서의 23514 는 장수 제한이다.
    if (error.code === "23514") {
      return { ok: false, message: LIMIT_MESSAGE }
    }
    console.error("이미지를 목록에 적지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }

  const token = await createAiLogImageUploadToken(supabase, path)
  if (!token) {
    // 올릴 자리를 만들지 못했으면 적어 둔 줄을 거둔다.
    await supabase.from("ai_log_attachments").delete().eq("path", path)
    return { ok: false, message: RETRY_MESSAGE }
  }

  return { ok: true, path, token }
}

// 올리지 못한 이미지의 줄을 거둔다. 올리다 만 파일이 있으면 함께 지운다.
export async function cancelAiLogImageUpload(path: string): Promise<void> {
  await requireUser()
  if (!parseAiLogImagePath(path)) {
    return
  }

  const supabase = await createClient()
  await removeAiLogImageFiles(supabase, [path])
  const { error } = await supabase
    .from("ai_log_attachments")
    .delete()
    .eq("path", path)
  if (error) {
    console.error("올리지 못한 이미지의 줄을 거두지 못했습니다.", error)
  }
}

// 붙인 이미지 한 장을 지운다. 기록의 작성자와 운영자가 할 수 있고, 그 판단은 데이터베이스와 Storage 가 한다.
// 파일을 먼저 지우고 목록의 줄을 지운다. 파일이 남아 있는 줄은 데이터베이스가 지우지 못하게 막는다.
export async function removeAiLogImage(
  clubId: string,
  attachmentId: string
): Promise<ImageActionResult> {
  await requireUser()
  if (!isUuid(clubId) || !isUuid(attachmentId)) {
    return { ok: false, message: REMOVE_NOT_ALLOWED_MESSAGE }
  }

  const supabase = await createClient()
  const { data: row, error: readError } = await supabase
    .from("ai_log_attachments")
    .select("path, log_id")
    .eq("club_id", clubId)
    .eq("id", attachmentId)
    .maybeSingle()

  if (readError) {
    if (isMissingTable(readError)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    console.error("지울 이미지를 읽지 못했습니다.", readError)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (!row) {
    return { ok: false, message: REMOVE_NOT_ALLOWED_MESSAGE }
  }

  if (!(await removeAiLogImageFiles(supabase, [String(row.path)]))) {
    return { ok: false, message: RETRY_MESSAGE }
  }

  const { data, error } = await supabase
    .from("ai_log_attachments")
    .delete()
    .eq("club_id", clubId)
    .eq("id", attachmentId)
    .select("id")

  if (error) {
    console.error("이미지의 줄을 지우지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  // 접근 규칙에 막히면 오류 없이 지워진 행이 0개로 돌아온다.
  if (data.length === 0) {
    return { ok: false, message: REMOVE_NOT_ALLOWED_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}/logs/${String(row.log_id)}`)
  return { ok: true }
}
