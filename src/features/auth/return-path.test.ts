import assert from "node:assert/strict"
import { test } from "node:test"

import { safeReturnPath } from "./return-path"

const token = "0123456789abcdef0123456789abcdef"

test("이 앱 안의 경로는 그대로 돌려준다", () => {
  assert.equal(safeReturnPath(`/join/${token}`), `/join/${token}`)
  assert.equal(
    safeReturnPath("/clubs/abc/logs?view=mine&n=40"),
    "/clubs/abc/logs?view=mine&n=40"
  )
  assert.equal(
    safeReturnPath("/clubs/a?to=https://evil.example"),
    "/clubs/a?to=https://evil.example"
  )
})

test("화면 조각을 받을 때 붙는 값은 뺀다", () => {
  assert.equal(safeReturnPath("/clubs/abc?_rsc=xyz&view=mine"), "/clubs/abc?view=mine")
})

test("처음 화면과 로그인 관련 경로는 돌아갈 곳으로 삼지 않는다", () => {
  for (const value of ["/", "/login", "/login?next=/x", "/auth/callback?code=1", "/clubs/../login"]) {
    assert.equal(safeReturnPath(value), null, value)
  }
})

test("다른 사이트로 보내려는 값은 버린다", () => {
  const rejected = [
    "https://evil.example/x",
    "//evil.example/x",
    "/\\evil.example",
    "http:/evil.example",
    "javascript:alert(1)",
    "data:text/html,x",
    "/a\\b",
    "/a\nb",
    "/a\tb",
    "/\t/evil.example",
    "join/x",
    "../x",
    "",
    `/${"a".repeat(600)}`,
  ]
  for (const value of rejected) {
    assert.equal(safeReturnPath(value), null, JSON.stringify(value).slice(0, 60))
  }
})

test("글자가 아닌 값은 버린다", () => {
  for (const value of [undefined, null, 3, ["/x"]]) {
    assert.equal(safeReturnPath(value), null)
  }
})
