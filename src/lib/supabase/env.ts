// Supabase 연결 값. 둘 중 하나라도 없으면 null 을 돌려줘서 호출하는 쪽이 안내 화면으로 보낼 수 있게 한다.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  return url && key ? { url, key } : null
}
