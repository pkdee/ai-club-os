"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

// Session 상세 안에서 보기를 바꾸는 탭. 한 회차의 맥락 안에서 출석과 기록을 함께 다룬다.
export function SessionTabs({
  baseHref,
  memberCount,
}: {
  baseHref: string
  memberCount: number
}) {
  const pathname = usePathname()
  const tabs = [
    { href: baseHref, label: "개요", count: null },
    { href: `${baseHref}/attendance`, label: "Attendance", count: memberCount },
  ]

  return (
    <nav aria-label="Session 보기" className="flex gap-6 border-b">
      {tabs.map((tab) => {
        const active = pathname === tab.href

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex h-10 items-center gap-1.5 border-b-2 px-1 text-label-m transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              active
                ? "border-ring text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="flex h-5 items-center rounded-full bg-muted px-1.5 text-label-s text-muted-foreground">
                {tab.count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
