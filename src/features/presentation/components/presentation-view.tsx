import Link from "next/link"
import {
  Calendar,
  Circle,
  CircleArrowRight,
  CircleCheck,
  CircleMinus,
  ExternalLink,
  FlaskConical,
  Lightbulb,
  LinkIcon,
  MonitorPlay,
  Target,
  type LucideIcon,
} from "lucide-react"

import { Logo } from "@/components/logo"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ToolChips } from "@/features/ai-log/components/tool-chips"
import { ProjectStatusBadge } from "@/features/project/components/project-status-badge"
import { linkHost } from "@/features/project/rules"
import { kstDateKey } from "@/features/session/time"
import { cn } from "@/lib/utils"

import {
  presentationStats,
  type ClubPresentation,
  type PresentationStat,
  type ProjectPresentation,
  type PublicLog,
  type PublicPresentation,
  type PublicRetrospective,
} from "../content"
import { presentationPath } from "../token"

// 예: 2026년 10월 8일. 한국 시간 기준이다. 날짜를 알 수 없으면 빈 글자다.
export function formatDate(value: string) {
  if (!value) {
    return ""
  }
  const [year, month, day] = kstDateKey(value).split("-").map(Number)
  return `${year}년 ${month}월 ${day}일`
}

// 발표 화면의 틀. Club 안쪽 화면과 달리 메뉴가 없고, 로그인하지 않은 사람도 본다.
// slidesHref 가 있으면 같은 발표를 한 장씩 넘겨 보는 화면으로 가는 길을 둔다.
export function PresentationShell({
  slidesHref,
  children,
}: {
  slidesHref?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 sm:px-8">
        <Logo />
        {slidesHref && (
          <Link
            href={slidesHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <MonitorPlay aria-hidden="true" strokeWidth={1.5} />
            발표 모드
          </Link>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-[880px] flex-1 flex-col gap-10 px-4 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
      <footer className="border-t px-4 py-6 text-center text-caption text-muted-foreground sm:px-8">
        AI Club OS 로 만든 발표입니다. 링크를 받은 사람만 볼 수 있습니다.
      </footer>
    </div>
  )
}

// 링크가 틀렸거나 공개를 거둔 발표, 또는 불러오지 못한 발표.
export function PresentationUnavailable({
  reason,
}: {
  reason: "not-found" | "error"
}) {
  return (
    <div className="rounded-xl border bg-card">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <LinkIcon strokeWidth={1.5} />
          </EmptyMedia>
          <EmptyTitle>
            {reason === "not-found"
              ? "볼 수 없는 발표입니다"
              : "발표를 불러오지 못했습니다"}
          </EmptyTitle>
          <EmptyDescription>
            {reason === "not-found"
              ? "링크가 틀렸거나 공개를 거둔 발표입니다. 링크를 준 사람에게 다시 확인해 주세요."
              : "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 이 링크를 다시 열어 주세요."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}

export function Stat({ label, value, caption }: PresentationStat) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-5">
      <dt className="text-body-s text-muted-foreground">{label}</dt>
      <dd className="text-h2">{value}</dd>
      {caption && (
        <dd className="text-caption text-muted-foreground">{caption}</dd>
      )}
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">{title}</h2>
        {description && (
          <p className="text-body-s text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

// 공개하는 사람이 적은 소개 글. 적지 않았으면 그리지 않는다.
function Intro({ presentation }: { presentation: PublicPresentation }) {
  if (!presentation.intro) {
    return null
  }
  return (
    <section className="flex flex-col gap-2 rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="text-label-m text-muted-foreground">소개</h2>
      <p className="text-body-l break-words whitespace-pre-wrap">
        {presentation.intro}
      </p>
    </section>
  )
}

function Stats({
  presentation,
  className,
}: {
  presentation: PublicPresentation
  className: string
}) {
  return (
    <dl className={cn("grid gap-4", className)}>
      {presentationStats(presentation).map((stat) => (
        <Stat key={stat.label} {...stat} />
      ))}
    </dl>
  )
}

// 이름을 줄지어 보여 준다. 내보낼 이름이 없는 사람은 수로만 알린다.
export function Names({
  names,
  unit,
}: {
  names: (string | null)[]
  unit: string
}) {
  const shown = names.filter((name): name is string => name !== null)
  const hidden = names.length - shown.length

  return (
    <ul className="flex flex-wrap gap-2">
      {shown.map((name, index) => (
        <li
          key={`${name}-${index}`}
          className="rounded-full border bg-card px-3 py-1 text-label-m"
        >
          {name}
        </li>
      ))}
      {hidden > 0 && (
        <li className="rounded-full border border-dashed px-3 py-1 text-body-s text-muted-foreground">
          이름을 밝히지 않은 {unit} {hidden}명
        </li>
      )}
    </ul>
  )
}

export const LOG_PARTS: {
  key: "attempt" | "result" | "learned" | "nextAction"
  label: string
  icon: LucideIcon
}[] = [
  { key: "attempt", label: "시도한 내용", icon: FlaskConical },
  { key: "result", label: "결과", icon: Target },
  { key: "learned", label: "배운 점", icon: Lightbulb },
  { key: "nextAction", label: "다음 행동", icon: CircleArrowRight },
]

function LogArticle({ log }: { log: PublicLog }) {
  const date = formatDate(log.createdAt)

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        {(date || log.author) && (
          <p className="text-body-s text-muted-foreground">
            {[date, log.author].filter(Boolean).join(" · ")}
          </p>
        )}
        <h3 className="text-h4">{log.title}</h3>
        <ToolChips tools={log.tools} />
      </div>
      {LOG_PARTS.map(
        ({ key, label, icon: Icon }) =>
          log[key] && (
            <div key={key} className="flex flex-col gap-1.5">
              <h4 className="flex items-center gap-2 text-label-m">
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-icon-brand"
                />
                {label}
              </h4>
              <p className="break-words whitespace-pre-wrap">{log[key]}</p>
            </div>
          )
      )}
    </article>
  )
}

export const RETROSPECTIVE_PARTS: {
  key: "wentWell" | "toImprove" | "toTry"
  label: string
  icon: LucideIcon
  tone: string
}[] = [
  { key: "wentWell", label: "좋았던 것", icon: CircleCheck, tone: "text-icon-success" },
  { key: "toImprove", label: "아쉬운 것", icon: CircleMinus, tone: "text-icon-warning" },
  { key: "toTry", label: "다음에 해 볼 것", icon: CircleArrowRight, tone: "text-icon-brand" },
]

function RetrospectiveArticle({
  retrospective,
}: {
  retrospective: PublicRetrospective
}) {
  const date = formatDate(retrospective.createdAt)

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6">
      {(date || retrospective.author) && (
        <p className="text-body-s text-muted-foreground">
          {[date, retrospective.author].filter(Boolean).join(" · ")}
        </p>
      )}
      {RETROSPECTIVE_PARTS.map(
        ({ key, label, icon: Icon, tone }) =>
          retrospective[key] && (
            <div key={key} className="flex flex-col gap-1.5">
              <h3 className="flex items-center gap-2 text-label-m">
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className={cn("size-4 shrink-0", tone)}
                />
                {label}
              </h3>
              <p className="break-words whitespace-pre-wrap">
                {retrospective[key]}
              </p>
            </div>
          )
      )}
    </article>
  )
}

// Project 하나의 발표. 목표와 결과물만이 아니라 거기까지 온 기록과 할 일을 함께 보여 준다.
export function ProjectPresentationView({
  presentation,
}: {
  presentation: ProjectPresentation
}) {
  const { project, links, tasks, logs, retrospectives } = presentation

  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="text-overline text-brand">
          {presentation.clubName} 의 PROJECT
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display-l break-words">{project.name}</h1>
          <ProjectStatusBadge status={project.status} />
        </div>
        {project.goal && (
          <p className="text-body-l break-words whitespace-pre-wrap">
            {project.goal}
          </p>
        )}
      </div>
      <Intro presentation={presentation} />
      <Stats presentation={presentation} className="sm:grid-cols-3" />
      {links.length > 0 && (
        <Section title="결과물">
          <ul className="grid gap-3 sm:grid-cols-2">
            {links.map((link, index) => (
              <li key={`${link.url}-${index}`}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-brand-border focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <ExternalLink
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="size-5 shrink-0 text-icon-subtle"
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-label-m">{link.label}</span>
                    <span className="truncate text-caption text-muted-foreground">
                      {linkHost(link.url)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section
        title="과정"
        description="작성자가 발표에 넣어도 된다고 한 AI Log 를 남긴 순서대로 보여 줍니다."
      >
        {logs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {logs.map((log, index) => (
              <LogArticle key={`${log.createdAt}-${index}`} log={log} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border bg-card p-5 text-muted-foreground">
            발표에 담은 기록이 아직 없습니다.
          </p>
        )}
      </Section>
      {retrospectives.length > 0 && (
        <Section
          title="회고"
          description="참여자가 돌아보며 쓴 글입니다. 작성자가 발표에 넣어도 된다고 한 것만 보여 줍니다."
        >
          <div className="flex flex-col gap-4">
            {retrospectives.map((retrospective, index) => (
              <RetrospectiveArticle
                key={`${retrospective.createdAt}-${index}`}
                retrospective={retrospective}
              />
            ))}
          </div>
        </Section>
      )}
      {tasks.length > 0 && (
        <Section title="할 일">
          <ul className="flex flex-col gap-2 rounded-xl border bg-card p-5">
            {tasks.map((task, index) => {
              const Icon = task.done ? CircleCheck : Circle

              return (
                <li key={`${task.title}-${index}`} className="flex items-start gap-3">
                  <Icon
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className={cn(
                      "mt-0.5 size-5 shrink-0",
                      task.done ? "text-icon-success" : "text-icon-subtle"
                    )}
                  />
                  <span
                    className={cn(
                      "min-w-0 break-words",
                      task.done && "text-muted-foreground"
                    )}
                  >
                    {task.title}
                    <span className="sr-only">
                      {task.done ? " (끝냄)" : " (아직)"}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </Section>
      )}
      {presentation.participantNames &&
        presentation.participantNames.length > 0 && (
          <Section title="참여자">
            <Names names={presentation.participantNames} unit="참여자" />
          </Section>
        )}
    </>
  )
}

// Club 의 활동 전체를 보여 주는 발표. 진행한 회차와, 발표를 공개한 Project 를 모아 보여 준다.
// AI Log 의 내용과 AI Insight 는 담지 않는다. 그것들은 작성자마다 허락을 받지 않았다.
export function ClubPresentationView({
  presentation,
}: {
  presentation: ClubPresentation
}) {
  const { sessions, projects } = presentation

  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="text-overline text-brand">CLUB</p>
        <h1 className="text-display-l break-words">{presentation.clubName}</h1>
        {presentation.clubDescription && (
          <p className="text-body-l break-words whitespace-pre-wrap">
            {presentation.clubDescription}
          </p>
        )}
      </div>
      <Intro presentation={presentation} />
      <Stats presentation={presentation} className="grid-cols-2 sm:grid-cols-4" />
      {projects.length > 0 && (
        <Section
          title="Project"
          description="발표를 공개한 Project 입니다. 누르면 그 Project 의 발표로 갑니다."
        >
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <li key={project.token}>
                <Link
                  href={presentationPath(project.token)}
                  className="flex h-full flex-col gap-2 rounded-xl border bg-card p-5 transition-colors hover:border-brand-border focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-h4 break-words">
                      {project.name}
                    </span>
                    <ProjectStatusBadge status={project.status} />
                  </span>
                  {project.goal && (
                    <span className="line-clamp-3 text-body-s text-muted-foreground">
                      {project.goal}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {sessions.length > 0 && (
        <Section title="진행한 Session">
          <ol className="flex flex-col divide-y rounded-xl border bg-card px-5">
            {sessions.map((session, index) => (
              <li
                key={`${session.startsAt}-${index}`}
                className="flex items-center gap-3 py-3"
              >
                <Calendar
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-icon-subtle"
                />
                <span className="min-w-0 flex-1 break-words text-label-m">
                  {session.title}
                </span>
                <span className="shrink-0 text-body-s text-muted-foreground">
                  {formatDate(session.startsAt)}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}
      {presentation.memberNames && presentation.memberNames.length > 0 && (
        <Section title="Member">
          <Names names={presentation.memberNames} unit="Member" />
        </Section>
      )}
    </>
  )
}
