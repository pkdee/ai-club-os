import { NextResponse, type NextRequest } from "next/server"

import type { LoginError } from "@/features/auth/login-error"
import { createClient } from "@/lib/supabase/server"

// Google 인증을 마치고 돌아오는 주소. 받은 code 를 세션으로 바꾼다.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  const error: LoginError = "auth_failed"
  return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
}
