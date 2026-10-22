"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { isListedDoc } from "@/features/docs/catalog"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import {
  validateSession,
  type SessionInput,
  type SessionInputErrors,
} from "./rules"

export type SessionFormState = {
  status: "idle" | "error" | "success"
  message?: string
  errors?: SessionInputErrors
  values?: SessionInput
}

export type SessionDeleteResult = { ok: true } | { ok: false; message: string }

export type SessionTarget = {
  clubId: string
  // 있으면 그 Session 을 고치고, 없으면 새로 만든다.
  sessionId?: string
}

const RETRY_MESSAGE =
  "잠시 뒤 다시 시도해 주세요. 입력한 내용은 그대로 남아 있습니다."
const ADMIN_ONLY_MESSAGE =
  "운영자만 Session 을 만들거나 고칠 수 있습니다. 역할이 바뀌었는지 운영자에게 확인해 주세요."
// 날짜 미정을 받는 마이그레이션을 아직 적용하지 않은 데이터베이스는 빈 시각을 거부한다(23502).
const UNDECIDED_NOT_READY_MESSAGE =
  "데이터베이스에 날짜 미정을 받는 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요. 입력한 내용은 그대로 남아 있습니다."

const DELETE_RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
// 지우는 권한 자체가 없을 때의 안내. 접근 규칙에 막힌 경우는 오류 없이 0개가 돌아오므로,
// 이 오류는 데이터베이스에 삭제 규칙이 아직 적용되지 않았다는 뜻이다.
const DELETE_NOT_READY_MESSAGE =
  "데이터베이스에 삭제 규칙이 아직 적용되지 않았습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const DELETE_ADMIN_ONLY_MESSAGE =
  "운영자만 Session 을 지울 수 있습니다. 이미 지워졌거나 내 역할이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

// 누가 할 수 있는지는 데이터베이스의 접근 규칙이 판단한다. 운영자가 아니면 거부된다.
export async function saveSession(
  target: SessionTarget,
  _previous: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const values: SessionInput = {
    title: text(formData, "title"),
    // 날짜 미정을 켜면 시작과 종료를 함께 비워 저장한다. 그때도 칸에 남은 날짜와 시각은 돌려주어 다시 그린다.
    dateUndecided: formData.get("dateUndecided") === "1",
    date: text(formData, "date"),
    startTime: text(formData, "startTime"),
    endTime: text(formData, "endTime"),
    location: text(formData, "location"),
    description: text(formData, "description"),
    agenda: String(formData.get("agenda") ?? "")
      .replace(/\r\n?/g, "\n")
      .trim(),
  }
  // 시간표 칸이 화면에 있었을 때만 그 값을 보낸다.
  // 데이터베이스에 시간표 열이 아직 없으면 칸이 나오지 않고, 그때는 보내지 않아야 저장이 된다.
  const withAgenda = formData.get("agendaField") === "1"

  const validation = validateSession(values)
  if (!validation.ok) {
    return { status: "error", errors: validation.errors, values }
  }

  const fields = {
    title: values.title,
    description: values.description,
    location: values.location,
    ...(withAgenda && { agenda: values.agenda }),
    starts_at: validation.startsAt,
    ends_at: validation.endsAt,
  }

  const supabase = await createClient()

  if (target.sessionId) {
    const { data, error } = await supabase
      .from("sessions")
      .update(fields)
      .eq("club_id", target.clubId)
      .eq("id", target.sessionId)
      .select("id")

    if (error) {
      if (error.code === "23502" && values.dateUndecided) {
        return { status: "error", message: UNDECIDED_NOT_READY_MESSAGE, values }
      }
      console.error("Session 을 고치지 못했습니다.", error)
      return { status: "error", message: RETRY_MESSAGE, values }
    }
    // 접근 규칙에 막히면 오류 없이 바뀐 행이 0개로 돌아온다.
    if (data.length === 0) {
      return { status: "error", message: ADMIN_ONLY_MESSAGE, values }
    }
  } else {
    const { error } = await supabase
      .from("sessions")
      .insert({ club_id: target.clubId, ...fields })

    if (error) {
      if (error.code === "23502" && values.dateUndecided) {
        return { status: "error", message: UNDECIDED_NOT_READY_MESSAGE, values }
      }
      console.error("Session 을 만들지 못했습니다.", error)
      return {
        status: "error",
        message: error.code === "42501" ? ADMIN_ONLY_MESSAGE : RETRY_MESSAGE,
        values,
      }
    }
  }

  // Club 개요와 Session 화면이 모두 Session 을 보여 주므로 Club 아래를 통째로 새로 읽는다.
  revalidatePath(`/clubs/${target.clubId}`, "layout")
  return { status: "success" }
}

