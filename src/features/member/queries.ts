import { cache } from "react"

import type { ClubRole } from "@/features/club/roles"
import { googleAvatarUrl } from "@/lib/google-avatar"
import { createClient } from "@/lib/supabase/server"

import { memberName } from "./name"

export type Member = {
  id: string
  userId: string
  role: ClubRole
  name: string
  email: string | null
  avatarUrl: string | null
  joinedAt: string
}

export type MemberListResult =
  | { status: "ok"; members: Member[] }
  | { status: "error" }

type MemberRow = {
  id: string
  user_id: string
  role: ClubRole
  display_name: string
  email: string | null
  avatar_url: string | null
  created_at: string
}

// Club 의 Member 를 참여한 순서로 읽는다.
// 다른 Club 의 Member 는 데이터베이스의 접근 규칙이 막는다.
export const listMembers = cache(
  async (clubId: string): Promise<MemberListResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("members")
      .select("id, user_id, role, display_name, email, avatar_url, created_at")
      .eq("club_id", clubId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Member 목록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return {
      status: "ok",
      members: (data as MemberRow[]).map((row) => ({
        id: row.id,
        userId: row.user_id,
        role: row.role,
        name: memberName(row),
        email: row.email,
        avatarUrl: googleAvatarUrl(row.avatar_url),
        joinedAt: row.created_at,
      })),
    }
  }
)
