"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

import type { DocHeading } from "../catalog"

// 문서의 목차. 누르면 그 제목으로 가고, 지금 읽고 있는 제목을 표시한다.
// 목록은 빌드할 때 만든 것이라 서버에서 함께 그리고, 표시만 브라우저에서 바꾼다.
export function DocToc({ headings }: { headings: DocHeading[] }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const targets = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((target) => target !== null)
    if (targets.length === 0) {
      return
    }

    // 화면 위쪽 3분의 1 에 들어온 제목을 지금 읽는 곳으로 본다. 위로 돌아갈 때도 같은 띠에서 바뀐다.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: "0px 0px -66% 0px" }
    )
    for (const target of targets) {
      observer.observe(target)
    }
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) {
    return null
  }

  return (
    <nav aria-label="이 문서의 목차" className="flex flex-col gap-3">
      <p className="text-overline text-tertiary">목차</p>
      <ul className="flex flex-col border-l">
        {headings.map((heading) => {
          const current = heading.id === active
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "-ml-px block rounded-r-sm border-l-2 py-1 text-body-s transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  heading.depth === 3 ? "pl-6" : "pl-3",
                  current
                    ? "border-primary text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
