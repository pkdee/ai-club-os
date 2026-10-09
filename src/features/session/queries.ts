import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

export type Session = {
  id: string
  clubId: string
  title: string
  description: string
  location: string
  startsAt: string
  endsAt: string
}

export type SessionListResult =
  | { status: "ok"; sessions: Session[] }
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
}

const SESSION_COLUMNS =
  "id, club_id, title, description, location, starts_at, ends_at"
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    clubId: row.club_id,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  }
}

// Club 의 Session 을 시작 시각이 빠른 순서로 읽는다.
// 다른 Club 의 Session 은 데이터베이스의 접근 규칙이 막는다.
export const listSessions = cache(
  async (clubId: string): Promise<SessionListResult> => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sessions")
      .select(SESSION_COLUMNS)
      .eq("club_id", clubId)
      .order("starts_at", { ascending: true })

    if (error) {
      console.error("Session 목록을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return { status: "ok", sessions: (data as SessionRow[]).map(toSession) }
  }
)

export const getSession = cache(
  async (clubId: string, sessionId: string): Promise<SessionResult> => {
    if (!UUID_PATTERN.test(sessionId)) {
      return { status: "not-found" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("sessions")
      .select(SESSION_COLUMNS)
      .eq("club_id", clubId)
      .eq("id", sessionId)
      .maybeSingle()

    if (error) {
      console.error("Session 을 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    return data
      ? { status: "ok", session: toSession(data as SessionRow) }
      : { status: "not-found" }
  }
)
