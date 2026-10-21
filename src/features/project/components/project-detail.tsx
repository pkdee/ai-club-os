import Link from "next/link"
import { CircleAlert, Info } from "lucide-react"

import { DeleteDialog } from "@/components/delete-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { deleteProject } from "../actions"
import type {
  Project,
  ProjectJoinRequest,
  ProjectTaskDetail,
} from "../queries"
import { ProjectFormDialog } from "./project-form-dialog"
import { ProjectLinks } from "./project-links"
import { ProjectParticipants } from "./project-participants"
import { ProjectStatusBadge } from "./project-status-badge"
import { ProjectStatusSelect } from "./project-status-select"
import { ProjectTasks } from "./project-tasks"

const MESSAGES = {
  "not-found": {
    title: "Project 를 찾을 수 없습니다",
    description: "주소가 맞는지 확인하거나 Project 목록에서 다시 골라 주세요.",
  },
  error: {
    title: "Project 를 불러오지 못했습니다",
    description:
      "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.",
  },
}

export function ProjectUnavailable({
  clubId,
  reason,
}: {
  clubId: string
  reason: keyof typeof MESSAGES | "unavailable"
}) {
  if (reason === "unavailable") {
    return (
      <Alert tone="info">
        <Info aria-hidden="true" strokeWidth={1.5} />
        <AlertTitle>Project 를 아직 쓸 수 없습니다</AlertTitle>
        <AlertDescription>
          데이터베이스에 Project 의 구조가 아직 없습니다. 최신 마이그레이션을
          적용하면 쓸 수 있습니다.
        </AlertDescription>
      </Alert>
    )
  }
  const { title, description } = MESSAGES[reason]

  return (
    <div className="rounded-xl border bg-card">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <CircleAlert strokeWidth={1.5} />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            href={`/clubs/${clubId}/projects`}
            className={buttonVariants({ variant: "outline" })}
          >
            Project 목록으로
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}

// 지울 때 함께 지워지는 것과 남는 것을 알려 주는 글.
function deleteNotes(project: Project) {
  return [
    `참여자 ${project.participants.length}명의 참여, 할 일 ${project.tasks.length}개, 결과물 링크 ${project.links.length}개가 함께 지워집니다.`,
    project.logCount === null
      ? "묶여 있던 AI Log 는 지워지지 않고, Project 연결만 끊긴 채 Club 의 기록으로 남습니다."
      : project.logCount === 0
        ? "이 Project 에 묶인 AI Log 는 없습니다."
        : `AI Log ${project.logCount}개는 지워지지 않고, Project 연결만 끊긴 채 Club 의 기록으로 남습니다.`,
    "지우면 되돌릴 수 없습니다. 지웠다는 사실과 제목은 운영자가 볼 수 있게 남습니다.",
  ]
}

// Project 하나의 화면. 참여자와 운영자는 고치고, 다른 Member 는 읽기만 한다.
// canEdit 는 참여자이거나 운영자, canDelete 는 만든 사람이거나 운영자라는 뜻이다. 실제 판단은 데이터베이스가 한다.
// candidates 는 참여자로 넣을 수 있는 Member 다. actions 와 children, aside 에는 다른 기능이 올리는 버튼과 영역을 넣는다.
// taskDetails 는 할 일의 담당자와 기한, today 는 한국 시간의 오늘 날짜다.
// requests 는 들어온 참여 요청, myRequest 는 참여자가 아닌 내가 요청해 둔 상태다.
export function ProjectDetail({
  clubName,
  project,
  canEdit,
  canDelete,
  currentUserId,
  candidates,
  taskDetails,
  today,
  requests,
  myRequest,
  actions,
  aside,
  children,
}: {
  clubName: string
  project: Project
  canEdit: boolean
  canDelete: boolean
  currentUserId: string
  candidates: { memberId: string; name: string }[] | null
  taskDetails: Record<string, ProjectTaskDetail> | null
  today: string
  requests: ProjectJoinRequest[]
  myRequest: "none" | "pending" | null
  actions?: React.ReactNode
  aside?: React.ReactNode
  children?: React.ReactNode
}) {
  const clubHref = `/clubs/${project.clubId}`

  return (
    <>
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: clubName, href: clubHref },
            { label: "Project", href: `${clubHref}/projects` },
            { label: project.name },
          ]}
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="text-h1">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          {(canEdit || canDelete || actions) && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {canDelete && (
                <DeleteDialog
                  label="삭제"
                  title="이 Project 를 지울까요?"
                  description={deleteNotes(project).map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                  onDelete={deleteProject.bind(null, project.clubId, project.id)}
                />
              )}
              {canEdit && (
                <ProjectFormDialog
                  target={{ clubId: project.clubId, projectId: project.id }}
                  defaults={{ name: project.name, goal: project.goal }}
                />
              )}
              {actions}
            </div>
          )}
        </div>
      </div>
      {/* 오른쪽 묶음이 더 길 때 남는 높이를 둘째 줄이 받게 한다. 그러지 않으면 목표와 할 일 사이가 벌어진다. */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:grid-rows-[auto_1fr]">
        <section className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-6 xl:col-start-1">
          <h2 className="text-h4">목표</h2>
          {project.goal ? (
            <p className="text-body-l whitespace-pre-wrap">{project.goal}</p>
          ) : (
            <p className="text-muted-foreground">아직 적은 목표가 없습니다.</p>
          )}
        </section>
        <aside className="flex min-w-0 flex-col gap-6 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          {canEdit && (
            <ProjectStatusSelect
              clubId={project.clubId}
              projectId={project.id}
              status={project.status}
            />
          )}
          <ProjectParticipants
            clubId={project.clubId}
            projectId={project.id}
            participants={project.participants}
            candidates={candidates}
            requests={requests}
            myRequest={myRequest}
            currentUserId={currentUserId}
            canEdit={canEdit}
          />
          <ProjectLinks
            clubId={project.clubId}
            projectId={project.id}
            links={project.links}
            canEdit={canEdit}
          />
          {aside}
        </aside>
        <div className="flex min-w-0 flex-col gap-6 xl:col-start-1">
          <ProjectTasks
            clubId={project.clubId}
            projectId={project.id}
            tasks={project.tasks}
            details={taskDetails}
            participants={project.participants.map((item) => ({
              memberId: item.memberId,
              name: item.name,
            }))}
            today={today}
            canEdit={canEdit}
          />
          {children}
        </div>
      </div>
    </>
  )
}
