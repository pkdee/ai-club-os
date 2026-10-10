import { cn } from "@/lib/utils"

import { ATTENDANCE_MARKS, type AttendanceMark } from "../status"
import { AttendanceStatusBadge } from "./attendance-status-badge"

// 상태별 인원을 보여 준다. 기본은 한 줄로 늘어놓고, stacked 이면 좁은 칸에 맞게 한 줄에 하나씩 쌓는다.
export function AttendanceSummary({
  counts,
  stacked = false,
}: {
  counts: Record<AttendanceMark, number>
  stacked?: boolean
}) {
  return (
    <ul
      className={cn(
        "flex",
        stacked ? "flex-col gap-2" : "flex-wrap items-center gap-x-5 gap-y-2"
      )}
    >
      {ATTENDANCE_MARKS.map((mark) => (
        <li
          key={mark}
          className={cn(
            "flex items-center gap-2",
            stacked && "justify-between gap-4"
          )}
        >
          <AttendanceStatusBadge mark={mark} />
          <span className="text-label-m">{counts[mark]}명</span>
        </li>
      ))}
    </ul>
  )
}
