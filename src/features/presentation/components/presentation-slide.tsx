import Link from "next/link"
import { Calendar, Circle, CircleCheck, ExternalLink } from "lucide-react"

import { HighlightedMarkdown } from "@/components/markdown/highlighted-markdown"
import { ToolChips } from "@/features/ai-log/components/tool-chips"
import { ProjectStatusBadge } from "@/features/project/components/project-status-badge"
import { linkHost } from "@/features/project/rules"
import { cn } from "@/lib/utils"

import type { Slide } from "../slides"
import { presentationPath } from "../token"
import {
  formatDate,
  LOG_PARTS,
  Names,
  RETROSPECTIVE_PARTS,
  Stat,
} from "./presentation-view"

function SlideTitle({
  children,
  caption,
}: {
  children: React.ReactNode
  caption?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-h1 break-words">{children}</h2>
      {caption && <p className="text-body-s text-muted-foreground">{caption}</p>}
    </div>
  )
}

// 발표의 한 장. 무엇을 담을지는 buildSlides 가 정하고, 여기서는 그리기만 한다.
// backHref 는 같은 발표를 이어 보는 화면의 주소다.
export function PresentationSlide({
  slide,
  backHref,
}: {
  slide: Slide
  backHref: string
}) {
  switch (slide.kind) {
    case "cover":
      return (
        <div className="flex flex-col gap-4">
          <p className="text-overline text-brand">{slide.overline}</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display-l break-words">{slide.title}</h1>
            {slide.status && <ProjectStatusBadge status={slide.status} />}
          </div>
          {slide.lead && (
            <p className="text-body-l break-words whitespace-pre-wrap">
              {slide.lead}
            </p>
          )}
        </div>
      )

    case "text":
      return (
        <>
          <SlideTitle>{slide.title}</SlideTitle>
          <p className="text-h3 font-normal break-words whitespace-pre-wrap">
            {slide.body}
          </p>
        </>
      )

    case "stats":
      return (
        <>
          <SlideTitle>{slide.title}</SlideTitle>
          <dl
            className={cn(
              "grid gap-4",
              slide.items.length > 3
                ? "grid-cols-2 lg:grid-cols-4"
                : "sm:grid-cols-3"
            )}
          >
            {slide.items.map((stat) => (
              <Stat key={stat.label} {...stat} />
            ))}
          </dl>
        </>
      )

    case "links":
      return (
        <>
          <SlideTitle>{slide.title}</SlideTitle>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {slide.items.map((link, index) => (
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
        </>
      )

    case "log": {
      const { log } = slide
      const date = formatDate(log.createdAt)

      return (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-body-s text-muted-foreground">
              {[`과정 ${slide.position} / ${slide.total}`, date, log.author]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h2 className="text-h1 break-words">{log.title}</h2>
            <ToolChips tools={log.tools} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {LOG_PARTS.map(
              ({ key, label, icon: Icon }) =>
                log[key] && (
                  <div
                    key={key}
                    className="flex flex-col gap-1.5 rounded-xl border bg-card p-5"
                  >
                    <h3 className="flex items-center gap-2 text-label-m">
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.5}
                        className="size-4 shrink-0 text-icon-brand"
                      />
                      {label}
                    </h3>
                    <HighlightedMarkdown
                      headingLevel={4}
                      idPrefix={`slide-${slide.position}-${key}-`}
                    >
                      {log[key]}
                    </HighlightedMarkdown>
                  </div>
                )
            )}
          </div>
        </>
      )
    }

    case "retrospective": {
      const { retrospective } = slide
      const date = formatDate(retrospective.createdAt)

      return (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-body-s text-muted-foreground">
              {[date, retrospective.author].filter(Boolean).join(" · ")}
            </p>
            <h2 className="text-h1 break-words">
              회고 {slide.position} / {slide.total}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {RETROSPECTIVE_PARTS.map(
              ({ key, label, icon: Icon, tone }) =>
                retrospective[key] && (
                  <div
                    key={key}
                    className="flex flex-col gap-1.5 rounded-xl border bg-card p-5"
                  >
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
          </div>
        </>
      )
    }

    case "tasks":
      return (
        <>
          <SlideTitle
            caption={`${slide.total}개 가운데 ${slide.done}개를 끝냈습니다.`}
          >
            {slide.title}
          </SlideTitle>
          <ul className="flex flex-col gap-3 rounded-xl border bg-card p-5">
            {slide.items.map((task, index) => {
              const Icon = task.done ? CircleCheck : Circle

              return (
                <li
                  key={`${task.title}-${index}`}
                  className="flex items-start gap-3"
                >
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
        </>
      )

    case "projects":
      return (
        <>
          <SlideTitle caption="발표를 공개한 Project 입니다. 누르면 그 Project 의 발표로 갑니다.">
            {slide.title}
          </SlideTitle>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {slide.items.map((project) => (
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
        </>
      )

    case "sessions":
      return (
        <>
          <SlideTitle>{slide.title}</SlideTitle>
          <ol className="flex flex-col divide-y rounded-xl border bg-card px-5">
            {slide.items.map((session, index) => (
              <li
                key={`${session.startsAt}-${index}`}
                className="flex items-center gap-3 py-3"
              >
                <Calendar
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-icon-subtle"
                />
                <span className="min-w-0 flex-1 text-label-m break-words">
                  {session.title}
                </span>
                <span className="shrink-0 text-body-s text-muted-foreground">
                  {formatDate(session.startsAt)}
                </span>
              </li>
            ))}
          </ol>
        </>
      )

    case "names":
      return (
        <>
          <SlideTitle>{slide.title}</SlideTitle>
          <Names names={slide.names} unit={slide.unit} />
        </>
      )

    case "end":
      return (
        <div className="flex flex-col items-start gap-4">
          <p className="text-overline text-brand">끝</p>
          <h2 className="text-display-l break-words">{slide.title}</h2>
          <p className="text-body-l text-muted-foreground">
            여기까지입니다. 전체 내용은 이어 보는 화면에서 한 번에 볼 수
            있습니다.
          </p>
          <Link
            href={backHref}
            className="text-label-m text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            전체 내용 보기
          </Link>
        </div>
      )
  }
}
