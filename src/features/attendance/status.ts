// 상태 값은 데이터베이스의 attendance.status 와 같아야 한다. 종류는 잠정 결정이다.
export const ATTENDANCE_STATUSES = [
  "present",
  "late",
  "absent",
  "excused",
] as const

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

// 기록이 없는 상태까지 포함한 표시용 값.
export type AttendanceMark = AttendanceStatus | "unrecorded"

export const ATTENDANCE_MARKS: AttendanceMark[] = [
  ...ATTENDANCE_STATUSES,
  "unrecorded",
]

export const ATTENDANCE_LABEL: Record<AttendanceMark, string> = {
  present: "출석",
  late: "지각",
  absent: "결석",
  excused: "공결",
  unrecorded: "미기록",
}

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return ATTENDANCE_STATUSES.includes(value as AttendanceStatus)
}

// Member 별 기록에서 상태별 수를 센다. 기록이 없는 Member 는 미기록이다.
export function countAttendance(
  memberIds: string[],
  records: Record<string, AttendanceStatus | undefined>
): Record<AttendanceMark, number> {
  const counts: Record<AttendanceMark, number> = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    unrecorded: 0,
  }
  for (const memberId of memberIds) {
    counts[records[memberId] ?? "unrecorded"] += 1
  }
  return counts
}
