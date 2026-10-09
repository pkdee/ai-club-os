"use server"

import { redirect } from "next/navigation"

import type { LoginError } from "./login-error"

// Supabase 가 아직 연결되지 않아 로그인을 시작할 수 없다.
// 연결하면 이 함수가 Google OAuth 를 시작하고, 화면 쪽은 바꾸지 않는다.
export async function signInWithGoogle() {
  const error: LoginError = "not_configured"
  redirect(`/login?error=${error}`)
}
