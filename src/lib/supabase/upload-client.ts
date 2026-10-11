import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { supabaseEnv } from "./env"

let client: SupabaseClient | null = null

// 브라우저에서 Storage 로 파일을 바로 올릴 때만 쓰는 클라이언트.
// 로그인 정보를 싣지 않는다. 올릴 자리와 권한은 서버가 미리 만들어 준 한 번짜리 표로 정해진다.
// 데이터는 지금처럼 서버에서 읽고 쓴다.
export function createUploadClient() {
  if (client) {
    return client
  }
  const env = supabaseEnv()
  if (!env) {
    return null
  }
  client = createClient(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
  return client
}
