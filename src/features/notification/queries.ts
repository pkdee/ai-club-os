import { cache } from "react"

import { monthKeyOf, monthLabel } from "@/features/ai-insight/period"
import { memberName } from "@/features/member/name"
import { listProjects } from "@/features/project/queries"
import { kstDateKey } from "@/features/session/time"
import { createClient } from "@/lib/supabase/server"

import {
  buildNotifications,
  countNotifications,
  type Notification,
  type NotificationSource,
} from "./items"

// unavailable 은 데이터베이스에 알림을 본 시각을 두는 구조가 아직 없다는 뜻이다. 그때는 알림을 보여 주지 않는다.
export type NotificationsResult =
  | { status: "ok"; items: Notification[]; count: number }
  | { status: "unavailable" }
  | { status: "error" }

// 참여자가 된 Project 와 공개된 AI Insight 를 소식으로 보여 주는 기간(일).
const RECENT_DAYS = 14
// 한 번에 읽는 공개된 AI Insight 의 수.
const INSIGHT_LIMIT = 10
// 한 번에 읽는 댓글과 표시의 수.
const FEEDBACK_LIMIT = 50

// 아직 없는 테이블이나 열, 관계를 읽으려 했을 때의 오류 번호. 그 부분만 비워 두고 나머지는 보여 준다.
function isMissing(error: { code?: string }) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "42703" ||
    error.code === "PGRST200"
  )
}

function rows<T>(
  label: string,
  response: { data: unknown; error: { code?: string } | null } | null
): T[] {
  if (!response) {
    return []
  }
  if (response.error) {
    if (!isMissing(response.error)) {
      console.error(`알림에 쓸 ${label} 불러오지 못했습니다.`, response.error)
    }
    return []
  }
  return (response.data ?? []) as T[]
}

