import assert from "node:assert/strict"
import { test } from "node:test"

import { validateSession, type SessionInput } from "./rules"

const base: SessionInput = {
  title: "3회차",
  date: "2026-10-08",
  startTime: "19:00",
  endTime: "21:00",
  location: "",
  description: "",
}

function errorKeys(input: SessionInput) {
  const result = validateSession(input)
  return result.ok ? [] : Object.keys(result.errors)
}

test("맞는 입력은 한국 시간을 저장용 시각으로 바꿔 돌려준다", () => {
  assert.deepEqual(validateSession(base), {
    ok: true,
    startsAt: "2026-10-08T10:00:00.000Z",
    endsAt: "2026-10-08T12:00:00.000Z",
  })
})

test("제목은 1자 이상 80자 이하다", () => {
  assert.deepEqual(errorKeys({ ...base, title: "" }), ["title"])
  assert.deepEqual(errorKeys({ ...base, title: "가".repeat(80) }), [])
  assert.deepEqual(errorKeys({ ...base, title: "가".repeat(81) }), ["title"])
})

test("날짜와 시각의 형식을 확인한다", () => {
  assert.deepEqual(errorKeys({ ...base, date: "" }), ["date"])
  assert.deepEqual(errorKeys({ ...base, date: "2026-02-31" }), ["date"])
  assert.deepEqual(errorKeys({ ...base, startTime: "" }), ["startTime"])
  assert.deepEqual(errorKeys({ ...base, endTime: "" }), ["endTime"])
})

test("종료 시각은 시작 시각보다 뒤여야 한다", () => {
  assert.deepEqual(errorKeys({ ...base, endTime: "19:00" }), ["endTime"])
  assert.deepEqual(errorKeys({ ...base, endTime: "18:59" }), ["endTime"])
  assert.deepEqual(errorKeys({ ...base, endTime: "19:01" }), [])
})

test("장소와 소개의 길이를 확인한다", () => {
  assert.deepEqual(errorKeys({ ...base, location: "가".repeat(81) }), ["location"])
  assert.deepEqual(errorKeys({ ...base, description: "가".repeat(2000) }), [])
  assert.deepEqual(errorKeys({ ...base, description: "가".repeat(2001) }), ["description"])
})
