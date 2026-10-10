import assert from "node:assert/strict"
import { test } from "node:test"

import {
  AI_LOG_DRAFT_DAYS,
  draftKey,
  hasDraftContent,
  parseDraft,
  serializeDraft,
} from "./draft"
import type { AiLogInput } from "./rules"

const empty: AiLogInput = {
  sessionId: "",
  projectId: "",
  title: "",
  tools: [],
  attempt: "",
  result: "",
  learned: "",
  nextAction: "",
}
const now = new Date("2026-10-10T05:00:00.000Z")

test("맡겨 두는 이름은 사람, Club, 기록마다 다르다", () => {
  assert.equal(draftKey("u1", "c1"), "ai-club-os:ai-log-draft:u1:c1:new")
  assert.equal(draftKey("u1", "c1", "l1"), "ai-club-os:ai-log-draft:u1:c1:l1")
  assert.notEqual(draftKey("u1", "c1"), draftKey("u2", "c1"))
  assert.notEqual(draftKey("u1", "c1"), draftKey("u1", "c2"))
})

test("적는 칸이나 도구가 처음과 다르면 맡겨 둘 내용이 있는 것이다", () => {
  assert.equal(hasDraftContent(empty, empty), false)
  assert.equal(hasDraftContent({ ...empty, title: "제목" }, empty), true)
  assert.equal(hasDraftContent({ ...empty, nextAction: "다음" }, empty), true)
  assert.equal(hasDraftContent({ ...empty, tools: ["Claude"] }, empty), true)
})

test("Session 이나 Project 만 바꾼 것은 맡겨 둘 내용으로 치지 않는다", () => {
  assert.equal(hasDraftContent({ ...empty, sessionId: "s1" }, empty), false)
  assert.equal(hasDraftContent({ ...empty, projectId: "p1" }, empty), false)
})

test("Project 값이 없던 때에 맡겨 둔 것도 읽는다", () => {
  const { projectId: _projectId, ...old } = { ...empty, title: "예전 것" }
  void _projectId
  const raw = JSON.stringify({ v: 1, savedAt: now.toISOString(), values: old })
  assert.deepEqual(parseDraft(raw, now)?.values, { ...empty, title: "예전 것" })
  assert.equal(parseDraft(JSON.stringify({ v: 1, savedAt: now.toISOString(), values: { ...empty, projectId: 3 } }), now), null)
})

test("고치는 화면에서는 저장된 내용과 다를 때만 맡겨 둔다", () => {
  const saved = { ...empty, title: "제목", attempt: "시도", tools: ["Claude", "Cursor"] }
  assert.equal(hasDraftContent({ ...saved }, saved), false)
  assert.equal(hasDraftContent({ ...saved, attempt: "시도를 고침" }, saved), true)
  assert.equal(hasDraftContent({ ...saved, tools: ["Cursor", "Claude"] }, saved), true)
  assert.equal(hasDraftContent({ ...saved, tools: ["Claude"] }, saved), true)
})

test("맡겨 둔 것을 그대로 되읽는다", () => {
  const values = { ...empty, sessionId: "s1", title: "제목", tools: ["Claude"], attempt: "여러 줄\n내용" }
  const draft = parseDraft(serializeDraft(values, now), now)
  assert.deepEqual(draft, { savedAt: "2026-10-10T05:00:00.000Z", values })
})

test("기한이 지난 것은 읽지 않는다", () => {
  const raw = serializeDraft({ ...empty, title: "제목" }, now)
  const day = 24 * 60 * 60 * 1000
  assert.notEqual(parseDraft(raw, new Date(now.getTime() + (AI_LOG_DRAFT_DAYS * day - 1000))), null)
  assert.equal(parseDraft(raw, new Date(now.getTime() + (AI_LOG_DRAFT_DAYS * day + 1000))), null)
  // 시계가 뒤로 돌아가 맡긴 시각이 앞날이 된 것도 읽지 않는다.
  assert.equal(parseDraft(raw, new Date(now.getTime() - 1000)), null)
})

test("모양이 틀린 것은 읽지 않는다", () => {
  assert.equal(parseDraft(null, now), null)
  assert.equal(parseDraft("", now), null)
  assert.equal(parseDraft("{", now), null)
  assert.equal(parseDraft("null", now), null)
  assert.equal(parseDraft(JSON.stringify({ v: 2, savedAt: now.toISOString(), values: empty }), now), null)
  assert.equal(parseDraft(JSON.stringify({ v: 1, savedAt: "어제", values: empty }), now), null)
  assert.equal(parseDraft(JSON.stringify({ v: 1, savedAt: now.toISOString(), values: { ...empty, title: 3 } }), now), null)
  assert.equal(parseDraft(JSON.stringify({ v: 1, savedAt: now.toISOString(), values: { ...empty, tools: "Claude" } }), now), null)
  assert.equal(parseDraft(JSON.stringify({ v: 1, savedAt: now.toISOString(), values: { ...empty, tools: [1] } }), now), null)
})

test("모르는 값이 섞여 있어도 아는 항목만 꺼낸다", () => {
  const raw = JSON.stringify({ v: 1, savedAt: now.toISOString(), values: { ...empty, title: "제목", extra: "x" } })
  assert.deepEqual(parseDraft(raw, now)?.values, { ...empty, title: "제목" })
})
