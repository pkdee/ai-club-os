import { getCurrentUser } from "@/features/auth/session"
import { clubLogoFileType } from "@/features/club/logo-rules"
import { downloadClubLogoFile } from "@/features/club/logo-store"
import { createClient } from "@/lib/supabase/server"

const CLUB_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Club 로고를 보내 준다. 저장 공간이 공개되어 있지 않아서 앱이 로그인을 확인하고 대신 읽어 온다.
// Club 목록이 로그인한 사용자 모두에게 보이므로 로고도 Member 가 아니어도 받는다. 판단은 Storage 의 접근 규칙이 한다.
// 주소의 파일 이름은 올릴 때마다 새로 만들어지므로 브라우저가 1년 동안 기억해도 된다.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/clubs/[clubId]/logo/[file]">
) {
  const { clubId, file } = await ctx.params
  const type = clubLogoFileType(file)
  if (!CLUB_ID.test(clubId) || !type) {
    return new Response(null, { status: 404 })
  }

  const user = await getCurrentUser()
  if (!user) {
    return new Response(null, { status: 401 })
  }

  const supabase = await createClient()
  const logo = await downloadClubLogoFile(supabase, `${clubId}/${file}`)
  if (!logo) {
    return new Response(null, { status: 404 })
  }

  return new Response(logo, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=31536000, immutable",
      // 저장된 형식을 브라우저가 다르게 짐작해 실행하지 않게 한다.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  })
}
