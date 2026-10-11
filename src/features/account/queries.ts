import { createClient } from "@/lib/supabase/server"

// 계정을 지우기 전에 보여 주는, 내가 남긴 것의 수.
// 구조가 아직 없거나 세지 못한 것은 null 이다.
export type AccountContentCounts = {
  logs: number | null
  retrospectives: number | null
  comments: number | null
  images: number | null
}

// 계정을 지우는 함수가 데이터베이스에 있는지와 내가 남긴 것의 수.
export type AccountSummary = {
  counts: AccountContentCounts
}

async function countOf(
  table: "ai_logs" | "retrospectives" | "ai_log_comments" | "ai_log_attachments",
  column: "author_id" | "created_by",
  userId: string
) {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, userId)

  // 테이블이 아직 없으면 오류 없이 수만 비어서 돌아오기도 한다. 그때도 세지 못한 것으로 본다.
  return error || count === null ? null : count
}

// 내가 속한 모든 Club 에서 내가 남긴 것을 센다.
export async function getAccountSummary(userId: string): Promise<AccountSummary> {
  const [logs, retrospectives, comments, images] = await Promise.all([
    countOf("ai_logs", "author_id", userId),
    countOf("retrospectives", "author_id", userId),
    countOf("ai_log_comments", "author_id", userId),
    countOf("ai_log_attachments", "created_by", userId),
  ])

  return { counts: { logs, retrospectives, comments, images } }
}
