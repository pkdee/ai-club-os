import Link from "next/link"
import { CircleAlert, FolderKanban, Info, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { LinkTabs } from "@/components/ui/link-tabs"

import type { Project, ProjectListResult } from "../queries"
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type ProjectStatus,
} from "../rules"
import { ProjectFormDialog } from "./project-form-dialog"
import { ProjectStatusBadge } from "./project-status-badge"

export type ProjectView = "all" | ProjectStatus

// 카드에 얼굴로 보여 주는 참여자 수. 나머지는 수로 알린다.
const SHOWN_PARTICIPANTS = 4

function ProjectCard({ project }: { project: Project }) {
  const done = project.tasks.filter((task) => task.done).length
  const shown = project.participants.slice(0, SHOWN_PARTICIPANTS)
  const more = project.participants.length - shown.length
  const counts = [
    project.logCount !== null && `AI Log ${project.logCount}개`,
    project.tasks.length > 0 && `할 일 ${done} / ${project.tasks.length}`,
  ].filter(Boolean)

  return (
    <Link
      href={`/clubs/${project.clubId}/projects/${project.id}`}
      className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-input focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-h4">{project.name}</h3>
        <ProjectStatusBadge status={project.status} />
      </div>
      <p className="line-clamp-2 flex-1 text-muted-foreground">
        {project.goal || "아직 적은 목표가 없습니다."}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          {shown.length > 0 ? (
            <span className="flex -space-x-1.5">
              {shown.map((participant) => (
                <Avatar
                  key={participant.memberId}
                  size="sm"
                  name={participant.name}
                  src={participant.avatarUrl}
                  className="ring-2 ring-card"
                />
              ))}
            </span>
          ) : (
            <span className="text-caption text-muted-foreground">
              참여자 없음
            </span>
          )}
          {more > 0 && (
            <span className="text-caption text-muted-foreground">
              외 {more}명
            </span>
          )}
          <span className="sr-only">
            참여자 {project.participants.map((item) => item.name).join(", ")}
          </span>
        </div>
        <p className="text-caption text-muted-foreground">
          {counts.join(" · ")}
        </p>
      </div>
    </Link>
  )
}

// Club 의 Project 를 모아 보는 화면. Member 는 누구나 Project 를 만들 수 있다.
export function ProjectListScreen({
  clubId,
  view,
  result,
}: {
  clubId: string
  view: ProjectView
  result: ProjectListResult
}) {
  const base = `/clubs/${clubId}/projects`
  const projects = result.status === "ok" ? result.projects : []
  const shown =
    view === "all"
      ? projects
      : projects.filter((project) => project.status === view)
  const create = <ProjectFormDialog target={{ clubId }} />

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1">Project</h1>
          <p className="text-muted-foreground">
            여러 AI Log 와 할 일, 결과물을 하나로 묶어 어떤 과정을 거쳐 왔는지
            보여 줍니다.
          </p>
        </div>
        {projects.length > 0 && create}
      </div>
      {result.status === "unavailable" ? (
        <Alert tone="info">
          <Info aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>Project 를 아직 쓸 수 없습니다</AlertTitle>
          <AlertDescription>
            데이터베이스에 Project 의 구조가 아직 없습니다. 최신 마이그레이션을
            적용하면 여기에서 만들 수 있습니다.
          </AlertDescription>
        </Alert>
      ) : result.status === "error" ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <CircleAlert strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>Project 를 불러오지 못했습니다</EmptyTitle>
              <EmptyDescription>
                연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해
                주세요.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href={base} className={buttonVariants({ variant: "outline" })}>
                <RefreshCw aria-hidden="true" strokeWidth={1.5} />
                다시 시도
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <FolderKanban strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>아직 Project 가 없습니다</EmptyTitle>
              <EmptyDescription>
                만들고 싶은 것을 Project 로 두고, 관련된 AI Log 와 할 일을 묶어
                보세요. 혼자 하는 것도 괜찮습니다.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{create}</EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          <LinkTabs
            label="Project 보기"
            tabs={[
              {
                href: base,
                label: "전체",
                count: projects.length,
                active: view === "all",
              },
              ...PROJECT_STATUSES.map((status) => ({
                href: `${base}?status=${status}`,
                label: PROJECT_STATUS_LABEL[status],
                count: projects.filter((project) => project.status === status)
                  .length,
                active: view === status,
              })),
            ]}
          />
          {shown.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {shown.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border bg-card p-5 text-muted-foreground">
              이 상태의 Project 가 없습니다.
            </p>
          )}
        </>
      )}
    </>
  )
}
