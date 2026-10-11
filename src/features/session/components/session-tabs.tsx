"use client"

import { usePathname } from "next/navigation"

import { LinkTabs } from "@/components/ui/link-tabs"

// Session 상세 안에서 보기를 바꾸는 탭. 한 회차의 맥락 안에서 출석과 기록을 함께 다룬다.
// logCount 가 null 이면 AI Log 수를 불러오지 못한 것이다.
// retroCount 는 이 회차의 회고 수다. undefined 면 회고를 아직 쓸 수 없는 것이라 탭을 그리지 않는다.
export function SessionTabs({
  baseHref,
  memberCount,
  logCount,
  retroCount,
}: {
  baseHref: string
  memberCount: number
  logCount: number | null
  retroCount?: number | null
}) {
  const pathname = usePathname()
  const tabs = [
    { href: baseHref, label: "개요", count: null },
    { href: `${baseHref}/attendance`, label: "Attendance", count: memberCount },
    { href: `${baseHref}/logs`, label: "AI Log", count: logCount },
    { href: `${baseHref}/insight`, label: "AI Insight", count: null },
    ...(retroCount === undefined
      ? []
      : [{ href: `${baseHref}/retros`, label: "회고", count: retroCount }]),
  ]

  return (
    <LinkTabs
      label="Session 보기"
      tabs={tabs.map((tab) => ({ ...tab, active: pathname === tab.href }))}
    />
  )
}
