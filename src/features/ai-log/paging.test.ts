import assert from "node:assert/strict"
import { test } from "node:test"

import { logLimit } from "./paging"

test("주소의 n 값을 읽을 기록 수로 바꾼다", () => {
  assert.equal(logLimit(undefined), 20)
  assert.equal(logLimit("40"), 40)
  assert.equal(logLimit("99999"), 200)
})

test("이상한 값이면 첫 묶음만 읽는다", () => {
  for (const value of ["abc", "-5", "3", ["40"]]) {
    assert.equal(logLimit(value), 20)
  }
})
