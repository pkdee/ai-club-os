"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"

import { validateClub, type ClubInput, type ClubInputErrors } from "./rules"

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
