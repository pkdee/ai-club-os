import assert from "node:assert/strict"
import { test } from "node:test"

import { MEMBER_NAME_MAX, cleanMemberName, memberName, memberNameError } from "./name"

test("이름이 비어 있으면 이메일을, 그것도 없으면 이름 없음을 보여 준다", () => {
  assert.equal(memberName({ display_name: "김하늘", email: "a@b.c" }), "김하늘")
  assert.equal(memberName({ display_name: "", email: "a@b.c" }), "a@b.c")
  assert.equal(memberName({ display_name: "", email: null }), "이름 없음")
})

test("이름의 공백을 다듬는다", () => {
  assert.equal(cleanMemberName("  최   민준 \n"), "최 민준")
})

test("빈 이름과 너무 긴 이름은 쓸 수 없다", () => {
  assert.notEqual(memberNameError("   "), null)
  assert.equal(memberNameError("가".repeat(MEMBER_NAME_MAX)), null)
  assert.notEqual(memberNameError("가".repeat(MEMBER_NAME_MAX + 1)), null)
})

test("이메일처럼 @ 가 든 이름은 쓸 수 없다", () => {
  assert.notEqual(memberNameError("someone@example.com"), null)
  assert.equal(memberNameError("김하늘"), null)
})

test("글자 수는 눈에 보이는 글자로 센다", () => {
  assert.equal(memberNameError("\u{1F600}".repeat(MEMBER_NAME_MAX)), null)
})
