import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

export type ClubInvite = {
  token: string
  expiresAt: string
}

export type ClubInviteResult =
  | { status: "ok"; invite: ClubInvite | null }
  | { status: "error" }

export type InvitePreview = {
  clubId: string
  clubName: string
  clubDescription: string
  memberCount: number
  alreadyMember: boolean
}

export type InvitePreviewResult =
  | { status: "ok"; preview: InvitePreview }
  // 링크가 틀렸거나 만료됐거나 운영자가 새로 만들었다.
  | { status: "invalid" }
  | { status: "error" }

type PreviewRow = {
  club_id: string
  club_name: string
  club_description: string
  member_count: number
  already_member: boolean
}

// 데이터베이스가 만드는 링크 값의 모양. 이 모양이 아니면 조회하지 않는다.
const TOKEN_PATTERN = /^[0-9a-f]{32}$/

export function isInviteToken(value: string) {
  return TOKEN_PATTERN.test(value)
}

// Club 의 초대 링크를 읽는다. 운영자에게만 보이고, 만든 적이 없으면 null 이다.
// 만료된 링크도 그대로 돌려주므로 쓰는 쪽에서 만료 시각을 확인한다.
export const getClubInvite = cache(
  async (clubId: string): Promise<ClubInviteResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("club_invites")
      .select("token, expires_at")
      .eq("club_id", clubId)
      .maybeSingle()

    if (error) {
      console.error("초대 링크를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const row = data as { token: string; expires_at: string } | null
    return {
      status: "ok",
      invite: row ? { token: row.token, expiresAt: row.expires_at } : null,
    }
  }
)

// 초대 링크가 가리키는 Club 을 미리 본다. 아직 Member 가 아니어도 볼 수 있다.
export const previewInvite = cache(
  async (token: string): Promise<InvitePreviewResult> => {
    if (!isInviteToken(token)) {
      return { status: "invalid" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc("preview_club_invite", {
      invite_token: token,
    })

    if (error) {
      console.error("초대 정보를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const row = (data as PreviewRow[])[0]
    if (!row) {
      return { status: "invalid" }
    }

    return {
      status: "ok",
      preview: {
        clubId: row.club_id,
        clubName: row.club_name,
        clubDescription: row.club_description,
        memberCount: row.member_count,
        alreadyMember: row.already_member,
      },
    }
  }
)
