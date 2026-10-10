import Link from "next/link"
import { CircleArrowRight } from "lucide-react"

// Session 개요에 놓는, 지난 회차의 AI Insight 에 정리된 다음 행동.
// 회차를 시작할 때 지난번에 하기로 한 것을 바로 볼 수 있게 한다. 보여 줄 것이 없으면 아무것도 그리지 않는다.
export function PreviousActionsCard({
  sessionTitle,
  href,
  actions,
}: {
  // 지난 회차의 제목과 그 회차의 AI Insight 로 가는 주소.
  sessionTitle: string
  href: string
  actions: string[]
}) {
  if (actions.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-h4">
          <CircleArrowRight
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-5 shrink-0 text-icon-brand"
          />
          지난 회차에서 하기로 한 것
        </h2>
        <p className="text-body-s text-muted-foreground">
          <Link
            href={href}
            className="rounded-sm underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {sessionTitle}
          </Link>
          의 AI Insight 에 정리된 다음 행동입니다.
        </p>
      </div>
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        {actions.map((action, index) => (
          <li key={index} className="whitespace-pre-wrap">
            {action}
          </li>
        ))}
      </ul>
    </section>
  )
}
