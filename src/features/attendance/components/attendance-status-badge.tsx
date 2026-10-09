import {
  CircleCheck,
  CircleDashed,
  CircleMinus,
  CircleX,
  Clock,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { ATTENDANCE_LABEL, type AttendanceMark } from "../status"

export const ATTENDANCE_ICON: Record<AttendanceMark, LucideIcon> = {
  present: CircleCheck,
  late: Clock,
  absent: CircleX,
  excused: CircleMinus,
  unrecorded: CircleDashed,
}

const TONE = {
  present: "success",
  late: "warning",
  absent: "danger",
  excused: "info",
  unrecorded: "neutral",
} as const

// 색, 아이콘, 글자를 함께 써서 색만으로 상태를 전하지 않는다.
export function AttendanceStatusBadge({ mark }: { mark: AttendanceMark }) {
  const Icon = ATTENDANCE_ICON[mark]

  return (
    <Badge tone={TONE[mark]}>
      <Icon aria-hidden="true" strokeWidth={1.5} />
      {ATTENDANCE_LABEL[mark]}
    </Badge>
  )
}
