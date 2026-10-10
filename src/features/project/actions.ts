"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import {
  PROJECT_LINK_LIMIT,
  PROJECT_TASK_LIMIT,
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

  revalidatePath(`/clubs/${clubId}`, "layout")
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
