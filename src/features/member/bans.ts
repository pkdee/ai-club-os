import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

export type ClubBan = {
  userId: string
  name: string
  bannedAt: string
}

// unavailable 은 데이터베이스에 막은 사람을 두는 구조가 아직 없다는 뜻이다.
export type ClubBanListResult =
  | { status: "ok"; bans: ClubBan[] }
  | { status: "unavailable" }
  | { status: "error" }

// 테이블이 아직 없을 때의 오류 번호. 뒤의 것은 데이터 API 가 테이블을 모를 때다.
export function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

// 내보내면서 다시 들어오지 못하게 막은 사람을 최근 순으로 읽는다. 운영자에게만 보인다.
export const listClubBans = cache(
  async (clubId: string): Promise<ClubBanListResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("club_bans")
      .select("user_id, display_name, created_at")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })

    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("참여를 막은 사람을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return {
      status: "ok",
      bans: (
        data as { user_id: string; display_name: string; created_at: string }[]
      ).map((row) => ({
        userId: row.user_id,
        name: row.display_name.trim() || "이름 없는 사람",
        bannedAt: row.created_at,
      })),
    }
  }
)
