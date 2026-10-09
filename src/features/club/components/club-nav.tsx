"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

// 기능을 만들 때마다 메뉴를 더한다.
// Attendance 는 Session 안에서 다루므로 메뉴에 따로 두지 않는다.
function navItems(clubId: string): NavItem[] {
  return [{ href: `/clubs/${clubId}`, label: "개요", icon: LayoutDashboard }]
}

export function ClubNav({
  clubId,
  className,
}: {
  clubId: string
  className?: string
}) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Club 메뉴"
      className={cn("flex flex-col gap-0.5", className)}
    >
      {navItems(clubId).map(({ href, label, icon: Icon }) => {
        const active = pathname === href

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-md px-3 text-label-m transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              active
                ? "bg-primary-subtle text-brand"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon
              aria-hidden="true"
              strokeWidth={1.5}
              className={cn("size-5", active ? "text-icon-brand" : "text-icon")}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
