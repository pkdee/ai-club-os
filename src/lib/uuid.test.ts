import assert from "node:assert/strict"
import { test } from "node:test"

import { isUuid } from "./uuid"

test("식별자 형식을 가려낸다", () => {
  assert.equal(isUuid("22222222-2222-4222-8222-222222222222"), true)
  assert.equal(isUuid("22222222-2222-4222-8222-22222222222Z"), false)
  assert.equal(isUuid("abc"), false)
  assert.equal(isUuid(""), false)
  assert.equal(isUuid("22222222-2222-4222-8222-222222222222 "), false)
})
