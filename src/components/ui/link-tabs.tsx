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
// 탭이 화면보다 넓으면 옆으로 밀어 본다. 아래 선은 안쪽 묶음에 그어서 밀어도 끊기지 않는다.
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
      // 밀 수 있다는 것은 잘린 탭 이름으로 알린다. 막대는 탭 아래 선과 겹쳐 보여서 감춘다.
      className={cn(
        "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <div className="flex min-w-max gap-6 border-b">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "-mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-1 text-label-m whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
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
      </div>
    </nav>
  )
}

export { LinkTabs, type LinkTab }
