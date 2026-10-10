import assert from "node:assert/strict"
import { test } from "node:test"

import {
  formatKstDate,
  formatKstTimeRange,
  kstDateKey,
  kstMonthDay,
  kstTime,
  kstToIso,
  sessionStatus,
} from "./time"

// 이 시험은 서버 시간대를 한국이 아닌 곳으로 두고 돌린다. 결과가 서버 시간대에 기대지 않는지 보려는 것이다.

test("저장된 시각을 한국 시간의 날짜와 시각으로 읽는다", () => {
  // 한국 시간 2026-10-08 19:00
  const value = "2026-10-08T10:00:00.000Z"
  assert.equal(kstDateKey(value), "2026-10-08")
  assert.equal(kstTime(value), "19:00")
  assert.deepEqual(kstMonthDay(value), { month: "10월", day: "8" })
  assert.equal(formatKstDate(value), "10월 8일 목요일")
  assert.equal(formatKstTimeRange(value, "2026-10-08T12:00:00.000Z"), "19:00 ~ 21:00")
})

test("자정 앞뒤에서 한국 시간의 날짜로 넘어간다", () => {
  assert.equal(kstDateKey("2026-10-08T14:59:00.000Z"), "2026-10-08")
  assert.equal(kstDateKey("2026-10-08T15:00:00.000Z"), "2026-10-09")
  assert.equal(kstTime("2026-10-08T15:00:00.000Z"), "00:00")
})

test("한국 시간의 날짜와 시각을 저장용 시각으로 바꾼다", () => {
  assert.equal(kstToIso("2026-10-08", "19:00"), "2026-10-08T10:00:00.000Z")
  assert.equal(kstToIso("2026-10-08", "00:00"), "2026-10-07T15:00:00.000Z")
})

test("형식이 틀리거나 달력에 없는 날짜는 받지 않는다", () => {
  assert.equal(kstToIso("2026-02-31", "10:00"), null)
  assert.equal(kstToIso("2026-13-01", "10:00"), null)
  assert.equal(kstToIso("2026-10-08", "25:00"), null)
  assert.equal(kstToIso("2026-10-8", "10:00"), null)
  assert.equal(kstToIso("", ""), null)
})

test("오늘, 예정, 종료를 한국 시간의 날짜로 나눈다", () => {
  // 한국 시간 2026-10-08 00:30. UTC 로는 아직 10월 7일이다.
  const now = new Date("2026-10-07T15:30:00.000Z")
  assert.equal(sessionStatus("2026-10-08T10:00:00.000Z", now), "today")
  assert.equal(sessionStatus("2026-10-07T10:00:00.000Z", now), "done")
  assert.equal(sessionStatus("2026-10-09T01:00:00.000Z", now), "upcoming")
})
