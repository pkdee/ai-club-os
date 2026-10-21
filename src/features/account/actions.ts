"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  listAiLogImagePaths,
  removeAiLogImageFiles,
} from "@/features/ai-log/image-store"
import { getCurrentUser } from "@/features/auth/session"
import { removeClubLogoFiles } from "@/features/club/logo-store"
import { listMyClubs } from "@/features/club/queries"
import { createClient } from "@/lib/supabase/server"

import { isAccountDeleteConfirmed, planAccountDeletion } from "./plan"

export type AccountDeleteResult = { ok: false; message: string }

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요. 아무것도 지워지지 않았습니다."
const CONFIRM_MISMATCH_MESSAGE =
  "입력한 글자가 다릅니다. 안내에 적힌 글자를 그대로 입력해 주세요."
const NOT_READY_MESSAGE =
  "데이터베이스에 계정을 지우는 기능이 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const IMAGES_MESSAGE =
  "붙인 이미지나 함께 지워지는 Club 의 로고를 모두 지우지 못해 계정을 그대로 두었습니다. 잠시 뒤 다시 시도해 주세요."

// 지금 로그인한 사용자의 계정을 지운다. 되돌릴 수 없다.
// deleteContent 가 true 이면 내가 쓴 AI Log, 회고, 댓글도 함께 지운다. false 이면 작성자 없이 남는다.
// 내가 붙인 이미지는 어느 쪽이든 지운다. 올린 사람이 없는 파일을 남기지 않으려는 것이다.
// 성공하면 로그인 화면으로 떠나고, 실패했을 때만 값을 돌려준다.
export async function deleteMyAccount(
  deleteContent: boolean,
  typed: string
): Promise<AccountDeleteResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isAccountDeleteConfirmed(typed, user.email)) {
    return { ok: false, message: CONFIRM_MISMATCH_MESSAGE }
  }

  const supabase = await createClient()

  // 파일을 먼저 지운다. 파일이 남아 있으면 데이터베이스가 계정을 지우지 못하게 막는다.
  // 내가 붙인 것은 이미 나간 Club 의 것까지, 나와 함께 지워지는 Club 의 것은 남이 붙인 것까지 지운다.
  let clubs
  try {
    clubs = await listMyClubs(user.id)
  } catch (error) {
    console.error(error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  const scopes = [
    { createdBy: user.id },
    ...planAccountDeletion(clubs).removed.map((club) => ({ clubId: club.id })),
  ]
  const paths = new Set<string>()
  for (const scope of scopes) {
    const found = await listAiLogImagePaths(supabase, scope)
    if (found === null) {
      return { ok: false, message: RETRY_MESSAGE }
    }
    found.forEach((path) => paths.add(path))
  }
  if (!(await removeAiLogImageFiles(supabase, [...paths]))) {
    return { ok: false, message: IMAGES_MESSAGE }
  }
  // 나와 함께 지워지는 Club 의 로고 파일도 지운다. 남아 있으면 데이터베이스가 그 Club 을 지우지 못하게 막는다.
  for (const club of planAccountDeletion(clubs).removed) {
    if (!(await removeClubLogoFiles(supabase, club.id))) {
      return { ok: false, message: IMAGES_MESSAGE }
    }
  }

  const { error } = await supabase.rpc("delete_my_account", {
    delete_content: deleteContent === true,
  })
  if (error) {
    // 함수가 아직 없을 때의 오류 번호. 앞의 것은 데이터 API 가 함수를 모를 때다.
    if (error.code === "PGRST202" || error.code === "42883") {
      return { ok: false, message: NOT_READY_MESSAGE }
    }
    // 23503 은 파일이 남아 있는 이미지가 있어 데이터베이스가 막은 것이다.
    if (error.code === "23503") {
      return { ok: false, message: IMAGES_MESSAGE }
    }
    console.error("계정을 지우지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }

  // 계정은 지워졌다. 이 브라우저에 남은 로그인 정보를 지운다.
  // 로그아웃 요청이 실패해도 쿠키는 직접 지워서 지워진 계정으로 화면이 열리지 않게 한다.
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined)
  const cookieStore = await cookies()
  for (const cookie of cookieStore.getAll()) {
    if (/^sb-.+-auth-token(\.\d+)?$/.test(cookie.name)) {
      cookieStore.delete(cookie.name)
    }
  }

  redirect("/login?notice=account_deleted")
}
