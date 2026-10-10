import assert from "node:assert/strict"
import { test } from "node:test"

import { googleAvatarUrl } from "./google-avatar"

test("Google 의 사진 주소는 그대로 돌려준다", () => {
  const url = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c"
  assert.equal(googleAvatarUrl(url), url)
  assert.equal(
    googleAvatarUrl("https://lh5.googleusercontent.com/a-/x"),
    "https://lh5.googleusercontent.com/a-/x"
  )
})

test("Google 의 사진 주소가 아니면 버린다", () => {
  const rejected = [
    "http://lh3.googleusercontent.com/a/x",
    "https://lh3.googleusercontent.com.evil.example/a",
    "https://lh3.googleusercontent.com@evil.example/a",
    "https://evil.example/https://lh3.googleusercontent.com/a",
    "https://lhx.googleusercontent.com/a",
    "https://lh3.googleusercontent.com",
    "https://evil.example/p.png",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "",
    `https://lh3.googleusercontent.com/${"a".repeat(1100)}`,
  ]
  for (const value of rejected) {
    assert.equal(googleAvatarUrl(value), null, value.slice(0, 60))
  }
})

test("글자가 아닌 값은 버린다", () => {
  for (const value of [undefined, null, 3, ["https://lh3.googleusercontent.com/a"]]) {
    assert.equal(googleAvatarUrl(value), null)
  }
})
