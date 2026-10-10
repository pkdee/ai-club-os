import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

export type DeletedEntity = "ai_log" | "session" | "project" | "ai_insight"

export const DELETED_ENTITY_LABEL: Record<DeletedEntity, string> = {
  ai_log: "AI Log",
  session: "Session",
  project: "Project",
  ai_insight: "AI Insight",
}

export type DeletionLog = {
  id: string
  entity: DeletedEntity
  title: string
  // 지운 AI Log 의 작성자 이름. 다른 종류이거나 작성자가 이미 나간 기록이면 null 이다.
  ownerName: string | null
  deletedByName: string
  deletedAt: string
}

// unavailable 은 데이터베이스에 지운 기록을 두는 구조가 아직 없다는 뜻이다.
export type DeletionLogResult =
  | { status: "ok"; logs: DeletionLog[] }
  | { status: "unavailable" }
  | { status: "error" }

// 한 번에 보여 주는 지운 기록의 수.
export const DELETION_LOG_LIMIT = 30

type DeletionLogRow = {
  id: string
  entity: DeletedEntity
  title: string
  owner_name: string | null
  deleted_by_name: string
  created_at: string
}

// 누가 언제 무엇을 지웠는지를 최근 순으로 읽는다. 운영자에게만 보인다.
// 기록은 데이터베이스가 지울 때 직접 남기므로 앱에서는 읽기만 한다.
export const listDeletionLogs = cache(
  async (clubId: string): Promise<DeletionLogResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("deletion_logs")
      .select("id, entity, title, owner_name, deleted_by_name, created_at")
      .eq("club_id", clubId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(0, DELETION_LOG_LIMIT - 1)

    if (error) {
      // 뒤의 번호는 데이터 API 가 테이블을 모를 때다.
      if (error.code === "42P01" || error.code === "PGRST205") {
        return { status: "unavailable" }
      }
      console.error("지운 기록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return {
      status: "ok",
      logs: (data as DeletionLogRow[]).map((row) => ({
        id: row.id,
        entity: row.entity,
        title: row.title,
        ownerName: row.owner_name,
        deletedByName: row.deleted_by_name,
        deletedAt: row.created_at,
      })),
    }
  }
)
