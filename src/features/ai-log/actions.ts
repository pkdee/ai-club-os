"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import { removeAiLogImagesOf } from "./image-store"
import { listClubTools } from "./queries"
import {
  AI_LOG_TOOL_NAME_MAX,
  canonicalTools,
  normalizeTools,
  readAiLogForm,
  readAiLogOptions,
  validateAiLog,
  type AiLogInput,
  type AiLogInputErrors,
  type AiLogOptions,
} from "./rules"

export type AiLogFormState = {
  status: "idle" | "error" | "success"
  message?: string
  errors?: AiLogInputErrors
  values?: AiLogInput
  // 폼에서 고른 선택. 선택 칸이 화면에 있었을 때만 돌려준다.
  options?: AiLogOptions
  // 저장에 성공했을 때 그 기록의 식별자.
  logId?: string
}

export type AiLogDeleteResult = { ok: true } | { ok: false; message: string }

export type ToolMergeResult =
  // changed 는 도구 이름이 바뀐 기록의 수다.
  | { ok: true; changed: number }
  | { ok: false; message: string }

export type AiLogTarget = {
  clubId: string
  // 있으면 그 기록을 고치고, 없으면 새로 남긴다.
  logId?: string
}

const RETRY_MESSAGE =
  "잠시 뒤 다시 시도해 주세요. 입력한 내용은 그대로 남아 있습니다."
const MEMBER_ONLY_MESSAGE =
  "이 Club 의 Member 만 AI Log 를 남길 수 있습니다. 소속이 바뀌었는지 운영자에게 확인해 주세요."
const AUTHOR_ONLY_MESSAGE =
  "작성자 본인만 고칠 수 있습니다. 기록이 없어졌거나 다른 계정으로 로그인했는지 확인해 주세요."
const DELETE_RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
// 지우는 권한 자체가 없을 때의 안내. 접근 규칙에 막힌 경우는 오류 없이 0개가 돌아오므로,
// 이 오류는 데이터베이스에 삭제 규칙이 아직 적용되지 않았다는 뜻이다.
const DELETE_NOT_READY_MESSAGE =
  "데이터베이스에 삭제 규칙이 아직 적용되지 않았습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const DELETE_NOT_ALLOWED_MESSAGE =
  "작성자와 운영자만 지울 수 있습니다. 이미 지워졌거나 내 역할이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const SESSION_GONE_MESSAGE =
  "고른 Session 을 찾을 수 없습니다. Session 을 다시 고른 뒤 저장해 주세요."
const PROJECT_GONE_MESSAGE =
  "고른 Project 를 찾을 수 없습니다. Project 를 다시 고른 뒤 저장해 주세요."
const PROJECT_NOT_ALLOWED_MESSAGE =
  "참여하는 Project 에만 AI Log 를 묶을 수 있습니다. Project 를 다시 고른 뒤 저장해 주세요."

// 저장하지 못한 까닭을 고른다. Project 를 묶는 규칙에 걸린 것과 Session 이나 Project 가 없어진 것을 가려낸다.
function saveErrorMessage(
  error: { code?: string; message?: string; details?: string },
  denied: string
) {
  const text = `${error.message ?? ""} ${error.details ?? ""}`
  if (error.code === "42501") {
    return text.includes("Project") ? PROJECT_NOT_ALLOWED_MESSAGE : denied
  }
  if (error.code === "23503") {
    return text.includes("ai_logs_project_fkey")
      ? PROJECT_GONE_MESSAGE
      : SESSION_GONE_MESSAGE
  }
  return RETRY_MESSAGE
}

// 저장에 성공하면 그 기록의 식별자를 돌려준다. 화면이 쓰다 만 내용을 지운 뒤 상세로 이동한다.
// 누가 할 수 있는지는 데이터베이스의 접근 규칙이 판단한다.
export async function saveAiLog(
  target: AiLogTarget,
  _previous: AiLogFormState,
  formData: FormData
): Promise<AiLogFormState> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const values = readAiLogForm(formData)
  const options = readAiLogOptions(formData)
  // 다시 그릴 때 적은 값과 고른 선택이 그대로 보이게 함께 돌려준다.
  const kept = { values, ...(options && { options }) }

  const validation = validateAiLog(values)
  if (!validation.ok) {
    return { status: "error", errors: validation.errors, ...kept }
  }

  // 같은 도구가 표기만 달리 쌓이지 않게, Club 에서 이미 쓰는 표기가 있으면 그것에 맞춘다.
  // 목록을 불러오지 못하면 입력한 그대로 저장한다.
  const known = await listClubTools(target.clubId)
  const tools =
    known.status === "ok"
      ? canonicalTools(
          values.tools,
          known.tools.map((tool) => tool.name)
        )
      : values.tools

  // Project 를 고르는 칸이 화면에 있었을 때만 그 값을 보낸다.
  // 데이터베이스에 Project 연결이 아직 없으면 칸이 나오지 않고, 그때는 이 값을 보내지 않아야 저장이 된다.
  const withProject = formData.get("projectField") === "1"
  const fields = {
    session_id: values.sessionId || null,
    ...(withProject && { project_id: values.projectId || null }),
    ...(options && {
      exclude_from_insight: options.excludeFromInsight,
      share_in_presentation: options.shareInPresentation,
    }),
    title: values.title,
    tools,
    attempt: values.attempt,
    result: values.result,
    learned: values.learned,
    next_action: values.nextAction,
  }

  const supabase = await createClient()
  let logId = target.logId

  if (logId) {
    if (!isUuid(logId)) {
      return { status: "error", message: AUTHOR_ONLY_MESSAGE, ...kept }
    }

    const { data, error } = await supabase
      .from("ai_logs")
      .update(fields)
      .eq("club_id", target.clubId)
      .eq("id", logId)
      .select("id")

    if (error) {
      console.error("AI Log 를 고치지 못했습니다.", error)
      return {
        status: "error",
        message: saveErrorMessage(error, AUTHOR_ONLY_MESSAGE),
        ...kept,
      }
    }
    // 접근 규칙에 막히면 오류 없이 바뀐 행이 0개로 돌아온다.
    if (data.length === 0) {
      return { status: "error", message: AUTHOR_ONLY_MESSAGE, ...kept }
    }
  } else {
    const { data, error } = await supabase
      .from("ai_logs")
      .insert({ club_id: target.clubId, ...fields })
      .select("id")
      .single()

    if (error) {
      console.error("AI Log 를 남기지 못했습니다.", error)
      return {
        status: "error",
        message: saveErrorMessage(error, MEMBER_ONLY_MESSAGE),
        ...kept,
      }
    }
    logId = (data as { id: string }).id
  }

  // Club 개요, Session 상세, AI Log 화면이 모두 기록을 보여 주므로 Club 아래를 통째로 새로 읽는다.
  revalidatePath(`/clubs/${target.clubId}`, "layout")
  // 이동하기 전에 폼이 처음 값으로 돌아가 보이지 않도록 적은 값을 함께 돌려준다.
  return { status: "success", logId, ...kept }
}

