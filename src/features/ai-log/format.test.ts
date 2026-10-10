import assert from "node:assert/strict"
import { test } from "node:test"

import { authorName, formatLogDate, formatLogDateTime } from "./format"

const now = new Date("2026-10-08T03:00:00.000Z")

test("올해의 기록은 월과 일만 보여 준다", () => {
  assert.equal(formatLogDate("2026-10-08T11:52:00.000Z", now), "10월 8일")
  assert.equal(formatLogDateTime("2026-10-08T11:52:00.000Z", now), "10월 8일 20:52")
})

test("올해가 아닌 기록에는 연도를 붙인다", () => {
  assert.equal(formatLogDate("2025-12-01T11:00:00.000Z", now), "2025년 12월 1일")
})

test("연도는 한국 시간으로 가른다", () => {
  // 한국 시간으로는 이미 2027년 1월 1일이다.
  assert.equal(formatLogDate("2026-12-31T15:30:00.000Z", now), "2027년 1월 1일")
})

test("작성자가 없는 기록은 탈퇴한 Member 로 보여 준다", () => {
  assert.equal(authorName({ userId: "u", name: "김하늘", avatarUrl: null }), "김하늘")
  assert.equal(authorName(null), "탈퇴한 Member")
})
