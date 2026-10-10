import assert from "node:assert/strict"
import { test } from "node:test"

import {
  clearedLogsHref,
  isFiltered,
  logsHref,
  parseLogFilters,
  type AiLogFilters,
} from "./filters"

const session = "22222222-2222-4222-8222-222222222222"
const none: AiLogFilters = { view: "all", query: "", session: null, tool: null, sort: "newest", limit: 20 }

test("주소에 값이 없으면 기본 조건이다", () => {
  assert.deepEqual(parseLogFilters({}), none)
  assert.equal(isFiltered(none), false)
})

test("주소의 값을 조건으로 읽는다", () => {
  const filters = parseLogFilters({ view: "mine", q: "  rag ", session, tool: " Claude ", sort: "oldest", n: "40" })
  assert.deepEqual(filters, { view: "mine", query: "rag", session, tool: "Claude", sort: "oldest", limit: 40 })
  assert.equal(isFiltered(filters), true)
})

test("형식이 틀린 값은 고르지 않은 것으로 본다", () => {
  const filters = parseLogFilters({ view: "x", q: ["a", "b"], session: "abc", tool: "   ", sort: "random", n: "-1" })
  assert.deepEqual(filters, none)
})

test("Session 없는 기록만 고를 수 있다", () => {
  assert.equal(parseLogFilters({ session: "none" }).session, "none")
})

test("찾는 글자는 100자에서 자른다", () => {
  assert.equal(Array.from(parseLogFilters({ q: "가".repeat(150) }).query).length, 100)
})

test("정렬과 보기만 바꾼 것은 조건으로 치지 않는다", () => {
  assert.equal(isFiltered({ ...none, view: "mine", sort: "oldest" }), false)
})

test("조건을 주소로 바꿀 때 기본값은 적지 않는다", () => {
  assert.equal(logsHref("c1", none), "/clubs/c1/logs")
  assert.equal(
    logsHref("c1", { view: "mine", query: "rag 검색", session, tool: "C++", sort: "oldest", limit: 40 }),
    `/clubs/c1/logs?view=mine&q=rag+%EA%B2%80%EC%83%89&session=${session}&tool=C%2B%2B&sort=oldest&n=40`
  )
})

test("일부만 바꾼 주소를 만든다", () => {
  const filters = { ...none, query: "rag", limit: 40 }
  assert.equal(logsHref("c1", filters, { view: "mine", limit: 20 }), "/clubs/c1/logs?view=mine&q=rag")
})

test("주소로 바꿨다가 다시 읽으면 같은 조건이다", () => {
  const filters: AiLogFilters = { view: "mine", query: "100% _", session: "none", tool: 'a "b" {c}', sort: "oldest", limit: 60 }
  const url = new URL(logsHref("c1", filters), "http://x")
  assert.deepEqual(parseLogFilters(Object.fromEntries(url.searchParams)), filters)
})

test("조건을 지워도 보기와 정렬은 남는다", () => {
  const filters: AiLogFilters = { view: "mine", query: "rag", session, tool: "Claude", sort: "oldest", limit: 60 }
  assert.equal(clearedLogsHref("c1", filters), "/clubs/c1/logs?view=mine&sort=oldest")
})
