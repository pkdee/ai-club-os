"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { supabaseEnv } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

import type { LoginError } from "./login-error"

function loginErrorPath(error: LoginError) {
  return `/login?error=${error}`
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
export async function signInWithGoogle() {
  if (!supabaseEnv()) {
    redirect(loginErrorPath("not_configured"))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await requestOrigin()}/auth/callback` },
  })

  if (error || !data.url) {
    redirect(loginErrorPath("auth_failed"))
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect("/login")
}