// AI Log 를 지운다. 지우면 되살릴 수 없다. 성공하면 AI Log 목록으로 이동한다.
// 작성자 본인과 운영자만 지울 수 있고, 그 판단은 데이터베이스의 접근 규칙이 한다.
const DELETE_IMAGES_MESSAGE =
  "붙인 이미지를 지우지 못해 기록을 그대로 두었습니다. 잠시 뒤 다시 시도해 주세요."

export async function deleteAiLog(
  clubId: string,
  logId: string
): Promise<AiLogDeleteResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(logId)) {
    return { ok: false, message: DELETE_NOT_ALLOWED_MESSAGE }
  }

  const supabase = await createClient()
  // 붙인 이미지의 파일을 먼저 지운다. 기록을 지우면 목록의 줄이 함께 지워져서 파일을 찾을 길이 없어진다.
  // 지울 수 없는 사람이 부르면 Storage 의 접근 규칙이 파일을 그대로 둔다.
  if (!(await removeAiLogImagesOf(supabase, { clubId, logId }))) {
    return { ok: false, message: DELETE_IMAGES_MESSAGE }
  }

  const { data, error } = await supabase
    .from("ai_logs")
    .delete()
    .eq("club_id", clubId)
    .eq("id", logId)
    .select("id")

  if (error) {
    // 23503 은 파일이 남아 있는 이미지가 있어 데이터베이스가 막은 것이다.
    if (error.code === "23503") {
      return { ok: false, message: DELETE_IMAGES_MESSAGE }
    }
    console.error("AI Log 를 지우지 못했습니다.", error)
    return {
      ok: false,
      message:
        error.code === "42501" ? DELETE_NOT_READY_MESSAGE : DELETE_RETRY_MESSAGE,
    }
  }
  // 접근 규칙에 막히면 오류 없이 지워진 행이 0개로 돌아온다.
  if (data.length === 0) {
    return { ok: false, message: DELETE_NOT_ALLOWED_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  redirect(`/clubs/${clubId}/logs`)
}

const TOOL_MERGE_ADMIN_ONLY_MESSAGE =
  "운영자만 도구 표기를 합칠 수 있습니다. 내 역할이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const TOOL_MERGE_NOT_READY_MESSAGE =
  "도구 표기를 합치는 기능을 아직 쓸 수 없습니다. 데이터베이스에 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."

// 이 Club 의 모든 기록에서 도구 이름 from 을 to 로 바꾼다. 운영자만 할 수 있고, 그 판단은 데이터베이스가 한다.
// 남의 기록의 도구 이름도 바뀌지만 내용을 고친 것이 아니어서 고친 시각과 수정 기록은 그대로다.
export async function mergeToolSpelling(
  clubId: string,
  from: string,
  to: string
): Promise<ToolMergeResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const [target] = normalizeTools([String(to ?? "")])
  if (!target || Array.from(target).length > AI_LOG_TOOL_NAME_MAX) {
    return {
      ok: false,
      message: `도구 이름은 쉼표 없이 1자 이상 ${AI_LOG_TOOL_NAME_MAX}자 이하로 적어 주세요.`,
    }
  }
  const source = String(from ?? "")
  if (source === "" || source === target) {
    return { ok: true, changed: 0 }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("rename_club_tool", {
    target_club_id: clubId,
    from_name: source,
    to_name: target,
  })

  if (error) {
    if (error.code === "PGRST202" || error.code === "42883") {
      return { ok: false, message: TOOL_MERGE_NOT_READY_MESSAGE }
    }
    if (error.code === "42501") {
      return { ok: false, message: TOOL_MERGE_ADMIN_ONLY_MESSAGE }
    }
    console.error("도구 표기를 합치지 못했습니다.", error)
    return { ok: false, message: DELETE_RETRY_MESSAGE }
  }

  // 도구 이름은 기록 목록과 요약, 걸러 보기에 모두 쓰이므로 Club 아래를 통째로 새로 읽는다.
  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true, changed: typeof data === "number" ? data : 0 }
}
