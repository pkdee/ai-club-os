import Link from "next/link"

import { cn } from "@/lib/utils"

type LinkTab = {
  href: string
  label: string
  // 숫자가 있으면 이름 옆에 작게 보여 준다.
  count?: number | null
  active: boolean
}

// Figma 의 Tabs 를 옮긴 것이다. 주소를 바꿔 보기를 전환한다.
function LinkTabs({
  label,
  tabs,
  className,
}: {
  label: string
  tabs: LinkTab[]
  className?: string
}) {
  return (
    <nav
      data-slot="link-tabs"
      aria-label={label}
      className={cn("flex gap-6 border-b", className)}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "-mb-px flex h-10 items-center gap-1.5 border-b-2 px-1 text-label-m transition-colors focus-visible:outline-2 focus-visible:outline-ring",
            tab.active
              ? "border-ring text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
          {typeof tab.count === "number" && (
            <span className="flex h-5 items-center rounded-full bg-muted px-1.5 text-label-s text-muted-foreground">
              {tab.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  )
}

export { LinkTabs, type LinkTab }
