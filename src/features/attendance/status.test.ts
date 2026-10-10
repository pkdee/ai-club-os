import assert from "node:assert/strict"
import { test } from "node:test"

import { countAttendance, isAttendanceStatus } from "./status"

test("상태별 수를 세고 기록이 없는 Member 는 미기록으로 센다", () => {
  const counts = countAttendance(["m1", "m2", "m3", "m4", "m5"], {
    m1: "present",
    m2: "present",
    m3: "late",
    m4: "excused",
  })
  assert.deepEqual(counts, { present: 2, late: 1, absent: 0, excused: 1, unrecorded: 1 })
})

test("목록에 없는 Member 의 기록은 세지 않는다", () => {
  const counts = countAttendance(["m1"], { m1: "absent", gone: "present" })
  assert.deepEqual(counts, { present: 0, late: 0, absent: 1, excused: 0, unrecorded: 0 })
})

test("정해진 상태 값만 받는다", () => {
  assert.equal(isAttendanceStatus("present"), true)
  assert.equal(isAttendanceStatus("unrecorded"), false)
  assert.equal(isAttendanceStatus("sleeping"), false)
  assert.equal(isAttendanceStatus(null), false)
})
