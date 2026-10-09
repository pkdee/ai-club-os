import { getCurrentUser, type CurrentUser } from "@/features/auth/session"

import { getClubAccess, type MyClub } from "./queries"

// Club 안쪽 화면이 함께 쓰는 값.
// 볼 수 없는 Club 이면 null 이다. 그때의 안내는 layout 이 그린다.
// 안쪽 조회가 모두 요청 단위로 캐시되므로 layout 과 page 가 함께 불러도 한 번씩만 읽는다.
export async function loadClubPage(
  clubId: string
): Promise<{ club: MyClub; user: CurrentUser } | null> {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  const access = await getClubAccess(clubId, user.id)
  return access.status === "ok" ? { club: access.club, user } : null
}
