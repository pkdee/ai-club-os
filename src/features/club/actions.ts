"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { removeAiLogImagesOf } from "@/features/ai-log/image-store"
import { getCurrentUser } from "@/features/auth/session"
import { createClient } from "@/lib/supabase/server"

import { CLUB_LOGO_MAX_BYTES, clubLogoPath, isClubLogoType } from "./logo-rules"
import {
  removeClubLogoFile,
  removeClubLogoFiles,
  uploadClubLogoFile,
} from "./logo-store"
import { getClubAccess } from "./queries"
import { validateClub, type ClubInput, type ClubInputErrors } from "./rules"

export type ClubDeleteResult = { ok: true } | { ok: false; message: string }
export type ClubLogoResult = { ok: true } | { ok: false; message: string }

const DELETE_RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
// 지우는 권한 자체가 없을 때의 안내. 접근 규칙에 막힌 경우는 오류 없이 0개가 돌아오므로,
// 이 오류는 데이터베이스에 삭제 규칙이 아직 적용되지 않았다는 뜻이다.
const DELETE_NOT_READY_MESSAGE =
  "데이터베이스에 삭제 규칙이 아직 적용되지 않았습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const DELETE_ADMIN_ONLY_MESSAGE =
  "운영자만 Club 을 지울 수 있습니다. 이미 지워졌거나 내 역할이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const DELETE_IMAGES_MESSAGE =
  "AI Log 에 붙인 이미지나 Club 로고를 지우지 못해 Club 을 그대로 두었습니다. 잠시 뒤 다시 시도해 주세요."
const LOGO_ADMIN_ONLY_MESSAGE =
  "운영자만 Club 로고를 바꿀 수 있습니다. 내 역할이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const LOGO_FILE_MESSAGE =
  "PNG, JPEG, WebP 형식의 512KB 까지의 이미지만 로고로 쓸 수 있습니다."
const LOGO_RETRY_MESSAGE =
  "로고를 저장하지 못했습니다. 연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
const LOGO_NOT_READY_MESSAGE =
  "데이터베이스에 Club 로고의 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const DELETE_NAME_MISMATCH_MESSAGE =
  "입력한 이름이 Club 이름과 다릅니다. 이름이 바뀌었을 수 있으니 화면을 새로 고친 뒤 다시 입력해 주세요."

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

// Club 을 지운다. Member, Session, Attendance, AI Log, 초대 링크가 모두 함께 지워지고 되살릴 수 없다.
// 성공하면 내 Club 목록으로 이동한다. confirmName 은 화면에서 입력받은 Club 이름이고, 지금 이름과 같아야 지운다.
// 운영자만 지울 수 있고, 그 판단은 데이터베이스의 접근 규칙이 한다.
export async function deleteClub(
  clubId: string,
  confirmName: string
): Promise<ClubDeleteResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const access = await getClubAccess(clubId, user.id)
  if (access.status === "error") {
    return { ok: false, message: DELETE_RETRY_MESSAGE }
  }
  if (access.status !== "ok") {
    return { ok: false, message: DELETE_ADMIN_ONLY_MESSAGE }
  }
  if (String(confirmName).trim() !== access.club.name) {
    return { ok: false, message: DELETE_NAME_MISMATCH_MESSAGE }
  }
  // 아래에서 파일을 지우기 전에 역할을 먼저 본다. 구성원도 자기 기록의 파일은 지울 수 있기 때문이다.
  if (access.club.role !== "admin") {
    return { ok: false, message: DELETE_ADMIN_ONLY_MESSAGE }
  }

  const supabase = await createClient()
  // AI Log 에 붙인 이미지의 파일을 먼저 지운다. Club 을 지우면 목록의 줄이 함께 지워져서 파일을 찾을 길이 없어진다.
  if (!(await removeAiLogImagesOf(supabase, { clubId }))) {
    return { ok: false, message: DELETE_IMAGES_MESSAGE }
  }
  // Club 로고의 파일도 먼저 지운다. 남아 있으면 데이터베이스가 Club 을 지우지 못하게 막는다.
  if (!(await removeClubLogoFiles(supabase, clubId))) {
    return { ok: false, message: DELETE_IMAGES_MESSAGE }
  }

  const { data, error } = await supabase
    .from("clubs")
    .delete()
    .eq("id", clubId)
    .select("id")

  if (error) {
    // 23503 은 파일이 남아 있는 이미지가 있어 데이터베이스가 막은 것이다.
    if (error.code === "23503") {
      return { ok: false, message: DELETE_IMAGES_MESSAGE }
    }
    console.error("Club 을 지우지 못했습니다.", error)
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

  // 내 Club 목록과 Club 안쪽 화면이 모두 달라지므로 통째로 새로 읽는다.
  revalidatePath("/", "layout")
  redirect("/")
}

