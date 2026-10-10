import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

export type Session = {
  id: string
  clubId: string
  title: string
  description: string
  location: string
  startsAt: string
  endsAt: string
  // 시간표. 한 줄에 하나씩 적은 글이다. 데이터베이스에 그 열이 아직 없으면 null 이다.
  agenda: string | null
}

// agendaReady 는 데이터베이스에 시간표 열이 있다는 뜻이다. 없으면 만드는 창에 시간표 칸을 그리지 않는다.
export type SessionListResult =
  | { status: "ok"; sessions: Session[]; agendaReady: boolean }
  | { status: "error" }

export type SessionResult =
  | { status: "ok"; session: Session }
  | { status: "not-found" }
  | { status: "error" }

type SessionRow = {
  id: string
  club_id: string
  title: string
  description: string
  location: string
  starts_at: string
  ends_at: string
  // 시간표 열이 아직 없는 데이터베이스에서 읽으면 이 값이 없다.
  agenda?: string
}

const SESSION_COLUMNS =
  "id, club_id, title, description, location, starts_at, ends_at"
// 시간표. 그 열이 생긴 뒤에만 읽을 수 있다.
const AGENDA_COLUMN = ", agenda"
// 열이 아직 없을 때의 오류 번호.
const MISSING_COLUMN = "42703"

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    clubId: row.club_id,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    agenda: typeof row.agenda === "string" ? row.agenda : null,
  }
}

// Club 의 Session 을 시작 시각이 빠른 순서로 읽는다.
// 다른 Club 의 Session 은 데이터베이스의 접근 규칙이 막는다.
export const listSessions = cache(
  async (clubId: string): Promise<SessionListResult> => {
    const supabase = await createClient()
    const read = (columns: string) =>
      supabase
        .from("sessions")
        .select(columns)
        .eq("club_id", clubId)
        .order("starts_at", { ascending: true })

    // 시간표와 함께 읽어 보고, 그 열이 아직 없으면 시간표 없이 다시 읽는다.
    let response = await read(SESSION_COLUMNS + AGENDA_COLUMN)
    const agendaReady = response.error?.code !== MISSING_COLUMN
    if (!agendaReady) {
      response = await read(SESSION_COLUMNS)
    }
    const { data, error } = response

    if (error) {
      console.error("Session 목록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return {
      status: "ok",
      sessions: (data as unknown as SessionRow[]).map(toSession),
      agendaReady,
    }
  }
)

export const getSession = cache(
  async (clubId: string, sessionId: string): Promise<SessionResult> => {
    if (!isUuid(sessionId)) {
      return { status: "not-found" }
    }

    const supabase = await createClient()
    const read = (columns: string) =>
      supabase
        .from("sessions")
        .select(columns)
        .eq("club_id", clubId)
        .eq("id", sessionId)
        .maybeSingle()

    let response = await read(SESSION_COLUMNS + AGENDA_COLUMN)
    if (response.error?.code === MISSING_COLUMN) {
      response = await read(SESSION_COLUMNS)
    }
    const { data, error } = response

    if (error) {
      console.error("Session 을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return data
      ? { status: "ok", session: toSession(data as unknown as SessionRow) }
      : { status: "not-found" }
  }
)
