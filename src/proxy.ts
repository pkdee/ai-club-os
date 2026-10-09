import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

// 로그인 없이 열 수 있는 경로. 나머지는 모두 로그인이 필요하다.
function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/auth/")
}

export async function proxy(request: NextRequest) {
  const { response, isSignedIn } = await updateSession(request)
  const { pathname } = request.nextUrl

  const target =
    !isSignedIn && !isPublicPath(pathname)
      ? "/login"
      : isSignedIn && pathname === "/login"
        ? "/"
        : null

  if (!target) {
    return response
  }

  // 세션 갱신으로 바뀐 쿠키를 잃지 않도록 옮겨 담는다.
  const redirectResponse = NextResponse.redirect(new URL(target, request.url))
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })
  return redirectResponse
}

export const config = {
  matcher: [
    // 정적 파일과 이미지 요청에는 실행하지 않는다.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