// 데이터베이스나 Storage 에 로고의 구조가 아직 없을 때의 오류인지 본다.
// 앞의 둘은 열이 없을 때, 뒤의 것은 저장 공간이 없을 때다.
function isLogoNotReady(error: { code?: string; message?: string }) {
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    /bucket not found/i.test(error.message ?? "")
  )
}

// Club 로고를 바꾼다. 운영자만 할 수 있고, 그 판단은 데이터베이스와 Storage 의 접근 규칙이 한다.
// 브라우저가 정사각형으로 줄인 그림을 formData 의 file 로 보낸다.
// 새 이름으로 올리고 Club 이 그 파일을 가리키게 한 뒤, 앞의 로고 파일을 지운다.
export async function saveClubLogo(
  clubId: string,
  formData: FormData
): Promise<ClubLogoResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const access = await getClubAccess(clubId, user.id)
  if (access.status === "error") {
    return { ok: false, message: LOGO_RETRY_MESSAGE }
  }
  if (access.status !== "ok" || access.club.role !== "admin") {
    return { ok: false, message: LOGO_ADMIN_ONLY_MESSAGE }
  }

  const file = formData.get("file")
  if (
    !(file instanceof Blob) ||
    !isClubLogoType(file.type) ||
    file.size < 1 ||
    file.size > CLUB_LOGO_MAX_BYTES
  ) {
    return { ok: false, message: LOGO_FILE_MESSAGE }
  }

  const supabase = await createClient()
  const path = clubLogoPath(clubId, crypto.randomUUID(), file.type)
  const uploaded = await uploadClubLogoFile(supabase, path, file, file.type)
  if (!uploaded.ok) {
    return {
      ok: false,
      message: isLogoNotReady(uploaded.error)
        ? LOGO_NOT_READY_MESSAGE
        : LOGO_RETRY_MESSAGE,
    }
  }

  const { data, error } = await supabase
    .from("clubs")
    .update({ logo_path: path })
    .eq("id", clubId)
    .select("id")
  if (error || data.length === 0) {
    // Club 이 가리키지 않는 파일을 남기지 않는다.
    await removeClubLogoFile(supabase, path)
    if (error) {
      console.error("Club 로고를 저장하지 못했습니다.", error)
      return {
        ok: false,
        message: isLogoNotReady(error) ? LOGO_NOT_READY_MESSAGE : LOGO_RETRY_MESSAGE,
      }
    }
    // 접근 규칙에 막히면 오류 없이 바뀐 행이 0개로 돌아온다.
    return { ok: false, message: LOGO_ADMIN_ONLY_MESSAGE }
  }

  // 앞의 로고는 지운다. 지우지 못해도 로고는 이미 바뀌었고, 남은 파일은 Club 을 지울 때 함께 지운다.
  if (access.club.logoPath && access.club.logoPath !== path) {
    await removeClubLogoFile(supabase, access.club.logoPath)
  }

  // 로고는 Club 목록과 Club 안쪽 화면에 모두 보이므로 통째로 새로 읽는다.
  revalidatePath("/", "layout")
  return { ok: true }
}

// Club 로고를 지우고 이름의 첫 글자로 돌아간다. 운영자만 할 수 있다.
export async function removeClubLogo(clubId: string): Promise<ClubLogoResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const access = await getClubAccess(clubId, user.id)
  if (access.status === "error") {
    return { ok: false, message: LOGO_RETRY_MESSAGE }
  }
  if (access.status !== "ok" || access.club.role !== "admin") {
    return { ok: false, message: LOGO_ADMIN_ONLY_MESSAGE }
  }
  const previous = access.club.logoPath
  if (!previous) {
    return { ok: true }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clubs")
    .update({ logo_path: null })
    .eq("id", clubId)
    .select("id")
  if (error) {
    console.error("Club 로고를 지우지 못했습니다.", error)
    return { ok: false, message: LOGO_RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: LOGO_ADMIN_ONLY_MESSAGE }
  }

  // Club 이 더는 가리키지 않으므로 파일을 지운다. 지우지 못한 파일은 Club 을 지울 때 함께 지운다.
  await removeClubLogoFile(supabase, previous)

  revalidatePath("/", "layout")
  return { ok: true }
}
