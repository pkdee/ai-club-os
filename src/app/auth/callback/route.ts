import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

import type { LoginError } from "@/features/auth/login-error"
import {
  RETURN_PATH_COOKIE,
  safeReturnPath,
} from "@/features/auth/return-path"
import { createClient } from "@/lib/supabase/server"

// Google 인증을 마치고 돌아오는 주소. 받은 code 를 세션으로 바꾼다.
// 로그인 전에 보려던 경로가 쿠키에 있으면 그곳으로, 없으면 처음 화면으로 보낸다.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const cookieStore = await cookies()
  const returnPath = safeReturnPath(cookieStore.get(RETURN_PATH_COOKIE)?.value)
  cookieStore.delete(RETURN_PATH_COOKIE)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 속한 Club 에 보이는 프로필 사진을 지금의 Google 계정 사진으로 맞춘다.
      // 실패해도 로그인은 그대로 진행한다. 다음 로그인 때 다시 맞춘다.
      const synced = await supabase.rpc("sync_my_avatar")
      if (synced.error) {
        console.error("프로필 사진을 맞추지 못했습니다.", synced.error)
      }

      return NextResponse.redirect(new URL(returnPath ?? "/", request.url))
    }
  }

  // 다시 시도해도 돌아갈 경로를 잃지 않게 함께 넘긴다.
  const error: LoginError = "auth_failed"
  const next = returnPath ? `&next=${encodeURIComponent(returnPath)}` : ""
  return NextResponse.redirect(
    new URL(`/login?error=${error}${next}`, request.url)
  )
}
