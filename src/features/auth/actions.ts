"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { supabaseEnv } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

import type { LoginError } from "./login-error"
import { RETURN_PATH_COOKIE, safeReturnPath } from "./return-path"

// 돌아갈 경로가 있으면 오류 화면에서도 잃지 않게 함께 넘긴다.
function loginErrorPath(error: LoginError, returnPath: string | null = null) {
  const next = returnPath ? `&next=${encodeURIComponent(returnPath)}` : ""
  return `/login?error=${error}${next}`
}

// 요청이 들어온 주소로 콜백 주소를 만든다. 로컬과 배포 환경에서 같은 코드가 동작한다.
async function requestOrigin() {
  const headerList = await headers()
  const origin = headerList.get("origin")
  if (origin) {
    return origin
  }

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  const protocol = headerList.get("x-forwarded-proto") ?? "http"
  return `${protocol}://${host}`
}

// Google 인증 화면으로 보낸다. 인증이 끝나면 /auth/callback 으로 돌아온다.
// 폼의 next 값은 로그인한 뒤 돌아갈 경로다. 인증을 다녀오는 동안 쿠키에 담아 둔다.
export async function signInWithGoogle(formData: FormData) {
  const returnPath = safeReturnPath(formData.get("next"))
  if (!supabaseEnv()) {
    redirect(loginErrorPath("not_configured", returnPath))
  }

  const cookieStore = await cookies()
  if (returnPath) {
    cookieStore.set(RETURN_PATH_COOKIE, returnPath, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    })
  } else {
    cookieStore.delete(RETURN_PATH_COOKIE)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await requestOrigin()}/auth/callback` },
  })

  if (error || !data.url) {
    redirect(loginErrorPath("auth_failed", returnPath))
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect("/login")
}
