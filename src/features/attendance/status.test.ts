import assert from "node:assert/strict"
import { test } from "node:test"

import {
  averageAttendance,
  countAttendance,
  isAttendanceStatus,
  tallyAttendance,
} from "./status"

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

test("출석과 지각은 나온 것으로, 공결은 계산에서 뺀다", () => {
  assert.deepEqual(tallyAttendance(["present", "late", "absent", "excused"]), {
    attended: 2,
    counted: 3,
  })
  assert.deepEqual(tallyAttendance([]), { attended: 0, counted: 0 })
  assert.deepEqual(tallyAttendance(["excused", "excused"]), { attended: 0, counted: 0 })
})

test("평균 출석은 여러 Session 의 기록을 모아 내고 회차 수를 함께 돌려준다", () => {
  const average = averageAttendance([
    { sessionId: "s1", status: "present" },
    { sessionId: "s1", status: "absent" },
    { sessionId: "s2", status: "late" },
    { sessionId: "s2", status: "present" },
    { sessionId: "s2", status: "excused" },
    { sessionId: "s2", status: "present" },
    { sessionId: "s2", status: "present" },
  ])
  // 6건 가운데 5건이 나왔다. 83.33 은 83 으로 보여 준다.
  assert.deepEqual(average, { percent: 83, sessionCount: 2 })
})

test("셀 기록이 없으면 평균을 내지 않는다", () => {
  assert.equal(averageAttendance([]), null)
  assert.equal(averageAttendance([{ sessionId: "s1", status: "excused" }]), null)
})

test("공결만 있는 Session 은 회차 수에 넣지 않는다", () => {
  const average = averageAttendance([
    { sessionId: "s1", status: "present" },
    { sessionId: "s2", status: "excused" },
  ])
  assert.deepEqual(average, { percent: 100, sessionCount: 1 })
})
