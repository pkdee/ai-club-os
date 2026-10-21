import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { MDXContent } from "mdx/types"

import { cn } from "@/lib/utils"

import type { DocEntry } from "../catalog"

const PAGER_LINK_CLASS =
  "flex flex-col gap-1 rounded-lg border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"

// Docs 의 문서 한 편. 제목과 소개는 목록에서, 본문은 빌드한 MDX 에서 가져온다.
// 읽기 편한 폭으로 줄이고, 아래에 이전 문서와 다음 문서로 가는 길을 둔다.
export function DocArticle({
  clubId,
  entry,
  Content,
  prev,
  next,
}: {
  clubId: string
  entry: DocEntry
  Content: MDXContent
  prev: DocEntry | null
  next: DocEntry | null
}) {
  const href = (doc: DocEntry) => `/clubs/${clubId}/docs/${doc.slug}`

  return (
    <div className="flex w-full max-w-3xl min-w-0 flex-col gap-12">
      <article className="flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-2 border-b pb-6">
          <h1 className="text-h1">{entry.title}</h1>
          <p className="text-body-l text-muted-foreground">
            {entry.description}
          </p>
        </header>
        <div className="min-w-0">
          <Content />
        </div>
      </article>
      {(prev || next) && (
        <nav
          aria-label="이전 문서와 다음 문서"
          className="grid gap-3 border-t pt-6 sm:grid-cols-2"
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
