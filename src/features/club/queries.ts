import { createClient } from "@/lib/supabase/server"

export type ClubRole = "admin" | "member"

export type MyClub = {
  id: string
  name: string
  description: string
  role: ClubRole
  memberCount: number
}

type ClubRow = {
  id: string
  name: string
  description: string
  members: { user_id: string; role: ClubRole }[]
}

// 내가 속한 Club 목록.
// 데이터베이스의 접근 규칙이 내 Club 과 그 Member 만 돌려주므로 조건을 따로 걸지 않는다.
export async function listMyClubs(userId: string): Promise<MyClub[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clubs")
    .select("id, name, description, members(user_id, role)")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Club 목록을 불러오지 못했습니다: ${error.message}`)
  }

  return (data as ClubRow[]).map((club) => ({
    id: club.id,
    name: club.name,
    description: club.description,
    role:
      club.members.find((member) => member.user_id === userId)?.role ??
      "member",
    memberCount: club.members.length,
  }))
}
