"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  BookOpen,
  Calendar,
  FileText,
  FolderKanban,
  LayoutDashboard,
  RotateCcw,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react"

import { docsHref } from "@/features/docs/catalog"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  // true 면 주소가 정확히 같을 때만 선택된 것으로 본다.
  exact?: boolean
  // 선택된 것으로 볼 주소의 앞부분. 없으면 href 다. href 가 묶음 안의 한 화면을 가리킬 때 쓴다.
  match?: string
  // true 면 왼쪽 메뉴에서 맨 아래로 내려 보낸다.
  bottom?: boolean
  // true 면 왼쪽 메뉴에만 둔다. 좁은 화면의 아래쪽 메뉴에는 자리가 모자라다.
  sidebarOnly?: boolean
  // 이름 옆에 보여 줄 수. 0 이면 보여 주지 않는다.
  count?: number
}

// 기능을 만들 때마다 메뉴를 더한다.
// Attendance 는 Session 안에서 다루므로 메뉴에 따로 두지 않는다. 설정은 운영자에게만 보인다.
// 좁은 화면의 아래쪽 메뉴에는 설정을 넣지 않는다. 자리가 모자라서 위쪽 막대의 버튼으로 옮겼다.
// 회고도 아래쪽 메뉴에 넣지 않는다. 좁은 화면에서는 개요의 내 기록과 Project, Session 화면에서 간다.
// Docs 도 아래쪽 메뉴에 넣지 않는다. 좁은 화면에서는 개요의 Docs 카드에서 간다.
// notificationCount 가 null 이면 알림을 아직 쓸 수 없는 것이라 메뉴에 넣지 않는다.
function navItems(
  clubId: string,
  canManage: boolean,
  notificationCount: number | null
): NavItem[] {
  const base = `/clubs/${clubId}`
  const items: NavItem[] = [
    { href: base, label: "개요", icon: LayoutDashboard, exact: true },
    { href: `${base}/sessions`, label: "Session", icon: Calendar },
    { href: `${base}/logs`, label: "AI Log", icon: FileText },
    { href: `${base}/insights`, label: "AI Insight", icon: Sparkles },
    { href: `${base}/projects`, label: "Project", icon: FolderKanban },
    {
      href: `${base}/retros`,
      label: "회고",
      icon: RotateCcw,
      sidebarOnly: true,
    },
    { href: `${base}/members`, label: "Member", icon: Users },
    {
      href: docsHref(clubId),
      match: `${base}/docs`,
      label: "Docs",
      icon: BookOpen,
      sidebarOnly: true,
    },
  ]

  if (notificationCount !== null) {
    items.push({
      href: `${base}/notifications`,
      label: "알림",
      icon: Bell,
      bottom: true,
      count: notificationCount,
    })
  }
  if (canManage) {
    items.push({
      href: `${base}/settings`,
      label: "설정",
      icon: Settings,
      bottom: true,
    })
  }
  return items
}

function isActive(pathname: string, item: NavItem) {
  const match = item.match ?? item.href
  return item.exact
    ? pathname === match
    : pathname === match || pathname.startsWith(`${match}/`)
}

// sidebar 는 넓은 화면의 왼쪽 메뉴, tabbar 는 좁은 화면의 아래쪽 메뉴다.
export function ClubNav({
  clubId,
  canManage,
  notificationCount = null,
  variant = "sidebar",
  className,
}: {
  clubId: string
  canManage: boolean
  notificationCount?: number | null
  variant?: "sidebar" | "tabbar"
  className?: string
}) {
  const pathname = usePathname()
  const tabbar = variant === "tabbar"
  const items = navItems(clubId, canManage, notificationCount).filter(
    (item) => !(tabbar && (item.bottom || item.sidebarOnly))
  )
  // 아래로 내려 보내는 것들 가운데 첫째만 위를 벌린다. 나머지는 그 밑에 붙는다.
  const firstBottom = items.find((item) => item.bottom)

  return (
    <nav
      aria-label="Club 메뉴"
      className={cn(
        tabbar
          ? "flex h-16 shrink-0 items-stretch border-t bg-card"
          : "flex flex-col gap-0.5",
        className
      )}
    >
      {items.map((item) => {
        const active = isActive(pathname, item)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
              tabbar
                ? // 칸 너비를 글자 길이에 맞춘다. 똑같이 나누면 좁은 화면에서 긴 이름이 두 줄이 된다.
                  "flex flex-auto flex-col items-center justify-center gap-1 px-1 text-label-s whitespace-nowrap"
                : cn(
                    "flex h-9 items-center gap-3 rounded-md px-3 text-label-m",
                    item === firstBottom && "mt-auto"
                  ),
              active
                ? cn("text-brand", !tabbar && "bg-primary-subtle")
                : cn(
                    "text-muted-foreground",
                    !tabbar && "hover:bg-accent hover:text-foreground"
                  )
            )}
          >
            <Icon
              aria-hidden="true"
              strokeWidth={1.5}
              className={cn("size-5", active ? "text-icon-brand" : "text-icon")}
            />
            {item.label}
            {item.count ? (
              <span className="ml-auto rounded-full bg-primary px-1.5 text-label-s text-primary-foreground">
                {item.count > 99 ? "99+" : item.count}
                <span className="sr-only">건</span>
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
