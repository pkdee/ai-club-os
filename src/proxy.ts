import { NextResponse, type NextRequest } from "next/server"

import { safeReturnPath } from "@/features/auth/return-path"
import { updateSession } from "@/lib/supabase/proxy"

// 로그인 없이 열 수 있는 경로. 나머지는 모두 로그인이 필요하다.
function isPublicPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/auth/")
}

// 로그인하지 않았으면 로그인 화면으로 보내되, 보려던 경로를 next 에 담아 둔다.
// 초대 링크처럼 로그인한 뒤 이어서 가야 하는 곳이 있기 때문이다.
function loginPath(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const returnPath = safeReturnPath(`${pathname}${search}`)

  return returnPath ? `/login?next=${encodeURIComponent(returnPath)}` : "/login"
}

export async function proxy(request: NextRequest) {
  const { response, isSignedIn } = await updateSession(request)
  const { pathname, searchParams } = request.nextUrl

  const target =
    !isSignedIn && !isPublicPath(pathname)
      ? loginPath(request)
      : isSignedIn && pathname === "/login"
        ? (safeReturnPath(searchParams.get("next")) ?? "/")
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
