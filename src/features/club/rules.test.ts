import assert from "node:assert/strict"
import { test } from "node:test"

import { validateClub } from "./rules"

// 두 칸짜리로 저장되는 글자. 데이터베이스처럼 한 글자로 세는지 볼 때 쓴다.
const astral = "\u{1F600}"

const errorKeys = (input: { name: string; description: string }) =>
  Object.keys(validateClub(input) ?? {})

test("Club 이름은 1자 이상 50자 이하다", () => {
  assert.deepEqual(errorKeys({ name: "AI 모각코", description: "" }), [])
  assert.deepEqual(errorKeys({ name: "", description: "" }), ["name"])
  assert.deepEqual(errorKeys({ name: "가".repeat(50), description: "" }), [])
  assert.deepEqual(errorKeys({ name: "가".repeat(51), description: "" }), ["name"])
})

test("소개는 200자 이하다", () => {
  assert.deepEqual(errorKeys({ name: "이름", description: "가".repeat(200) }), [])
  assert.deepEqual(errorKeys({ name: "이름", description: "가".repeat(201) }), ["description"])
})

test("두 칸짜리 글자도 한 글자로 센다", () => {
  assert.deepEqual(errorKeys({ name: astral.repeat(50), description: "" }), [])
  assert.deepEqual(errorKeys({ name: astral.repeat(51), description: "" }), ["name"])
})
