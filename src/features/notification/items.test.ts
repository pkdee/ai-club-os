import assert from "node:assert/strict"
import { test } from "node:test"

import {
  buildNotifications,
  countNotifications,
  taskDue,
  type NotificationSource,
} from "./items"

const today = "2026-10-11"
const request: NotificationSource = {
  kind: "join-request",
  id: "r1",
  at: "2026-10-10T03:00:00Z",
  projectId: "p1",
  projectName: "RAG 챗봇",
  requesterName: "정예린",
}
const task = (id: string, at: string | null, dueOn: string | null): NotificationSource => ({
  kind: "task",
  id,
  at,
  projectId: "p1",
  projectName: "RAG 챗봇",
  title: "평가 질문 만들기",
  dueOn,
})
const accepted: NotificationSource = {
  kind: "accepted",
  id: "a1",
  at: "2026-10-09T03:00:00Z",
  projectId: "p2",
  projectName: "요약 봇",
}
const insight: NotificationSource = {
  kind: "insight",
  id: "i1",
  at: "2026-10-08T03:00:00Z",
  title: "3회차",
  sessionId: "s1",
  month: null,
}

test("기한이 지난 것과 오늘, 내일까지인 것을 가린다", () => {
  assert.equal(taskDue("2026-10-10", today), "overdue")
  assert.equal(taskDue("2026-10-11", today), "soon")
  assert.equal(taskDue("2026-10-12", today), "soon")
  assert.equal(taskDue("2026-10-13", today), null)
  assert.equal(taskDue(null, today), null)
})

test("달이 바뀌는 날에도 내일을 바르게 센다", () => {
  assert.equal(taskDue("2026-11-01", "2026-10-31"), "soon")
  assert.equal(taskDue("2027-01-01", "2026-12-31"), "soon")
})

test("확인한 뒤에 생긴 것만 새것이다", () => {
  const items = buildNotifications([accepted, insight], "2026-10-08T12:00:00Z", today)
  assert.deepEqual(items.map((item) => [item.kind, item.isNew]), [
    ["accepted", true],
    ["insight", false],
  ])
})

test("확인한 적이 없으면 모두 새것이다", () => {
  const items = buildNotifications([accepted, insight], null, today)
  assert.deepEqual(items.map((item) => item.isNew), [true, true])
})

test("맡은 시각을 모르는 할 일은 새것으로 세지 않는다", () => {
  const [item] = buildNotifications([task("t1", null, null)], null, today)
  assert.equal(item.isNew, false)
  assert.equal(item.needsAttention, false)
})

test("들어온 참여 요청과 기한이 닥친 할 일은 확인한 뒤에도 챙길 것으로 남는다", () => {
  const items = buildNotifications(
    [request, task("t1", "2026-10-01T00:00:00Z", "2026-10-10"), task("t2", "2026-10-01T00:00:00Z", "2026-10-30")],
    "2026-10-11T00:00:00Z",
    today
  )
  assert.deepEqual(
    items.map((item) => [item.id, item.isNew, item.needsAttention, item.due]),
    [
      ["r1", false, true, null],
      ["t1", false, true, "overdue"],
      ["t2", false, false, null],
    ]
  )
  assert.equal(countNotifications(items), 2)
})

test("챙길 것이 앞에 오고 그 안에서는 최근 것이 앞에 온다", () => {
  const items = buildNotifications(
    [insight, accepted, task("t1", "2026-10-11T01:00:00Z", "2026-10-11"), request],
    null,
    today
  )
  assert.deepEqual(items.map((item) => item.id), ["t1", "r1", "a1", "i1"])
})

test("새것이면서 챙길 것이어도 한 번만 센다", () => {
  const items = buildNotifications([request], null, today)
  assert.equal(items[0].isNew && items[0].needsAttention, true)
  assert.equal(countNotifications(items), 1)
})
