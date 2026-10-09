import { getCurrentUser } from "@/features/auth/session"
import { getClubAccess, type MyClub } from "@/features/club/queries"

import { getSession, type Session } from "./queries"

// Session 상세의 layout 과 각 탭이 함께 쓰는 값.
// 볼 수 없는 Club 이나 없는 Session 이면 null 이다. 그때의 안내는 layout 이 그린다.
// 안쪽 조회가 모두 요청 단위로 캐시되므로 여러 곳에서 불러도 한 번씩만 읽는다.
export async function loadSessionPage(
  clubId: string,
  sessionId: string
): Promise<{ club: MyClub; session: Session } | null> {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  const access = await getClubAccess(clubId, user.id)
  if (access.status !== "ok") {
    return null
  }

  const result = await getSession(clubId, sessionId)
  return result.status === "ok"
    ? { club: access.club, session: result.session }
    : null
}
