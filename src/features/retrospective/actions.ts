"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import {
  cleanRetrospective,
  isPastOrCurrentMonth,
  monthStartDate,
  validateRetrospective,
  type RetrospectiveErrors,
  type RetrospectiveInput,
  type RetrospectiveOptions,
  type RetrospectiveTarget,
} from "./rules"

export type RetrospectiveActionResult =
  | { ok: true }
  | { ok: false; message: string; errors?: RetrospectiveErrors }

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요. 적은 내용은 그대로 남아 있습니다."
const CHECK_MESSAGE = "표시된 칸을 고친 뒤 다시 저장해 주세요."
// 테이블이 아직 없을 때의 안내.
const NOT_READY_MESSAGE =
  "데이터베이스에 회고의 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const ALREADY_WRITTEN_MESSAGE =
  "이미 쓴 회고가 있습니다. 화면을 새로 고쳐 확인한 뒤 그 회고를 고쳐 주세요."
const NOT_ALLOWED_MESSAGE = {
  project:
    "이 Project 의 참여자만 회고를 쓸 수 있습니다. 참여가 끝났을 수 있습니다. 화면을 새로 고쳐 확인해 주세요.",
  session:
    "이 Club 의 Member 만 회고를 쓸 수 있습니다. 소속이 바뀌었는지 운영자에게 확인해 주세요.",
  month:
    "이 Club 의 Member 만 회고를 쓸 수 있습니다. 소속이 바뀌었는지 운영자에게 확인해 주세요.",
}
const NOT_YET_MESSAGE = {
  project: "이 Project 를 찾을 수 없습니다. 지워졌을 수 있습니다.",
  session:
    "아직 시작하지 않았거나 지워진 Session 입니다. Session 이 시작한 뒤에 회고를 쓸 수 있습니다.",
  month: "아직 오지 않은 달의 회고는 쓸 수 없습니다.",
}
const AUTHOR_ONLY_MESSAGE =
  "회고는 쓴 사람만 고칠 수 있습니다. 이미 지워졌거나 Club 에서 나갔을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const DELETE_NOT_ALLOWED_MESSAGE =
  "회고는 쓴 사람과 운영자만 지울 수 있습니다. 이미 지워졌을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."

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

// 회고는 Project, Session, 한 달 회고, 회고 모음, 개요에 함께 보이므로 Club 아래를 통째로 새로 읽는다.
function refresh(clubId: string) {
  revalidatePath(`/clubs/${clubId}`, "layout")
}

// 쓰임을 데이터베이스에 넣을 값으로 바꾼다. 그 단위에 뜻이 없는 쓰임은 끈 채로 둔다.
// options 가 null 이면 그 칸이 화면에 없었던 것이라 아무것도 보내지 않는다.
function optionFields(
  scope: RetrospectiveTarget["scope"],
  options: RetrospectiveOptions | null
) {
  if (!options) {
    return {}
  }
  return {
    use_in_insight: scope !== "project" && options.useInInsight === true,
    share_in_presentation:
      scope === "project" && options.shareInPresentation === true,
  }
}

// 회고를 새로 쓴다. 한 사람이 한 대상에 하나만 쓸 수 있다.
// options 는 작성자가 정한 쓰임이다. null 이면 그 칸이 화면에 없었던 것이다.
export async function createRetrospective(
  clubId: string,
  target: RetrospectiveTarget,
  input: RetrospectiveInput,
  options: RetrospectiveOptions | null = null
): Promise<RetrospectiveActionResult> {
  await requireUser()

  const values = cleanRetrospective(input ?? {})
  const errors = validateRetrospective(values)
  if (errors) {
    return { ok: false, message: errors.form ?? CHECK_MESSAGE, errors }
  }
  if (
    (target.scope === "project" && !isUuid(target.projectId)) ||
    (target.scope === "session" && !isUuid(target.sessionId)) ||
    (target.scope === "month" && !isPastOrCurrentMonth(target.month, new Date()))
  ) {
    return { ok: false, message: NOT_YET_MESSAGE[target.scope] }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("retrospectives").insert({
    club_id: clubId,
    scope: target.scope,
    project_id: target.scope === "project" ? target.projectId : null,
    session_id: target.scope === "session" ? target.sessionId : null,
    period_start:
      target.scope === "month" ? monthStartDate(target.month) : null,
    went_well: values.wentWell,
    to_improve: values.toImprove,
    to_try: values.toTry,
    ...optionFields(target.scope, options),
  })

  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    // 23505 는 이미 쓴 회고가 있을 때다.
    if (error.code === "23505") {
      return { ok: false, message: ALREADY_WRITTEN_MESSAGE }
    }
    // 42501 은 접근 규칙에 막힌 것이다. Member 가 아니거나 Project 의 참여자가 아니다.
    if (error.code === "42501") {
      return { ok: false, message: NOT_ALLOWED_MESSAGE[target.scope] }
    }
    // 23514 는 아직 쓸 수 없는 대상이고, 23503 은 대상이 없는 것이다.
    if (error.code === "23514" || error.code === "23503") {
      return { ok: false, message: NOT_YET_MESSAGE[target.scope] }
    }
    console.error("회고를 저장하지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }

  refresh(clubId)
  return { ok: true }
}

// 내가 쓴 회고를 고친다. scope 는 그 회고의 단위이고, 어느 쓰임을 저장할지 정하는 데 쓴다.
export async function updateRetrospective(
  clubId: string,
  retrospectiveId: string,
  scope: RetrospectiveTarget["scope"],
  input: RetrospectiveInput,
  options: RetrospectiveOptions | null = null
): Promise<RetrospectiveActionResult> {
  await requireUser()
  if (!isUuid(retrospectiveId)) {
    return { ok: false, message: AUTHOR_ONLY_MESSAGE }
  }

  const values = cleanRetrospective(input ?? {})
  const errors = validateRetrospective(values)
  if (errors) {
    return { ok: false, message: errors.form ?? CHECK_MESSAGE, errors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("retrospectives")
    .update({
      went_well: values.wentWell,
      to_improve: values.toImprove,
      to_try: values.toTry,
      ...optionFields(scope, options),
    })
    .eq("club_id", clubId)
    .eq("id", retrospectiveId)
    .select("id")

  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    console.error("회고를 고치지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  // 접근 규칙에 막히면 오류 없이 바뀐 행이 0개로 돌아온다.
  if (data.length === 0) {
    return { ok: false, message: AUTHOR_ONLY_MESSAGE }
  }

  refresh(clubId)
  return { ok: true }
}

// 회고를 지운다. 쓴 사람과 운영자가 지운다. 되살릴 수 없다.
export async function deleteRetrospective(
  clubId: string,
  retrospectiveId: string
): Promise<RetrospectiveActionResult> {
  await requireUser()
  if (!isUuid(retrospectiveId)) {
    return { ok: false, message: DELETE_NOT_ALLOWED_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("retrospectives")
    .delete()
    .eq("club_id", clubId)
    .eq("id", retrospectiveId)
    .select("id")

  if (error) {
    if (isMissingTable(error)) {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    console.error("회고를 지우지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: DELETE_NOT_ALLOWED_MESSAGE }
  }

  refresh(clubId)
  return { ok: true }
}
