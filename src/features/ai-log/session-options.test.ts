import assert from "node:assert/strict"
import { test } from "node:test"

import { defaultSessionId, toSessionOptions } from "./session-options"

// 한국 시간 2026-10-08 12:00
const now = new Date("2026-10-08T03:00:00.000Z")
const sessions = [
  { id: "11111111-1111-4111-8111-111111111111", clubId: "c", title: "1회차", description: "", location: "", startsAt: "2026-10-01T10:00:00.000Z", endsAt: "2026-10-01T12:00:00.000Z", agenda: null },
  { id: "22222222-2222-4222-8222-222222222222", clubId: "c", title: "2회차", description: "소개", location: "", startsAt: "2026-10-08T10:00:00.000Z", endsAt: "2026-10-08T12:00:00.000Z", agenda: null },
]

test("주소로 받은 회차가 이 Club 의 것이면 그것을 고른다", () => {
  assert.equal(defaultSessionId(sessions, sessions[0].id, now), sessions[0].id)
})

test("주소의 회차가 없거나 형식이 틀리면 오늘 열리는 회차를 고른다", () => {
  assert.equal(defaultSessionId(sessions, "33333333-3333-4333-8333-333333333333", now), sessions[1].id)
  assert.equal(defaultSessionId(sessions, "x", now), sessions[1].id)
  assert.equal(defaultSessionId(sessions, undefined, now), sessions[1].id)
})

test("오늘 열리는 회차가 없으면 고르지 않는다", () => {
  assert.equal(defaultSessionId(sessions.slice(0, 1), undefined, now), "")
})

test("고르기 목록은 최근 회차가 위에 온다", () => {
  assert.deepEqual(
    toSessionOptions(sessions).map((option) => `${option.title}|${option.when}`),
    ["2회차|10월 8일 목요일 19:00 ~ 21:00", "1회차|10월 1일 목요일 19:00 ~ 21:00"]
  )
})
