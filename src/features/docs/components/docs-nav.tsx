"use client"

import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"

import { DOCS } from "@/content/docs/list"
import { cn } from "@/lib/utils"

// Docs 의 문서 목록. 넓은 화면에서는 왼쪽에 세로로 두고 따라 내려오게 한다.
// 좁은 화면에서는 본문 위에 가로로 두고 옆으로 넘겨 본다.
export function DocsNav({ clubId }: { clubId: string }) {
  // Docs 의 layout 아래에서 지금 열린 문서의 slug 다.
  const current = useSelectedLayoutSegment()

  if (DOCS.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Docs 목록"
      className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-8"
    >
      <p className="text-overline text-tertiary">Docs</p>
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {DOCS.map((doc) => {
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
