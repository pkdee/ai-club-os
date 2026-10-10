import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

import type { ClubRole } from "./roles"

export type MyClub = {
  id: string
  name: string
  description: string
  role: ClubRole
  // 이 Club 에서의 내 Member 식별자.
  memberId: string | null
  memberCount: number
  adminCount: number
}

export type ClubAccess =
  | { status: "ok"; club: MyClub }
  | { status: "no-access" }
  | { status: "error" }

type ClubRow = {
  id: string
  name: string
  description: string
  members: { id: string; user_id: string; role: ClubRole }[]
}

const CLUB_COLUMNS = "id, name, description, members(id, user_id, role)"
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toMyClub(row: ClubRow, userId: string): MyClub {
  const me = row.members.find((member) => member.user_id === userId)

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    role: me?.role ?? "member",
    memberId: me?.id ?? null,
    memberCount: row.members.length,
    adminCount: row.members.filter((member) => member.role === "admin")
      .length,
  }
}

// 내가 속한 Club 목록.
// 데이터베이스의 접근 규칙이 내 Club 과 그 Member 만 돌려주므로 조건을 따로 걸지 않는다.
export async function listMyClubs(userId: string): Promise<MyClub[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clubs")
    .select(CLUB_COLUMNS)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Club 목록을 불러오지 못했습니다: ${error.message}`)
  }

  return (data as ClubRow[]).map((row) => toMyClub(row, userId))
}

// Club 하나를 읽는다. layout 과 page 가 함께 불러도 한 요청 안에서는 한 번만 읽는다.
// Member 가 아닌 Club 과 없는 Club 은 접근 규칙이 똑같이 막으므로 둘 다 no-access 다.
export const getClubAccess = cache(
  async (clubId: string, userId: string): Promise<ClubAccess> => {
    if (!UUID_PATTERN.test(clubId)) {
      return { status: "no-access" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clubs")
      .select(CLUB_COLUMNS)
      .eq("id", clubId)
      .maybeSingle()

    if (error) {
      console.error("Club 을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return data
      ? { status: "ok", club: toMyClub(data as ClubRow, userId) }
      : { status: "no-access" }
  }
)
