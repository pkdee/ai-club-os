"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"

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

export type SessionTarget = {
  clubId: string
  // 있으면 그 Session 을 고치고, 없으면 새로 만든다.
  sessionId?: string
}

const RETRY_MESSAGE =
  "잠시 뒤 다시 시도해 주세요. 입력한 내용은 그대로 남아 있습니다."
const ADMIN_ONLY_MESSAGE =
  "운영자만 Session 을 만들거나 고칠 수 있습니다. 역할이 바뀌었는지 운영자에게 확인해 주세요."

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
    date: text(formData, "date"),
    startTime: text(formData, "startTime"),
    endTime: text(formData, "endTime"),
    location: text(formData, "location"),
    description: text(formData, "description"),
  }

  const validation = validateSession(values)
  if (!validation.ok) {
    return { status: "error", errors: validation.errors, values }
  }

  const fields = {
    title: values.title,
    description: values.description,
    location: values.location,
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
