"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  // true 면 주소가 정확히 같을 때만 선택된 것으로 본다.
  exact?: boolean
  // true 면 왼쪽 메뉴에서 맨 아래로 내려 보낸다.
  bottom?: boolean
}

// 기능을 만들 때마다 메뉴를 더한다.
// Attendance 는 Session 안에서 다루므로 메뉴에 따로 두지 않는다. 설정은 운영자에게만 보인다.
function navItems(clubId: string, canManage: boolean): NavItem[] {
  const base = `/clubs/${clubId}`
  const items: NavItem[] = [
    { href: base, label: "개요", icon: LayoutDashboard, exact: true },
    { href: `${base}/sessions`, label: "Session", icon: Calendar },
    { href: `${base}/logs`, label: "AI Log", icon: FileText },
    { href: `${base}/members`, label: "Member", icon: Users },
  ]

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
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

// sidebar 는 넓은 화면의 왼쪽 메뉴, tabbar 는 좁은 화면의 아래쪽 메뉴다.
export function ClubNav({
  clubId,
  canManage,
  variant = "sidebar",
  className,
}: {
  clubId: string
  canManage: boolean
  variant?: "sidebar" | "tabbar"
  className?: string
}) {
  const pathname = usePathname()
  const tabbar = variant === "tabbar"

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
      {navItems(clubId, canManage).map((item) => {
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
                ? "flex flex-1 flex-col items-center justify-center gap-1 text-label-s"
                : cn(
                    "flex h-9 items-center gap-3 rounded-md px-3 text-label-m",
                    item.bottom && "mt-auto"
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
          </Link>
        )
      })}
    </nav>
  )
}
