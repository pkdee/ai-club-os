import assert from "node:assert/strict"
import { test } from "node:test"

import {
  MEMBER_SEARCH_MAX,
  matchesMember,
  membersHref,
  parseMemberQuery,
} from "./search"

const haneul = { name: "김하늘", email: "Haneul.Kim@example.com" }

test("이름이나 이메일에 찾는 글자가 들어 있으면 맞는다", () => {
  assert.equal(matchesMember(haneul, "하늘"), true)
  assert.equal(matchesMember(haneul, "example"), true)
  assert.equal(matchesMember(haneul, "서연"), false)
})

test("대소문자와 공백의 차이는 무시한다", () => {
  assert.equal(matchesMember(haneul, "haneul.kim"), true)
  assert.equal(matchesMember(haneul, "김 하늘"), true)
  assert.equal(matchesMember({ name: "Park Seo Yeon", email: null }, "parkseo"), true)
})

test("찾는 글자가 비어 있으면 모두 맞는다", () => {
  assert.equal(matchesMember(haneul, ""), true)
  assert.equal(matchesMember(haneul, "   "), true)
})

test("이메일이 없는 Member 는 이름으로만 찾는다", () => {
  assert.equal(matchesMember({ name: "박서연", email: null }, "서연"), true)
  assert.equal(matchesMember({ name: "박서연", email: null }, "example"), false)
})

test("주소의 값은 앞뒤 공백을 떼고 길이를 맞춘다", () => {
  assert.equal(parseMemberQuery("  하늘 "), "하늘")
  assert.equal(parseMemberQuery(undefined), "")
  assert.equal(parseMemberQuery(["a", "b"]), "")
  assert.equal(Array.from(parseMemberQuery("가".repeat(80))).length, MEMBER_SEARCH_MAX)
})

test("주소에는 기본값이 아닌 것만 적는다", () => {
  assert.equal(membersHref("c1", "all", ""), "/clubs/c1/members")
  assert.equal(membersHref("c1", "admin", ""), "/clubs/c1/members?role=admin")
  assert.equal(
    membersHref("c1", "member", "김 하늘"),
    "/clubs/c1/members?role=member&q=%EA%B9%80+%ED%95%98%EB%8A%98"
  )
})
