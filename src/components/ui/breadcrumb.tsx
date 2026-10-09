import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type BreadcrumbItem = {
  label: string
  // 없으면 현재 위치로 본다.
  href?: string
}

// Figma 의 Breadcrumb 을 옮긴 것이다. 현재 위치와 상위 화면으로 돌아가는 길을 보여 준다.
function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  return (
    <nav aria-label="현재 위치" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-body-s">
        {items.map((item, index) => (
          <li key={item.label} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && (
              <ChevronRight
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-3.5 shrink-0 text-icon-subtle"
              />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "truncate rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export { Breadcrumb }
