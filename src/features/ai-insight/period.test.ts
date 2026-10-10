import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isMonthKey,
  monthKeyOf,
  monthLabel,
  monthRange,
  recentMonthKeys,
} from "./period"

test("달을 가리키는 값의 모양을 확인한다", () => {
  assert.equal(isMonthKey("2026-10"), true)
  assert.equal(isMonthKey("2026-01"), true)
  assert.equal(isMonthKey("2026-13"), false)
  assert.equal(isMonthKey("2026-00"), false)
  assert.equal(isMonthKey("2026-1"), false)
  assert.equal(isMonthKey("2026-10-01"), false)
  assert.equal(isMonthKey(undefined), false)
  assert.equal(isMonthKey(["2026-10"]), false)
})

test("시각이 든 달은 한국 시간으로 정한다", () => {
  assert.equal(monthKeyOf("2026-10-08T10:00:00.000Z"), "2026-10")
  // 한국 시간으로는 11월 1일 0시 30분이다.
  assert.equal(monthKeyOf("2026-10-31T15:30:00.000Z"), "2026-11")
  assert.equal(monthKeyOf(new Date("2026-09-30T14:59:00.000Z")), "2026-09")
})

test("달의 범위는 한국 시간 1일 0시부터 다음 달 1일 0시 전까지다", () => {
  assert.deepEqual(monthRange("2026-10"), { start: "2026-09-30T15:00:00.000Z", end: "2026-10-31T15:00:00.000Z" })
  assert.deepEqual(monthRange("2026-12"), { start: "2026-11-30T15:00:00.000Z", end: "2026-12-31T15:00:00.000Z" })
  assert.deepEqual(monthRange("2026-02"), { start: "2026-01-31T15:00:00.000Z", end: "2026-02-28T15:00:00.000Z" })
})

test("범위의 시작으로 다시 그 달을 찾는다", () => {
  for (const key of ["2026-01", "2026-10", "2026-12"]) {
    assert.equal(monthKeyOf(monthRange(key).start), key)
  }
})

test("달의 이름을 만든다", () => {
  assert.equal(monthLabel("2026-10"), "2026년 10월")
  assert.equal(monthLabel("2026-03"), "2026년 3월")
})

test("이번 달부터 거슬러 올라가며 달을 센다", () => {
  assert.deepEqual(recentMonthKeys(new Date("2026-02-10T03:00:00.000Z"), 4), ["2026-02", "2026-01", "2025-12", "2025-11"])
  // 한국 시간으로는 이미 3월이다.
  assert.deepEqual(recentMonthKeys(new Date("2026-02-28T16:00:00.000Z"), 2), ["2026-03", "2026-02"])
})
