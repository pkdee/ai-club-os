import Link from "next/link"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Hash } from "lucide-react"
import type { MDXContent } from "mdx/types"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { formatDocDate, type DocEntry } from "../catalog"
import type { MarkdownPart } from "../markdown"
import { CopyMarkdownButton } from "./copy-markdown-button"

const PAGER_LINK_CLASS =
  "flex flex-col gap-1 rounded-lg border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"

// Docs 의 문서 한 편. 제목, 소개, 날짜, 태그는 문서의 frontmatter 에서, 본문은 빌드한 MDX 에서 가져온다.
// 머리말에 제목과 마크다운으로 복사하는 버튼, 소개, 게시한 날과 읽는 시간, 태그를 두고,
// 읽기 편한 폭으로 줄인 본문 아래에 이전 문서와 다음 문서로 가는 길을 둔다.
export function DocArticle({
  clubId,
  entry,
  minutes,
  Content,
  markdown,
  prev,
  next,
}: {
  clubId: string
  entry: DocEntry
  minutes: number
  Content: MDXContent
  markdown: MarkdownPart[]
  prev: DocEntry | null
  next: DocEntry | null
}) {
  const href = (doc: DocEntry) => `/clubs/${clubId}/docs/${doc.slug}`

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-12">
      <article className="flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-4 border-b pb-8">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <h1 className="min-w-0 text-h1 break-keep sm:text-display-l">
              {entry.title}
            </h1>
            <CopyMarkdownButton entry={entry} parts={markdown} />
          </div>
          {entry.description && (
            <p className="text-body-l text-muted-foreground">
              {entry.description}
            </p>
          )}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-s text-muted-foreground">
            {/* 날짜는 frontmatter 에 published 를 적은 문서에만 보인다. */}
            {entry.published && (
              <span className="flex items-center gap-1.5">
                <CalendarDays
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 text-icon-subtle"
                />
                <span>
                  <time dateTime={entry.published}>
                    {formatDocDate(entry.published)}
                  </time>{" "}
                  게시
                  {entry.updated && (
                    <>
                      {" · "}
                      <time dateTime={entry.updated}>
                        {formatDocDate(entry.updated)}
                      </time>{" "}
                      수정
                    </>
                  )}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-4 text-icon-subtle"
              />
              읽는 데 약 {minutes}분
            </span>
          </p>
          {entry.tags.length > 0 && (
            <ul aria-label="태그" className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <li key={tag}>
                  <Badge tone="neutral" className="h-6 px-2.5">
                    <Hash aria-hidden="true" strokeWidth={1.5} />
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </header>
        {/* doc-body 는 globals.css 가 본문에 직접 쓴 <details> 의 모양을 입힐 때 쓰는 이름이다. */}
        <div className="doc-body min-w-0">
          <Content />
        </div>
      </article>
      {(prev || next) && (
        <nav
          aria-label="이전 문서와 다음 문서"
          className="grid grid-cols-1 gap-3 border-t pt-6 sm:grid-cols-2"
        >
          {prev && (
            <Link href={href(prev)} className={PAGER_LINK_CLASS}>
              <span className="flex items-center gap-1 text-caption text-muted-foreground">
                <ChevronLeft
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 text-icon"
                />
                이전 문서
              </span>
              <span className="text-label-m">{prev.title}</span>
            </Link>
          )}
          {next && (
            <Link
              href={href(next)}
              className={cn(
                PAGER_LINK_CLASS,
                "items-end text-right sm:col-start-2"
              )}
            >
              <span className="flex items-center gap-1 text-caption text-muted-foreground">
                다음 문서
                <ChevronRight
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 text-icon"
                />
              </span>
              <span className="text-label-m">{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
