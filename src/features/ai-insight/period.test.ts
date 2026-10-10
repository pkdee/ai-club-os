import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isMonthKey,
  monthKeyOf,
  monthKeysBetween,
  monthLabel,
  monthRange,
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

test("두 달 사이의 달을 최근 달부터 돌려준다", () => {
  assert.deepEqual(monthKeysBetween("2025-11", "2026-02", 24), ["2026-02", "2026-01", "2025-12", "2025-11"])
  assert.deepEqual(monthKeysBetween("2026-10", "2026-10", 24), ["2026-10"])
})

test("정해진 수를 넘으면 오래된 달을 뺀다", () => {
  assert.deepEqual(monthKeysBetween("2020-01", "2026-03", 3), ["2026-03", "2026-02", "2026-01"])
})

test("시작이 끝보다 뒤면 달이 없다", () => {
  assert.deepEqual(monthKeysBetween("2026-11", "2026-10", 24), [])
})
