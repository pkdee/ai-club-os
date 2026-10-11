import assert from "node:assert/strict"
import { test } from "node:test"

import {
  mergeProjectLinks,
  mergeSessionLinks,
  projectsOfLogs,
  sessionsOfLogs,
} from "./links"

const s1 = { id: "s1", title: "1회차" }
const s2 = { id: "s2", title: "2회차" }
const p1 = { id: "p1", name: "RAG 챗봇" }
const p2 = { id: "p2", name: "요약 봇" }

test("기록이 나온 Session 을 기록 수와 함께 모은다", () => {
  assert.deepEqual(
    sessionsOfLogs([{ session: s1 }, { session: s2 }, { session: s2 }, { session: null }]),
    [
      { ...s2, logCount: 2 },
      { ...s1, logCount: 1 },
    ]
  )
})

test("Session 없이 남긴 기록뿐이면 빈 목록이다", () => {
  assert.deepEqual(sessionsOfLogs([{ session: null }]), [])
  assert.deepEqual(sessionsOfLogs([]), [])
})

test("기록 수가 같으면 먼저 나온 Session 이 앞에 온다", () => {
  assert.deepEqual(
    sessionsOfLogs([{ session: s2 }, { session: s1 }]).map((item) => item.id),
    ["s2", "s1"]
  )
})

test("기록이 묶인 Project 를 기록 수와 함께 모은다", () => {
  assert.deepEqual(
    projectsOfLogs([{ project: p1 }, { project: null }, { project: p2 }, { project: p1 }]),
    [
      { ...p1, logCount: 2 },
      { ...p2, logCount: 1 },
    ]
  )
})

test("받은 값을 고치지 않는다", () => {
  const session = { ...s1 }
  sessionsOfLogs([{ session }, { session }])
  assert.deepEqual(session, s1)
})

test("직접 이은 것이 앞에 오고 기록 수는 그대로 붙는다", () => {
  assert.deepEqual(
    mergeProjectLinks([p2], [
      { ...p1, logCount: 3 },
      { ...p2, logCount: 1 },
    ]),
    [
      { ...p2, logCount: 1, direct: true },
      { ...p1, logCount: 3, direct: false },
    ]
  )
})

test("직접 이었지만 기록이 없는 것은 기록 수가 0 이다", () => {
  assert.deepEqual(mergeSessionLinks([s1], []), [{ ...s1, logCount: 0, direct: true }])
  assert.deepEqual(mergeSessionLinks([], [{ ...s2, logCount: 2 }]), [{ ...s2, logCount: 2, direct: false }])
  assert.deepEqual(mergeProjectLinks([], []), [])
})
