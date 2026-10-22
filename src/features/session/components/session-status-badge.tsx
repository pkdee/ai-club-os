import { Badge } from "@/components/ui/badge"

import type { SessionStatus } from "../time"

const STATUS = {
  today: { label: "오늘", tone: "brand" },
  upcoming: { label: "예정", tone: "info" },
  done: { label: "종료", tone: "neutral" },
  // 날짜를 아직 정하지 않은 회차. 정해야 할 것이 남았다는 뜻으로 경고 색을 쓴다.
  undecided: { label: "미정", tone: "warning" },
} as const

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const { label, tone } = STATUS[status]

  return <Badge tone={tone}>{label}</Badge>
}