// Session 을 지운다. 지우면 되살릴 수 없다. 성공하면 Session 목록으로 이동한다.
// 그 회차의 Attendance 는 함께 지워지고, AI Log 는 Session 연결만 비워진 채 Club 의 기록으로 남는다.
// 운영자만 지울 수 있고, 그 판단은 데이터베이스의 접근 규칙이 한다.
export async function deleteSession(
  clubId: string,
  sessionId: string
): Promise<SessionDeleteResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(sessionId)) {
    return { ok: false, message: DELETE_ADMIN_ONLY_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sessions")
    .delete()
    .eq("club_id", clubId)
    .eq("id", sessionId)
    .select("id")

  if (error) {
    console.error("Session 을 지우지 못했습니다.", error)
    return {
      ok: false,
      message:
        error.code === "42501" ? DELETE_NOT_READY_MESSAGE : DELETE_RETRY_MESSAGE,
    }
  }
  // 접근 규칙에 막히면 오류 없이 지워진 행이 0개로 돌아온다.
  if (data.length === 0) {
    return { ok: false, message: DELETE_ADMIN_ONLY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  redirect(`/clubs/${clubId}/sessions`)
}

export type SessionDocResult = { ok: true } | { ok: false; message: string }

const DOC_NOT_READY_MESSAGE =
  "데이터베이스에 참고 자료를 잇는 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const DOC_ADMIN_ONLY_MESSAGE =
  "운영자만 참고 자료를 가져오거나 뺄 수 있습니다. 역할이 바뀌었을 수 있으니 화면을 새로 고쳐 확인해 주세요."
const DOC_GONE_MESSAGE =
  "그 문서나 Session 을 찾을 수 없습니다. 지워졌을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."

// 테이블이 아직 없을 때의 오류 번호. 뒤의 것은 데이터 API 가 테이블을 모를 때다.
function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

// Docs 의 문서를 이 회차의 참고 자료로 가져온다. 운영자만 할 수 있고, 그 판단은 데이터베이스의 접근 규칙이 한다.
// Docs 목록에 있는 문서만 받는다.
export async function linkSessionDoc(
  clubId: string,
  sessionId: string,
  slug: string
): Promise<SessionDocResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(sessionId) || !isListedDoc(slug)) {
    return { ok: false, message: DOC_GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("session_docs")
    .insert({ club_id: clubId, session_id: sessionId, doc_slug: slug })

  // 23505 는 이미 가져온 것이다. 바라던 상태이므로 성공으로 본다.
  if (error && error.code !== "23505") {
    if (isMissingTable(error)) {
      return { ok: false, message: DOC_NOT_READY_MESSAGE }
    }
    if (error.code === "42501") {
      return { ok: false, message: DOC_ADMIN_ONLY_MESSAGE }
    }
    // 23503 은 Session 이 없거나 다른 Club 의 것이다.
    if (error.code === "23503") {
      return { ok: false, message: DOC_GONE_MESSAGE }
    }
    console.error("Session 에 참고 자료를 가져오지 못했습니다.", error)
    return { ok: false, message: DELETE_RETRY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}/sessions/${sessionId}`)
  return { ok: true }
}

// 이 회차의 참고 자료에서 문서를 뺀다. Docs 의 문서는 그대로 남는다. 운영자만 할 수 있다.
export async function unlinkSessionDoc(
  clubId: string,
  sessionId: string,
  slug: string
): Promise<SessionDocResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(sessionId)) {
    return { ok: false, message: DOC_GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("session_docs")
    .delete()
    .eq("club_id", clubId)
    .eq("session_id", sessionId)
    .eq("doc_slug", slug)
    .select("doc_slug")

  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, message: DOC_NOT_READY_MESSAGE }
    }
    console.error("Session 의 참고 자료를 빼지 못했습니다.", error)
    return { ok: false, message: DELETE_RETRY_MESSAGE }
  }
  // 접근 규칙에 막혔거나 이미 뺀 것이면 오류 없이 0개가 돌아온다.
  if (data.length === 0) {
    return { ok: false, message: DOC_ADMIN_ONLY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}/sessions/${sessionId}`)
  return { ok: true }
}
