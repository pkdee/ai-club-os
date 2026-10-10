"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"

import { validateClub, type ClubInput, type ClubInputErrors } from "./rules"

export type ClubSettingsState = {
  status: "idle" | "error" | "success"
  message?: string
  errors?: ClubInputErrors
  values?: ClubInput
}

export type CreateClubState = {
  status: "idle" | "error" | "success"
  message?: string
  errors?: ClubInputErrors
  values?: ClubInput
}

export async function createClub(
  _previous: CreateClubState,
  formData: FormData
): Promise<CreateClubState> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const values: ClubInput = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  }

  const errors = validateClub(values)
  if (errors) {
    return { status: "error", errors, values }
  }

  const supabase = await createClient()
  // 만든 사람은 trigger 가 운영자 Member 로 넣는다.
  // 그 전에는 새 행을 볼 권한이 없으므로 insert 결과를 되돌려 받지 않는다.
  const { error } = await supabase.from("clubs").insert(values)
  if (error) {
    console.error("Club 을 만들지 못했습니다.", error)
    return {
      status: "error",
      message:
        "잠시 뒤 다시 시도해 주세요. 입력한 내용은 그대로 남아 있습니다.",
      values,
    }
  }

  revalidatePath("/")
  return { status: "success" }
}

// Club 의 이름과 소개를 고친다. 누가 할 수 있는지는 데이터베이스의 접근 규칙이 판단한다.
export async function updateClub(
  clubId: string,
  _previous: ClubSettingsState,
  formData: FormData
): Promise<ClubSettingsState> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const values: ClubInput = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  }

  const errors = validateClub(values)
  if (errors) {
    return { status: "error", errors, values }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clubs")
    .update(values)
    .eq("id", clubId)
    .select("id")

  if (error) {
    console.error("Club 정보를 고치지 못했습니다.", error)
    return {
      status: "error",
      message:
        "잠시 뒤 다시 시도해 주세요. 입력한 내용은 그대로 남아 있습니다.",
      values,
    }
  }
  // 접근 규칙에 막히면 오류 없이 바뀐 행이 0개로 돌아온다.
  if (data.length === 0) {
    return {
      status: "error",
      message:
        "운영자만 Club 정보를 고칠 수 있습니다. 역할이 바뀌었는지 다른 운영자에게 확인해 주세요.",
      values,
    }
  }

  // 이름은 내 Club 목록과 Club 안쪽 화면 모두에 보이므로 통째로 새로 읽는다.
  revalidatePath("/", "layout")
  return { status: "success", values }
}
