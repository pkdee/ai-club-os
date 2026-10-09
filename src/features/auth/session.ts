import { cache } from "react"

import { supabaseEnv } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

export type CurrentUser = {
  id: string
  email: string | null
  name: string
}

// 서명을 검증한 토큰에서 현재 사용자를 읽는다. 로그인하지 않았으면 null 이다.
// user_metadata 는 사용자가 바꿀 수 있는 값이라 표시에만 쓴다. 권한 판단에는 쓰지 않는다.
// layout 과 page 가 함께 불러도 한 요청 안에서는 한 번만 확인한다.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!supabaseEnv()) {
    return null
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) {
    return null
  }

  const metadata: Record<string, unknown> = claims.user_metadata ?? {}
  const email = typeof claims.email === "string" ? claims.email : null
  const displayName = [metadata.full_name, metadata.name].find(
    (value): value is string => typeof value === "string" && value.length > 0
  )

  return { id: claims.sub, email, name: displayName ?? email ?? "이름 없음" }
})
