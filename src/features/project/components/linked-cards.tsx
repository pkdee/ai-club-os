import Link from "next/link"
import { Calendar, FolderKanban } from "lucide-react"

import type { LinkedProject, LinkedSession } from "../links"
import type { ProjectStatus } from "../rules"
import { ProjectStatusBadge } from "./project-status-badge"

const ROW =
  "flex items-center gap-2 rounded-md py-1 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"

// 이 Project 의 AI Log 가 나온 Session. 기록을 거쳐 이어진 것이라 여기서 따로 묶지는 않는다.
// 이어진 Session 이 없으면 아무것도 그리지 않는다.
export function ProjectSessionsCard({
  clubId,
  sessions,
}: {
  clubId: string
  sessions: LinkedSession[]
}) {
  if (sessions.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">기록이 나온 Session</h2>
        <p className="text-body-s text-muted-foreground">
          이 Project 에 묶인 AI Log 를 남긴 회차입니다.
        </p>
      </div>
      <ul className="flex flex-col gap-1">
        {sessions.map((session) => (
          <li key={session.id}>
            <Link
              href={`/clubs/${clubId}/sessions/${session.id}`}
              className={ROW}
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
                기록 {session.logCount}개
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

// 한 회차의 AI Log 가 묶인 Project. Session 개요의 옆 칸에 놓는다.
// 묶인 Project 가 없으면 아무것도 그리지 않는다.
export function SessionProjectsCard({
  clubId,
  projects,
}: {
  clubId: string
  projects: LinkedProject[]
}) {
  if (projects.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">이 회차의 Project</h2>
        <p className="text-body-s text-muted-foreground">
          이 회차에 남긴 AI Log 가 묶인 Project 입니다.
        </p>
      </div>
      <ul className="flex flex-col gap-1">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              href={`/clubs/${clubId}/projects/${project.id}`}
              className={ROW}
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
                기록 {project.logCount}개
              </span>
            </Link>
          </li>
        ))}
      </ul>
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
