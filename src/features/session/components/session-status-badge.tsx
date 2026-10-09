import { Badge } from "@/components/ui/badge"

import type { SessionStatus } from "../time"

const STATUS = {
  today: { label: "오늘", tone: "brand" },
  upcoming: { label: "예정", tone: "info" },
  done: { label: "종료", tone: "neutral" },
} as const

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const { label, tone } = STATUS[status]

  return <Badge tone={tone}>{label}</Badge>
}
