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

// 출석률을 낼 때 쓰는 수. attended 는 출석과 지각, counted 는 거기에 결석을 더한 것이다.
// 공결은 사유가 인정된 것이라 계산에서 빼고, 미기록은 아직 알 수 없어서 뺀다.
export type AttendanceTally = { attended: number; counted: number }

export function tallyAttendance(statuses: AttendanceStatus[]): AttendanceTally {
  const tally = { attended: 0, counted: 0 }
  for (const status of statuses) {
    if (status === "excused") {
      continue
    }
    tally.counted += 1
    if (status !== "absent") {
      tally.attended += 1
    }
  }
  return tally
}

// 여러 Session 의 기록을 모아 평균 출석률을 낸다. 셀 기록이 있는 Session 만 회차 수에 넣는다.
// 셀 기록이 하나도 없으면 null 이다.
export function averageAttendance(
  rows: { sessionId: string; status: AttendanceStatus }[]
): { percent: number; sessionCount: number } | null {
  const { attended, counted } = tallyAttendance(rows.map((row) => row.status))
  if (counted === 0) {
    return null
  }

  const sessions = new Set(
    rows.filter((row) => row.status !== "excused").map((row) => row.sessionId)
  )
  return {
    percent: Math.round((attended / counted) * 100),
    sessionCount: sessions.size,
  }
}
