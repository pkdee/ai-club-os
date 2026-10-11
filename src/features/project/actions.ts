"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import {
  PROJECT_LINK_LIMIT,
  PROJECT_TASK_LIMIT,
  isDueDate,
  isProjectStatus,
  linkLabelError,
  linkUrlError,
  taskTitleError,
  validateProject,
  type ProjectInput,
  type ProjectInputErrors,
  type ProjectStatus,
} from "./rules"

export type ProjectFormState = {
  status: "idle" | "error" | "success"
  message?: string
  errors?: ProjectInputErrors
  values?: ProjectInput
  // 만들기에 성공했을 때 그 Project 의 식별자.
  projectId?: string
}

export type ProjectActionResult = { ok: true } | { ok: false; message: string }

export type ProjectTarget = {
  clubId: string
  // 있으면 그 Project 를 고치고, 없으면 새로 만든다.
  projectId?: string
}

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
const FORM_RETRY_MESSAGE =
  "잠시 뒤 다시 시도해 주세요. 입력한 내용은 그대로 남아 있습니다."
const MEMBER_ONLY_MESSAGE =
  "이 Club 의 Member 만 Project 를 만들 수 있습니다. 소속이 바뀌었는지 운영자에게 확인해 주세요."
const EDITOR_ONLY_MESSAGE =
  "이 Project 의 참여자와 운영자만 할 수 있는 일입니다. 참여가 끝났거나 Project 가 지워졌을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const DELETE_NOT_ALLOWED_MESSAGE =
  "만든 사람과 운영자만 Project 를 지울 수 있습니다. 이미 지워졌거나 내 역할이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
// 테이블이 아직 없을 때의 안내.
const NOT_READY_MESSAGE =
  "데이터베이스에 Project 의 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const ALREADY_PARTICIPANT_MESSAGE = "이미 참여하고 있는 Member 입니다."
const MEMBER_GONE_MESSAGE =
  "그 Member 를 찾을 수 없습니다. Club 에서 나갔을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const ASSIGNEE_NOT_PARTICIPANT_MESSAGE =
  "이 Project 의 참여자에게만 할 일을 맡길 수 있습니다. 담당자를 다시 골라 주세요."
const DUE_DATE_MESSAGE = "기한은 날짜로 골라 주세요."
const TASK_DETAILS_NOT_READY_MESSAGE =
  "데이터베이스에 할 일의 담당자와 기한이 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const REQUEST_NOT_READY_MESSAGE =
  "데이터베이스에 참여 요청의 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const REQUEST_NOT_ALLOWED_MESSAGE =
  "참여를 요청할 수 없습니다. 이미 참여하고 있거나 이 Club 의 Member 가 아닐 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const REQUEST_GONE_MESSAGE =
  "그 요청을 찾을 수 없습니다. 요청한 사람이 거뒀거나 다른 사람이 먼저 처리했을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."

function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

// 접근 규칙이나 권한에 막혔을 때의 오류 번호.
function isDenied(error: { code?: string }) {
  return error.code === "42501"
}

async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

// Project 를 만들거나 이름과 목표를 고친다. 누가 할 수 있는지는 데이터베이스의 접근 규칙이 판단한다.
export async function saveProject(
  target: ProjectTarget,
  _previous: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireUser()

  const values: ProjectInput = {
    name: String(formData.get("name") ?? "").trim(),
    goal: String(formData.get("goal") ?? "")
      .replace(/\r\n?/g, "\n")
      .trim(),
  }
  const errors = validateProject(values)
  if (errors) {
    return { status: "error", errors, values }
  }

  const supabase = await createClient()

  if (target.projectId) {
    if (!isUuid(target.projectId)) {
      return { status: "error", message: EDITOR_ONLY_MESSAGE, values }
    }

    const { data, error } = await supabase
      .from("projects")
      .update(values)
      .eq("club_id", target.clubId)
      .eq("id", target.projectId)
      .select("id")

    if (error) {
      console.error("Project 를 고치지 못했습니다.", error)
      return { status: "error", message: FORM_RETRY_MESSAGE, values }
    }
    // 접근 규칙에 막히면 오류 없이 바뀐 행이 0개로 돌아온다.
    if (data.length === 0) {
      return { status: "error", message: EDITOR_ONLY_MESSAGE, values }
    }

    revalidatePath(`/clubs/${target.clubId}`, "layout")
    return { status: "success", values, projectId: target.projectId }
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ club_id: target.clubId, ...values })
    .select("id")
    .single()

  if (error) {
    console.error("Project 를 만들지 못했습니다.", error)
    return {
      status: "error",
      message: isMissingTable(error)
        ? NOT_READY_MESSAGE
        : isDenied(error)
          ? MEMBER_ONLY_MESSAGE
          : FORM_RETRY_MESSAGE,
      values,
    }
  }

  revalidatePath(`/clubs/${target.clubId}`, "layout")
  return {
    status: "success",
    values,
    projectId: (data as { id: string }).id,
  }
}