// 내가 이 Club 에서 봐야 할 것들을 지금의 기록에서 읽어 낸다. 알림을 따로 쌓아 두지 않는다.
//   내가 참여하는 Project 에 들어온 참여 요청
//   내가 맡은, 아직 끝내지 않은 할 일
//   최근에 내가 참여자가 된 Project (요청이 받아들여졌거나 참여자가 나를 넣은 것)
//   최근에 공개된 AI Insight
//   최근에 내가 운영자가 된 것
//   최근에 내 AI Log 에 달린 댓글과 도움이 됐어요 표시
// memberId 는 이 Club 에서의 내 Member 식별자다. isAdmin 은 내가 운영자라는 뜻이다.
// 참여자가 한 명도 없는 Project 에 들어온 참여 요청은 받아 줄 사람이 운영자뿐이라 운영자에게 보여 준다.
export const getNotifications = cache(
  async (
    clubId: string,
    userId: string,
    memberId: string | null,
    isAdmin: boolean
  ): Promise<NotificationsResult> => {
    const supabase = await createClient()
    const seen = await supabase
      .from("notification_reads")
      .select("seen_at")
      .eq("club_id", clubId)
      .maybeSingle()

    if (seen.error) {
      if (isMissing(seen.error)) {
        return { status: "unavailable" }
      }
      console.error("알림을 본 시각을 불러오지 못했습니다.", seen.error)
      return { status: "error" }
    }
    const seenAt = (seen.data as { seen_at: string } | null)?.seen_at ?? null

    const now = new Date()
    const since = new Date(
      now.getTime() - RECENT_DAYS * 24 * 60 * 60 * 1000
    ).toISOString()
    const projectList = await listProjects(clubId)
    const projects = projectList.status === "ok" ? projectList.projects : []
    const byId = new Map(projects.map((project) => [project.id, project]))
    const ownerless = new Set(
      isAdmin
        ? projects
            .filter((project) => project.participants.length === 0)
            .map((project) => project.id)
        : []
    )
    const mine = projects
      .filter(
        (project) =>
          ownerless.has(project.id) ||
          project.participants.some((item) => item.userId === userId)
      )
      .map((project) => project.id)

    const [requests, tasks, joined, insights, role, comments, reactions] =
      await Promise.all([
      mine.length > 0
        ? supabase
            .from("project_join_requests")
            .select(
              "project_id, member_id, created_at, member:members!project_join_requests_member_fkey(display_name, email)"
            )
            .eq("club_id", clubId)
            .in("project_id", mine)
        : null,
      memberId
        ? supabase
            .from("project_tasks")
            .select("id, project_id, title, due_on, assigned_at")
            .eq("club_id", clubId)
            .eq("assignee_member_id", memberId)
            .eq("done", false)
        : null,
      memberId
        ? supabase
            .from("project_members")
            .select("project_id, created_at")
            .eq("club_id", clubId)
            .eq("member_id", memberId)
            .gte("created_at", since)
        : null,
      supabase
        .from("ai_insights")
        .select(
          "id, session_id, period_start, published_at, session:sessions!ai_insights_session_fkey(title)"
        )
        .eq("club_id", clubId)
        .eq("status", "published")
        .gte("published_at", since)
        .order("published_at", { ascending: false })
        .range(0, INSIGHT_LIMIT - 1),
      // 역할이 바뀐 시각. 그 열이 아직 없으면 이 소식만 빠진다.
      isAdmin
        ? supabase
            .from("members")
            .select("role_changed_at")
            .eq("club_id", clubId)
            .eq("user_id", userId)
            .eq("role", "admin")
            .gte("role_changed_at", since)
        : null,
      // 내가 쓴 기록에 달린 댓글. 테이블이 아직 없으면 이 소식만 빠진다.
      supabase
        .from("ai_log_comments")
        .select(
          "id, created_at, author_id, log:ai_logs!ai_log_comments_log_fkey!inner(id, title, author_id), author:members!ai_log_comments_author_fkey(display_name, email)"
        )
        .eq("club_id", clubId)
        .eq("log.author_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .range(0, FEEDBACK_LIMIT - 1),
      // 내가 쓴 기록에 달린 도움이 됐어요 표시.
      supabase
        .from("ai_log_reactions")
        .select(
          "created_at, log:ai_logs!ai_log_reactions_log_fkey!inner(id, title, author_id)"
        )
        .eq("club_id", clubId)
        .eq("log.author_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .range(0, FEEDBACK_LIMIT - 1),
    ])

    // 표시는 기록마다 한 줄로 모은다. 최근 것부터 오므로 처음 본 것이 마지막으로 표시한 시각이다.
    const helpful = new Map<
      string,
      { at: string; title: string; count: number }
    >()
    for (const row of rows<{
      created_at: string
      log: { id: string; title: string }
    }>("도움이 됐다는 표시를", reactions)) {
      const entry = helpful.get(row.log.id)
      if (entry) {
        entry.count += 1
      } else {
        helpful.set(row.log.id, {
          at: row.created_at,
          title: row.log.title,
          count: 1,
        })
      }
    }

    const sources: NotificationSource[] = [
      ...rows<{
        project_id: string
        member_id: string
        created_at: string
        member: { display_name: string; email: string | null } | null
      }>("참여 요청을", requests).flatMap((row) => {
        const project = byId.get(row.project_id)
        return project && row.member
          ? [
              {
                kind: "join-request" as const,
                id: `${row.project_id}:${row.member_id}`,
                at: row.created_at,
                projectId: project.id,
                projectName: project.name,
                requesterName: memberName(row.member),
                ownerless: ownerless.has(project.id),
              },
            ]
          : []
      }),
      ...rows<{
        id: string
        project_id: string
        title: string
        due_on: string | null
        assigned_at: string | null
      }>("맡은 할 일을", tasks).flatMap((row) => {
        const project = byId.get(row.project_id)
        return project
          ? [
              {
                kind: "task" as const,
                id: row.id,
                at: row.assigned_at,
                projectId: project.id,
                projectName: project.name,
                title: row.title,
                dueOn: row.due_on,
              },
            ]
          : []
      }),
      ...rows<{ project_id: string; created_at: string }>(
        "참여하게 된 Project 를",
        joined
      ).flatMap((row) => {
        const project = byId.get(row.project_id)
        // 내가 만든 Project 는 만들면서 참여자가 된 것이라 소식이 아니다.
        return project && project.createdBy !== userId
          ? [
              {
                kind: "accepted" as const,
                id: row.project_id,
                at: row.created_at,
                projectId: project.id,
                projectName: project.name,
              },
            ]
          : []
      }),
      ...rows<{
        id: string
        created_at: string
        author_id: string | null
        log: { id: string; title: string }
        author: { display_name: string; email: string | null } | null
      }>("내 기록에 달린 댓글을", comments)
        // 내가 내 기록에 단 댓글은 소식이 아니다.
        .filter((row) => row.author_id !== userId)
        .map((row) => ({
          kind: "comment" as const,
          id: row.id,
          at: row.created_at,
          logId: row.log.id,
          logTitle: row.log.title,
          commenterName: row.author ? memberName(row.author) : "탈퇴한 Member",
        })),
      ...Array.from(helpful, ([logId, entry]) => ({
        kind: "helpful" as const,
        id: logId,
        at: entry.at,
        logId,
        logTitle: entry.title,
        count: entry.count,
      })),
      ...rows<{ role_changed_at: string }>("역할이 바뀐 시각을", role).map(
        (row) => ({
          kind: "admin" as const,
          id: clubId,
          at: row.role_changed_at,
        })
      ),
      ...rows<{
        id: string
        session_id: string | null
        period_start: string | null
        published_at: string
        session: { title: string } | null
      }>("공개된 AI Insight 를", insights).map((row) => {
        const month = row.period_start ? monthKeyOf(row.period_start) : null
        return {
          kind: "insight" as const,
          id: row.id,
          at: row.published_at,
          title: row.session?.title ?? (month ? monthLabel(month) : "AI Insight"),
          sessionId: row.session_id,
          month: row.session_id ? null : month,
        }
      }),
    ]

    const items = buildNotifications(sources, seenAt, kstDateKey(now))
    return { status: "ok", items, count: countNotifications(items) }
  }
)
