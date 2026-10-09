import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { supabaseEnv } from "./env"

// Server Component, Server Action, Route Handler 에서 쓰는 Supabase 클라이언트.
// 요청마다 쿠키가 다르므로 매번 새로 만든다.
export async function createClient() {
  const env = supabaseEnv()
  if (!env) {
    throw new Error(
      "Supabase 환경 변수가 없습니다. .env.local 의 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 확인하세요."
    )
  }

  const cookieStore = await cookies()

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component 에서는 쿠키를 쓸 수 없다.
          // 세션 갱신은 src/proxy.ts 가 요청마다 처리하므로 무시해도 된다.
        }
      },
    },
  })
}
