"use client"

import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"

import { cn } from "@/lib/utils"

import type { DocEntry } from "../catalog"

// Docs 의 문서 목록. 넓은 화면에서는 왼쪽에 세로로 두고 따라 내려오게 한다.
// 좁은 화면에서는 본문 위에 가로로 두고 옆으로 넘겨 본다.
// docs 는 목록의 순서대로 놓인 문서의 slug 와 제목이다.
export function DocsNav({
  clubId,
  docs,
}: {
  clubId: string
  docs: Pick<DocEntry, "slug" | "title">[]
}) {
  // Docs 의 layout 아래에서 지금 열린 문서의 slug 다.
  const current = useSelectedLayoutSegment()

  if (docs.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Docs 목록"
      className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-8"
    >
      <p className="text-overline text-tertiary">Docs</p>
      {/* 좁은 화면에서 옆으로 밀어 본다. 밀 수 있다는 것은 잘린 문서 이름으로 알리고, 막대는 탭처럼 감춘다. */}
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {docs.map((doc) => {
          const active = doc.slug === current
          return (
            <li key={doc.slug} className="shrink-0">
              <Link
                href={`/clubs/${clubId}/docs/${doc.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center rounded-md px-3 text-label-m whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring lg:whitespace-normal",
                  active
                    ? "bg-primary-subtle text-brand"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {doc.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
