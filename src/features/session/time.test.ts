import assert from "node:assert/strict"
import { test } from "node:test"

import {
  formatKstDate,
  formatKstTimeRange,
  kstDateKey,
  kstMonthDay,
  kstMonthStart,
  kstTime,
  kstToIso,
  kstWeekday,
  kstWeekStart,
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
  // 날짜를 정하지 않은 회차는 오늘도 예정도 종료도 아니다.
  assert.equal(sessionStatus(null, now), "undecided")
})

test("한국 시간의 요일을 읽는다", () => {
  assert.equal(kstWeekday("2026-10-08T10:00:00.000Z"), "목요일")
  // 한국 시간으로는 이미 금요일이다.
  assert.equal(kstWeekday("2026-10-08T15:00:00.000Z"), "금요일")
})

test("이번 달의 시작은 한국 시간 1일 0시다", () => {
  assert.equal(kstMonthStart(new Date("2026-10-08T10:00:00.000Z")), "2026-09-30T15:00:00.000Z")
  // 한국 시간으로는 11월 1일 0시 30분이다.
  assert.equal(kstMonthStart(new Date("2026-10-31T15:30:00.000Z")), "2026-10-31T15:00:00.000Z")
  assert.equal(kstMonthStart(new Date("2026-01-01T00:00:00.000Z")), "2025-12-31T15:00:00.000Z")
})

test("이번 주의 시작은 한국 시간 월요일 0시다", () => {
  // 2026-10-08 은 목요일이고 그 주의 월요일은 10월 5일이다.
  assert.equal(kstWeekStart(new Date("2026-10-08T10:00:00.000Z")), "2026-10-04T15:00:00.000Z")
  // 월요일 0시 정각과 일요일 23시 59분.
  assert.equal(kstWeekStart(new Date("2026-10-04T15:00:00.000Z")), "2026-10-04T15:00:00.000Z")
  assert.equal(kstWeekStart(new Date("2026-10-04T14:59:00.000Z")), "2026-09-27T15:00:00.000Z")
  // 일요일은 그 주의 마지막 날이다.
  assert.equal(kstWeekStart(new Date("2026-10-11T03:00:00.000Z")), "2026-10-04T15:00:00.000Z")
})
