import { Badge } from "@/components/ui/badge"

import { PROJECT_STATUS_LABEL, type ProjectStatus } from "../rules"

const TONE = {
  planning: "neutral",
  active: "brand",
  done: "success",
} as const

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={TONE[status]}>{PROJECT_STATUS_LABEL[status]}</Badge>
}
