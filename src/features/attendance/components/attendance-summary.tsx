import { ATTENDANCE_MARKS, type AttendanceMark } from "../status"
import { AttendanceStatusBadge } from "./attendance-status-badge"

// 상태별 인원을 한 줄로 보여 준다.
export function AttendanceSummary({
  counts,
}: {
  counts: Record<AttendanceMark, number>
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {ATTENDANCE_MARKS.map((mark) => (
        <li key={mark} className="flex items-center gap-2">
          <AttendanceStatusBadge mark={mark} />
          <span className="text-label-m">{counts[mark]}명</span>
        </li>
      ))}
    </ul>
  )
}
