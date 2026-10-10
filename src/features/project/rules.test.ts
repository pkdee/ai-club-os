import assert from "node:assert/strict"
import { test } from "node:test"

import {
  PROJECT_GOAL_MAX,
  PROJECT_LINK_LABEL_MAX,
  PROJECT_LINK_URL_MAX,
  PROJECT_NAME_MAX,
  PROJECT_TASK_TITLE_MAX,
  isProjectStatus,
  linkHost,
  linkLabelError,
  linkUrlError,
  taskTitleError,
  validateProject,
} from "./rules"

test("이름이 있고 길이가 맞으면 통과한다", () => {
  assert.equal(validateProject({ name: "RAG 챗봇", goal: "" }), null)
  assert.equal(validateProject({ name: "가".repeat(PROJECT_NAME_MAX), goal: "나".repeat(PROJECT_GOAL_MAX) }), null)
})

test("이름이 비었거나 길면 알려 준다", () => {
  assert.ok(validateProject({ name: "", goal: "" })?.name)
  assert.ok(validateProject({ name: "가".repeat(PROJECT_NAME_MAX + 1), goal: "" })?.name)
})

test("목표가 길면 알려 준다", () => {
  const errors = validateProject({ name: "이름", goal: "가".repeat(PROJECT_GOAL_MAX + 1) })
  assert.ok(errors?.goal)
  assert.equal(errors?.name, undefined)
})

test("글자 수는 데이터베이스처럼 글자 단위로 센다", () => {
  assert.equal(validateProject({ name: "\u{1F600}".repeat(PROJECT_NAME_MAX), goal: "" }), null)
})

test("진행 상태는 정해진 값만 받는다", () => {
  assert.equal(isProjectStatus("planning"), true)
  assert.equal(isProjectStatus("active"), true)
  assert.equal(isProjectStatus("done"), true)
  assert.equal(isProjectStatus("paused"), false)
  assert.equal(isProjectStatus(undefined), false)
})

test("http 와 https 주소만 받는다", () => {
  assert.equal(linkUrlError("https://github.com/ai-club/rag"), null)
  assert.equal(linkUrlError("http://localhost:3000/demo?x=1"), null)
  assert.ok(linkUrlError("javascript:alert(1)"))
  assert.ok(linkUrlError("ftp://example.com/file"))
  assert.ok(linkUrlError("data:text/html,<script>alert(1)</script>"))
  assert.ok(linkUrlError("github.com/ai-club/rag"))
  assert.ok(linkUrlError(""))
})

test("공백이 들었거나 긴 주소는 받지 않는다", () => {
  assert.ok(linkUrlError("https://example.com/a b"))
  assert.ok(linkUrlError("https://example.com/\nnext"))
  assert.equal(linkUrlError(`https://example.com/${"a".repeat(PROJECT_LINK_URL_MAX - 20)}`), null)
  assert.ok(linkUrlError(`https://example.com/${"a".repeat(PROJECT_LINK_URL_MAX)}`))
})

test("링크의 이름과 할 일은 비어 있거나 길면 받지 않는다", () => {
  assert.equal(linkLabelError("저장소"), null)
  assert.ok(linkLabelError(""))
  assert.ok(linkLabelError("가".repeat(PROJECT_LINK_LABEL_MAX + 1)))
  assert.equal(taskTitleError("평가 질문 만들기"), null)
  assert.ok(taskTitleError(""))
  assert.ok(taskTitleError("가".repeat(PROJECT_TASK_TITLE_MAX + 1)))
})

test("주소에서 보여 줄 이름을 꺼낸다", () => {
  assert.equal(linkHost("https://github.com/ai-club/rag"), "github.com")
  assert.equal(linkHost("http://localhost:3000/demo"), "localhost:3000")
  assert.equal(linkHost("주소가 아님"), "주소가 아님")
})
