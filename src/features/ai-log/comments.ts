import { cache } from "react"

import { memberName } from "@/features/member/name"
import { googleAvatarUrl } from "@/lib/google-avatar"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

export type AiLogComment = {
  id: string
  // 작성자가 Club 에서 빠졌으면 null 이다.
  author: { userId: string; name: string; avatarUrl: string | null } | null
  body: string
  createdAt: string
  updatedAt: string
}

// 한 기록에 달린 댓글과 "도움이 됐어요" 표시.
// helpful.names 는 표시한 사람의 이름이고 표시한 순서다. mine 은 내가 표시했다는 뜻이다.
// unavailable 은 데이터베이스에 댓글의 구조가 아직 없다는 뜻이다.
export type AiLogFeedbackResult =
  | {
      status: "ok"
      comments: AiLogComment[]
      helpful: { names: string[]; mine: boolean }
    }
  | { status: "unavailable" }
  | { status: "error" }

// 한 기록에서 한 번에 읽는 댓글 수.
const COMMENT_LIMIT = 200

// 테이블이 아직 없을 때의 오류 번호. 뒤의 것은 데이터 API 가 테이블을 모를 때다.
function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

type CommentRow = {
  id: string
  author_id: string | null
  body: string
  created_at: string
  updated_at: string
  author: {
    display_name: string
    email: string | null
    avatar_url: string | null
  } | null
}

type ReactionRow = {
  user_id: string
  member: { display_name: string; email: string | null } | null
}

// 한 기록의 댓글을 쓴 순서로, 표시를 누른 순서로 읽는다.
export const getAiLogFeedback = cache(
  async (
    clubId: string,
    logId: string,
    userId: string
  ): Promise<AiLogFeedbackResult> => {
    if (!isUuid(logId)) {
      return { status: "ok", comments: [], helpful: { names: [], mine: false } }
    }

    const supabase = await createClient()
    const [comments, reactions] = await Promise.all([
      supabase
        .from("ai_log_comments")
        .select(
          "id, author_id, body, created_at, updated_at, author:members!ai_log_comments_author_fkey(display_name, email, avatar_url)"
        )
        .eq("club_id", clubId)
        .eq("log_id", logId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(0, COMMENT_LIMIT - 1),
      supabase
        .from("ai_log_reactions")
        .select(
          "user_id, member:members!ai_log_reactions_member_fkey(display_name, email)"
        )
        .eq("club_id", clubId)
        .eq("log_id", logId)
        .order("created_at", { ascending: true }),
    ])

    const error = comments.error ?? reactions.error
    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("AI Log 의 댓글과 표시를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const reactionRows = (reactions.data ?? []) as unknown as ReactionRow[]
    return {
      status: "ok",
      comments: ((comments.data ?? []) as unknown as CommentRow[]).map(
        (row) => ({
          id: row.id,
          author:
            row.author_id && row.author
              ? {
                  userId: row.author_id,
                  name: memberName(row.author),
                  avatarUrl: googleAvatarUrl(row.author.avatar_url),
                }
              : null,
          body: row.body,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
      ),
      helpful: {
        names: reactionRows.flatMap((row) =>
          row.member ? [memberName(row.member)] : []
        ),
        mine: reactionRows.some((row) => row.user_id === userId),
      },
    }
  }
)
