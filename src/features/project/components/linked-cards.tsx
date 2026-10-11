import Link from "next/link"
import { Calendar, FolderKanban } from "lucide-react"

import { cn } from "@/lib/utils"

import type { ProjectActionResult } from "../actions"
import type { ProjectLinkItem, SessionLinkItem } from "../links"
import type { ProjectStatus } from "../rules"
import { LinkPicker, UnlinkButton } from "./link-controls"
import { ProjectStatusBadge } from "./project-status-badge"

const ROW =
  "flex items-center gap-2 rounded-md py-1 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"

// 줄에 붙이는 설명. 직접 이어 둔 것과 기록으로 이어진 것을 가린다.
function linkCaption(item: { direct: boolean; logCount: number }) {
  if (item.logCount > 0) {
    return item.direct ? `이어 둠 · 기록 ${item.logCount}개` : `기록 ${item.logCount}개`
  }
  return "이어 둠"
}

// 이 Project 와 이어진 Session. 직접 이어 둔 것과, 이 Project 에 묶인 AI Log 를 남긴 회차를 함께 보여 준다.
// linkable 은 내가 이을 수 있는 Session 이다. null 이면 이을 수 없거나 그 구조가 아직 없는 것이다.
// onLink 와 unlink 는 잇고 끊는 동작이다. 실제 판단은 데이터베이스가 한다.
// 이어진 것도 이을 것도 없으면 아무것도 그리지 않는다.
export function ProjectSessionsCard({
  clubId,
  sessions,
  linkable = null,
  onLink,
  unlink,
}: {
  clubId: string
  sessions: SessionLinkItem[]
  linkable?: { id: string; name: string }[] | null
  onLink?: (sessionId: string) => Promise<ProjectActionResult>
  unlink?: (sessionId: string) => () => Promise<ProjectActionResult>
}) {
  const canLink = Boolean(onLink && linkable && linkable.length > 0)
  if (sessions.length === 0 && !canLink) {
    return null
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">이어진 Session</h2>
        <p className="text-body-s text-muted-foreground">
          이 Project 를 다루기로 한 회차와, 묶인 AI Log 를 남긴 회차입니다.
        </p>
      </div>
      {sessions.length > 0 && (
        <ul className="flex flex-col gap-1">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center gap-1">
              <Link
                href={`/clubs/${clubId}/sessions/${session.id}`}
                className={cn(ROW, "min-w-0 flex-1")}
              >
                <Calendar
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-icon-subtle"
                />
                <span className="min-w-0 flex-1 truncate text-label-m">
                  {session.title}
                </span>
                <span className="shrink-0 text-body-s text-muted-foreground">
                  {linkCaption(session)}
                </span>
              </Link>
              {session.direct && unlink && (
                <UnlinkButton
                  label={`${session.title} 과의 연결 끊기`}
                  onUnlink={unlink(session.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {onLink && linkable && (
        <LinkPicker label="이을 Session" options={linkable} onLink={onLink} />
      )}
    </section>
  )
}

// 한 회차와 이어진 Project. Session 개요의 옆 칸에 놓는다.
// 직접 이어 둔 것과, 이 회차에 남긴 AI Log 가 묶인 Project 를 함께 보여 준다.
// linkable 은 내가 이을 수 있는 Project 다. 운영자에게는 모두, 참여자에게는 자기 Project 가 온다.
// 이어진 것도 이을 것도 없으면 아무것도 그리지 않는다.
export function SessionProjectsCard({
  clubId,
  projects,
  linkable = null,
  onLink,
  unlink,
}: {
  clubId: string
  projects: (ProjectLinkItem & { canUnlink?: boolean })[]
  linkable?: { id: string; name: string }[] | null
  onLink?: (projectId: string) => Promise<ProjectActionResult>
  unlink?: (projectId: string) => () => Promise<ProjectActionResult>
}) {
  const canLink = Boolean(onLink && linkable && linkable.length > 0)
  if (projects.length === 0 && !canLink) {
    return null
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">이 회차의 Project</h2>
        <p className="text-body-s text-muted-foreground">
          이 회차에서 다루기로 한 Project 와, 이 회차의 AI Log 가 묶인
          Project 입니다.
        </p>
      </div>
      {projects.length > 0 && (
        <ul className="flex flex-col gap-1">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center gap-1">
              <Link
                href={`/clubs/${clubId}/projects/${project.id}`}
                className={cn(ROW, "min-w-0 flex-1")}
              >
                <FolderKanban
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-icon-subtle"
                />
                <span className="min-w-0 flex-1 truncate text-label-m">
                  {project.name}
                </span>
                <span className="shrink-0 text-body-s text-muted-foreground">
                  {linkCaption(project)}
                </span>
              </Link>
              {project.direct && project.canUnlink && unlink && (
                <UnlinkButton
                  label={`${project.name} 과의 연결 끊기`}
                  onUnlink={unlink(project.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {onLink && linkable && (
        <LinkPicker label="이을 Project" options={linkable} onLink={onLink} />
      )}
    </section>
  )
}

export type MyProject = {
  id: string
  name: string
  status: ProjectStatus
  // 아직 끝내지 않은 할 일의 수.
  remainingTasks: number
}

// 한 번에 보여 주는 내 Project 의 수.
export const MY_PROJECT_LIMIT = 3

// Club 개요의 옆 칸에 놓는, 내가 참여하는 진행 중인 Project.
// 참여하는 것이 없으면 아무것도 그리지 않는다.
export function MyProjectsCard({
  clubId,
  projects,
}: {
  clubId: string
  projects: MyProject[]
}) {
  if (projects.length === 0) {
    return null
  }
  const shown = projects.slice(0, MY_PROJECT_LIMIT)

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h4">내 Project</h2>
        <Link
          href={`/clubs/${clubId}/projects`}
          className="rounded-sm text-body-s text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          모두 보기
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {shown.map((project) => (
          <li key={project.id}>
            <Link
              href={`/clubs/${clubId}/projects/${project.id}`}
              className="flex flex-col gap-1 rounded-md transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-label-m">
                  {project.name}
                </span>
                <ProjectStatusBadge status={project.status} />
              </span>
              <span className="text-body-s text-muted-foreground">
                {project.remainingTasks > 0
                  ? `남은 할 일 ${project.remainingTasks}개`
                  : "남은 할 일이 없습니다"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {projects.length > shown.length && (
        <p className="text-caption text-muted-foreground">
          외 {projects.length - shown.length}개
        </p>
      )}
    </section>
  )
}
