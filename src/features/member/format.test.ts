import assert from "node:assert/strict"
import { test } from "node:test"

import { formatInviteExpiry, formatJoinDate } from "./format"
import { memberName } from "./name"

test("합류일은 한국 시간의 날짜로 보여 준다", () => {
  assert.equal(formatJoinDate("2026-08-31T15:30:00.000Z"), "2026. 9. 1.")
  assert.equal(formatJoinDate("2026-09-01T14:59:00.000Z"), "2026. 9. 1.")
})

test("만료 시각은 한국 시간으로 보여 준다", () => {
  assert.equal(formatInviteExpiry("2026-10-17T05:30:00.000Z"), "10월 17일 14:30")
})

test("이름이 비어 있으면 이메일을, 둘 다 없으면 안내 글자를 쓴다", () => {
  assert.equal(memberName({ display_name: "김하늘", email: "a@example.com" }), "김하늘")
  assert.equal(memberName({ display_name: "", email: "a@example.com" }), "a@example.com")
  assert.equal(memberName({ display_name: "", email: null }), "이름 없음")
})