// 진행 상태를 바꾼다. 참여자와 운영자만 할 수 있다.
export async function setProjectStatus(
  clubId: string,
  projectId: string,
  status: ProjectStatus
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(projectId) || !isProjectStatus(status)) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .update({ status })
    .eq("club_id", clubId)
    .eq("id", projectId)
    .select("id")

  if (error) {
    console.error("Project 의 진행 상태를 바꾸지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// Project 를 지운다. 참여자, 링크, 할 일이 함께 지워지고 묶여 있던 AI Log 는 연결만 비워진 채 남는다.
// 만든 사람과 운영자만 지울 수 있다. 성공하면 Project 목록으로 이동한다.
export async function deleteProject(
  clubId: string,
  projectId: string
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(projectId)) {
    return { ok: false, message: DELETE_NOT_ALLOWED_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("club_id", clubId)
    .eq("id", projectId)
    .select("id")

  if (error) {
    console.error("Project 를 지우지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: DELETE_NOT_ALLOWED_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  redirect(`/clubs/${clubId}/projects`)
}

// Member 를 참여자로 넣는다. 참여자와 운영자만 할 수 있고, 같은 Club 의 Member 만 넣을 수 있다.
export async function addProjectParticipant(
  clubId: string,
  projectId: string,
  memberId: string
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(projectId) || !isUuid(memberId)) {
    return { ok: false, message: MEMBER_GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, club_id: clubId, member_id: memberId })

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: ALREADY_PARTICIPANT_MESSAGE }
    }
    // 23503 은 그 Member 나 Project 가 그사이 없어진 경우다.
    if (error.code === "23503") {
      return { ok: false, message: MEMBER_GONE_MESSAGE }
    }
    console.error("참여자를 넣지 못했습니다.", error)
    return {
      ok: false,
      message: isDenied(error) ? EDITOR_ONLY_MESSAGE : RETRY_MESSAGE,
    }
  }

  // 그 사람이 보내 둔 참여 요청이 있으면 함께 치운다. 치우지 못해도 참여는 이미 됐으므로 성공으로 본다.
  await clearJoinRequest(clubId, projectId, memberId)

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// 참여 요청 한 줄을 지운다. 구조가 아직 없을 때의 오류는 남기지 않는다.
async function clearJoinRequest(
  clubId: string,
  projectId: string,
  memberId: string
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_join_requests")
    .delete()
    .eq("club_id", clubId)
    .eq("project_id", projectId)
    .eq("member_id", memberId)
    .select("member_id")

  if (error && !isMissingTable(error)) {
    console.error("참여 요청을 치우지 못했습니다.", error)
  }
  return { error, removed: data?.length ?? 0 }
}

// 내 Member 식별자를 읽는다. 이 Club 의 Member 가 아니면 null 이다.
async function myMemberId(clubId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("members")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

// Project 에 참여하고 싶다고 요청한다. 참여자나 운영자가 받아 주면 참여자가 된다.
export async function requestToJoinProject(
  clubId: string,
  projectId: string
): Promise<ProjectActionResult> {
  const user = await requireUser()
  if (!isUuid(projectId)) {
    return { ok: false, message: REQUEST_NOT_ALLOWED_MESSAGE }
  }

  const memberId = await myMemberId(clubId, user.id)
  if (!memberId) {
    return { ok: false, message: REQUEST_NOT_ALLOWED_MESSAGE }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("project_join_requests")
    .insert({ project_id: projectId, club_id: clubId, member_id: memberId })

  // 23505 는 이미 요청해 둔 경우다. 바라는 상태가 됐으므로 성공으로 본다.
  if (error && error.code !== "23505") {
    if (isMissingTable(error)) {
      return { ok: false, message: REQUEST_NOT_READY_MESSAGE }
    }
    console.error("참여를 요청하지 못했습니다.", error)
    return {
      ok: false,
      message:
        isDenied(error) || error.code === "23503"
          ? REQUEST_NOT_ALLOWED_MESSAGE
          : RETRY_MESSAGE,
    }
  }

  revalidatePath(`/clubs/${clubId}/projects/${projectId}`)
  return { ok: true }
}

// 내가 보낸 참여 요청을 거둔다.
export async function cancelJoinRequest(
  clubId: string,
  projectId: string
): Promise<ProjectActionResult> {
  const user = await requireUser()
  if (!isUuid(projectId)) {
    return { ok: false, message: REQUEST_GONE_MESSAGE }
  }

  const memberId = await myMemberId(clubId, user.id)
  if (!memberId) {
    return { ok: false, message: REQUEST_GONE_MESSAGE }
  }

  const { error } = await clearJoinRequest(clubId, projectId, memberId)
  if (error) {
    return { ok: false, message: RETRY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}/projects/${projectId}`)
  return { ok: true }
}

// 참여 요청을 받아 준다. 요청한 사람을 참여자로 넣고 요청을 치운다. 참여자와 운영자만 할 수 있다.
export async function acceptJoinRequest(
  clubId: string,
  projectId: string,
  memberId: string
): Promise<ProjectActionResult> {
  const result = await addProjectParticipant(clubId, projectId, memberId)
  // 이미 참여자인 사람의 요청이 남아 있던 것이면 요청만 치우면 된다.
  if (!result.ok && result.message === ALREADY_PARTICIPANT_MESSAGE) {
    await clearJoinRequest(clubId, projectId, memberId)
    revalidatePath(`/clubs/${clubId}`, "layout")
    return { ok: true }
  }
  return result
}

// 참여 요청을 거절한다. 요청만 지우고 요청한 사람에게 따로 알리지는 않는다. 참여자와 운영자만 할 수 있다.
export async function declineJoinRequest(
  clubId: string,
  projectId: string,
  memberId: string
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(projectId) || !isUuid(memberId)) {
    return { ok: false, message: REQUEST_GONE_MESSAGE }
  }

  const { error, removed } = await clearJoinRequest(clubId, projectId, memberId)
  if (error) {
    return { ok: false, message: RETRY_MESSAGE }
  }
  // 접근 규칙에 막혔거나 이미 없는 요청이면 오류 없이 0개가 돌아온다.
  if (removed === 0) {
    return { ok: false, message: REQUEST_GONE_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}/projects/${projectId}`)
  return { ok: true }
}

// 참여자를 뺀다. 참여자와 운영자가 다른 사람을 빼고, 누구나 스스로 빠질 수 있다.
export async function removeProjectParticipant(
  clubId: string,
  projectId: string,
  memberId: string
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(projectId) || !isUuid(memberId)) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_members")
    .delete()
    .eq("club_id", clubId)
    .eq("project_id", projectId)
    .eq("member_id", memberId)
    .select("member_id")

  if (error) {
    console.error("참여자를 빼지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// 지금 있는 수가 한도에 닿았는지 본다. 세지 못하면 넣어 보게 둔다.
async function isFull(
  table: "project_links" | "project_tasks",
  clubId: string,
  projectId: string,
  limit: number
) {
  const supabase = await createClient()
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .eq("project_id", projectId)
  return (count ?? 0) >= limit
}

// 결과물 링크를 넣는다. http 와 https 주소만 받는다.
export async function addProjectLink(
  clubId: string,
  projectId: string,
  input: { label: string; url: string }
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(projectId)) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  const label = String(input.label ?? "").trim()
  const url = String(input.url ?? "").trim()
  const invalid = linkLabelError(label) ?? linkUrlError(url)
  if (invalid) {
    return { ok: false, message: invalid }
  }
  if (await isFull("project_links", clubId, projectId, PROJECT_LINK_LIMIT)) {
    return {
      ok: false,
      message: `링크는 ${PROJECT_LINK_LIMIT}개까지 둘 수 있습니다. 쓰지 않는 링크를 지운 뒤 넣어 주세요.`,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("project_links")
    .insert({ project_id: projectId, club_id: clubId, label, url })

  if (error) {
    console.error("링크를 넣지 못했습니다.", error)
    return {
      ok: false,
      message: isDenied(error) ? EDITOR_ONLY_MESSAGE : RETRY_MESSAGE,
    }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

export async function removeProjectLink(
  clubId: string,
  linkId: string
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(linkId)) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_links")
    .delete()
    .eq("club_id", clubId)
    .eq("id", linkId)
    .select("id")

  if (error) {
    console.error("링크를 지우지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

export async function addProjectTask(
  clubId: string,
  projectId: string,
  title: string
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(projectId)) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  const trimmed = String(title ?? "").trim()
  const invalid = taskTitleError(trimmed)
  if (invalid) {
    return { ok: false, message: invalid }
  }
  if (await isFull("project_tasks", clubId, projectId, PROJECT_TASK_LIMIT)) {
    return {
      ok: false,
      message: `할 일은 ${PROJECT_TASK_LIMIT}개까지 둘 수 있습니다. 끝낸 것을 지운 뒤 넣어 주세요.`,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("project_tasks")
    .insert({ project_id: projectId, club_id: clubId, title: trimmed })

  if (error) {
    console.error("할 일을 넣지 못했습니다.", error)
    return {
      ok: false,
      message: isDenied(error) ? EDITOR_ONLY_MESSAGE : RETRY_MESSAGE,
    }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// 할 일을 끝냈다고 표시하거나 되돌린다.
export async function setProjectTaskDone(
  clubId: string,
  taskId: string,
  done: boolean
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(taskId)) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_tasks")
    .update({ done: Boolean(done) })
    .eq("club_id", clubId)
    .eq("id", taskId)
    .select("id")

  if (error) {
    console.error("할 일을 바꾸지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

export async function removeProjectTask(
  clubId: string,
  taskId: string
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(taskId)) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_tasks")
    .delete()
    .eq("club_id", clubId)
    .eq("id", taskId)
    .select("id")

  if (error) {
    console.error("할 일을 지우지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// 할 일의 글, 담당자, 기한을 고친다. 담당자는 그 Project 의 참여자여야 하고, 그 판단은 데이터베이스가 한다.
// assigneeMemberId 와 dueOn 은 비어 있으면 비운다.
export async function updateProjectTask(
  clubId: string,
  taskId: string,
  input: { title: string; assigneeMemberId: string; dueOn: string }
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(taskId)) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  const title = String(input.title ?? "").trim()
  const invalid = taskTitleError(title)
  if (invalid) {
    return { ok: false, message: invalid }
  }
  const assigneeMemberId = String(input.assigneeMemberId ?? "")
  if (assigneeMemberId && !isUuid(assigneeMemberId)) {
    return { ok: false, message: ASSIGNEE_NOT_PARTICIPANT_MESSAGE }
  }
  const dueOn = String(input.dueOn ?? "")
  if (dueOn && !isDueDate(dueOn)) {
    return { ok: false, message: DUE_DATE_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("project_tasks")
    .update({
      title,
      assignee_member_id: assigneeMemberId || null,
      due_on: dueOn || null,
    })
    .eq("club_id", clubId)
    .eq("id", taskId)
    .select("id")

  if (error) {
    // PGRST204 와 42703 은 담당자와 기한 열이 아직 없을 때다.
    if (error.code === "PGRST204" || error.code === "42703") {
      return { ok: false, message: TASK_DETAILS_NOT_READY_MESSAGE }
    }
    // 23514 는 참여자가 아닌 사람에게 맡기려 한 경우, 23503 은 그 Member 가 그사이 나간 경우다.
    if (error.code === "23514" || error.code === "23503") {
      return { ok: false, message: ASSIGNEE_NOT_PARTICIPANT_MESSAGE }
    }
    console.error("할 일을 고치지 못했습니다.", error)
    return {
      ok: false,
      message: isDenied(error) ? EDITOR_ONLY_MESSAGE : RETRY_MESSAGE,
    }
  }
  if (data.length === 0) {
    return { ok: false, message: EDITOR_ONLY_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

const LINK_NOT_READY_MESSAGE =
  "데이터베이스에 Session 과 Project 를 잇는 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const LINK_NOT_ALLOWED_MESSAGE =
  "운영자와 그 Project 의 참여자만 Session 에 잇고 끊을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const LINK_GONE_MESSAGE =
  "그 Session 이나 Project 를 찾을 수 없습니다. 지워졌을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."

// Session 과 Project 는 서로의 화면에 보이므로 두 화면을 함께 새로 읽는다.
function refreshLink(clubId: string, sessionId: string, projectId: string) {
  revalidatePath(`/clubs/${clubId}/sessions/${sessionId}`, "layout")
  revalidatePath(`/clubs/${clubId}/projects/${projectId}`)
}

// Session 에서 다룰 Project 를 잇는다. 운영자는 어느 Project 든, 참여자는 자기 Project 를 잇는다.
export async function linkSessionProject(
  clubId: string,
  sessionId: string,
  projectId: string
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(sessionId) || !isUuid(projectId)) {
    return { ok: false, message: LINK_GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("session_projects").insert({
    club_id: clubId,
    session_id: sessionId,
    project_id: projectId,
  })

  // 23505 는 이미 이어 둔 것이다. 바라던 상태이므로 성공으로 본다.
  if (error && error.code !== "23505") {
    if (isMissingTable(error)) {
      return { ok: false, message: LINK_NOT_READY_MESSAGE }
    }
    if (isDenied(error)) {
      return { ok: false, message: LINK_NOT_ALLOWED_MESSAGE }
    }
    // 23503 은 Session 이나 Project 가 없거나 다른 Club 의 것이다.
    if (error.code === "23503") {
      return { ok: false, message: LINK_GONE_MESSAGE }
    }
    console.error("Session 과 Project 를 잇지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }

  refreshLink(clubId, sessionId, projectId)
  return { ok: true }
}

// Project 화면에서 Session 을 골라 잇는다. 고른 값이 마지막 인자로 오도록 순서만 바꾼 것이다.
export async function linkProjectSession(
  clubId: string,
  projectId: string,
  sessionId: string
): Promise<ProjectActionResult> {
  return linkSessionProject(clubId, sessionId, projectId)
}

// 이어 둔 것을 끊는다. 이을 수 있는 사람이 끊는다. 기록으로 이어진 것은 여기서 끊을 수 없다.
export async function unlinkSessionProject(
  clubId: string,
  sessionId: string,
  projectId: string
): Promise<ProjectActionResult> {
  await requireUser()
  if (!isUuid(sessionId) || !isUuid(projectId)) {
    return { ok: false, message: LINK_GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("session_projects")
    .delete()
    .eq("club_id", clubId)
    .eq("session_id", sessionId)
    .eq("project_id", projectId)
    .select("session_id")

  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, message: LINK_NOT_READY_MESSAGE }
    }
    console.error("Session 과 Project 를 끊지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  // 접근 규칙에 막혔거나 이미 끊긴 것이면 오류 없이 0개가 돌아온다.
  if (data.length === 0) {
    return { ok: false, message: LINK_NOT_ALLOWED_MESSAGE }
  }

  refreshLink(clubId, sessionId, projectId)
  return { ok: true }
}
