import assert from "node:assert/strict"
import { test } from "node:test"

import { appPage, type ClubPage } from "./skeleton-route"

const CLUB = "/clubs/11111111-1111-4111-8111-111111111111"

function club(path: string): ClubPage | null {
  const page = appPage(`${CLUB}${path}`)
  return page.area === "club" ? page.page : null
}

test("Club 밖의 화면을 주소로 고른다", () => {
  assert.deepEqual(appPage("/"), { area: "home" })
  assert.deepEqual(appPage("/account"), { area: "account" })
  assert.deepEqual(appPage("/join/abc"), { area: "join" })
  assert.deepEqual(appPage("/p/abc"), { area: "presentation" })
  assert.deepEqual(appPage("/p/abc/slides"), { area: "slides" })
})

test("모르는 주소는 other 다", () => {
  for (const path of ["/login", "/privacy", "/join", "/p", "/p/abc/other", "/account/x", "/clubs"]) {
    assert.deepEqual(appPage(path), { area: "other" }, path)
  }
})

test("Club 안쪽의 목록과 하나를 보는 화면을 가른다", () => {
  assert.deepEqual(club(""), { kind: "overview" })
  assert.deepEqual(club("/sessions"), { kind: "sessions" })
  assert.deepEqual(club("/logs"), { kind: "logs" })
  assert.deepEqual(club("/logs/abc"), { kind: "log" })
  assert.deepEqual(club("/insights"), { kind: "insights" })
  assert.deepEqual(club("/insights/2026-10"), { kind: "insight-month" })
  assert.deepEqual(club("/projects"), { kind: "projects" })
  assert.deepEqual(club("/projects/abc"), { kind: "project" })
  assert.deepEqual(club("/retros"), { kind: "retros" })
  assert.deepEqual(club("/retros/2026-10"), { kind: "retro-month" })
  assert.deepEqual(club("/members"), { kind: "members" })
  assert.deepEqual(club("/notifications"), { kind: "notifications" })
  assert.deepEqual(club("/settings"), { kind: "settings" })
})

test("AI Log 를 쓰는 화면과 고치는 화면은 같은 폼이다", () => {
  assert.deepEqual(club("/logs/new"), { kind: "log-form" })
  assert.deepEqual(club("/logs/abc/edit"), { kind: "log-form" })
})

test("Session 상세는 탭까지 고른다", () => {
  assert.deepEqual(club("/sessions/abc"), { kind: "session", tab: "overview" })
  for (const tab of ["attendance", "logs", "insight", "retros"] as const) {
    assert.deepEqual(club(`/sessions/abc/${tab}`), { kind: "session", tab })
  }
})

test("Docs 는 첫 화면과 문서가 같은 자리 표시다", () => {
  assert.deepEqual(club("/docs"), { kind: "docs" })
  assert.deepEqual(club("/docs/getting-started"), { kind: "docs" })
})

test("Club 안의 모르는 주소는 other 다", () => {
  for (const path of [
    "/unknown",
    "/sessions/abc/unknown",
    "/sessions/abc/logs/more",
    "/logs/new/more",
    "/logs/abc/other",
    "/logs/abc/edit/more",
    "/projects/abc/more",
    "/members/abc",
    "/docs/a/b",
  ]) {
    assert.deepEqual(club(path), { kind: "other" }, path)
  }
})

test("끝의 빗금은 없는 것과 같다", () => {
  assert.deepEqual(club("/sessions/"), { kind: "sessions" })
  assert.deepEqual(appPage("/account/"), { area: "account" })
})
