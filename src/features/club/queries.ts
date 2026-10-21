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
  // 로고 파일의 Storage 경로. 로고가 없으면 null 이다.
  logoPath: string | null
}

// 로그인한 사용자 모두가 보는 Club 목록의 한 줄. Member 가 아닌 Club 도 들어 있다.
// role 은 내 역할이고, Member 가 아니면 null 이다.
export type ClubListItem = {
  id: string
  name: string
  description: string
  logoPath: string | null
  memberCount: number
  role: ClubRole | null
}

export type ClubAccess =
  | { status: "ok"; club: MyClub }
  | { status: "no-access" }
  | { status: "error" }

type ClubRow = {
  id: string
  name: string
  description: string
  logo_path: string | null
  members: { id: string; user_id: string; role: ClubRole }[]
}

const CLUB_COLUMNS =
  "id, name, description, logo_path, members(id, user_id, role)"
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
    logoPath: row.logo_path,
  }
}

type ClubListRow = {
  id: string
  name: string
  description: string
  logo_path: string | null
  member_count: number
  my_role: ClubRole | null
}

// 등록된 Club 을 모두 읽는다. 최근에 만든 것부터다.
// Club 안은 지금처럼 Member 만 보고, 이 목록은 데이터베이스 함수가 이름, 소개, 로고, Member 수만 돌려준다.
export async function listClubs(): Promise<ClubListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("list_clubs")

  if (error) {
    throw new Error(`Club 목록을 불러오지 못했습니다: ${error.message}`)
  }

  return (data as ClubListRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    logoPath: row.logo_path,
    memberCount: Number(row.member_count),
    role: row.my_role,
  }))
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
