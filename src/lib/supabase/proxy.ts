import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { supabaseEnv } from "./env"

// 만료된 세션을 갱신하고, 갱신된 쿠키를 Server Component 와 브라우저 양쪽에 전달한다.
// 돌려주는 response 는 쿠키를 담고 있으므로 그대로 쓰거나 쿠키를 옮겨 담아야 한다.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const env = supabaseEnv()
  if (!env) {
    return { response, isSignedIn: false }
  }

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value)
        )
      },
    },
  })

  // createServerClient 와 getClaims 사이에 다른 코드를 넣지 않는다.
  // getClaims 는 토큰 서명을 검증하고 필요하면 세션을 갱신한다.
  const { data } = await supabase.auth.getClaims()

  return { response, isSignedIn: Boolean(data?.claims) }
}
