import assert from "node:assert/strict"
import { test } from "node:test"

import {
  canonicalTools,
  normalizeTools,
  toolKey,
  validateAiLog,
  type AiLogInput,
} from "./rules"

// 두 칸짜리로 저장되는 글자. 데이터베이스처럼 한 글자로 세는지 볼 때 쓴다.
const astral = "\u{1F600}"

const base: AiLogInput = {
  sessionId: "",
  title: "제목",
  tools: [],
  attempt: "해 봤다",
  result: "",
  learned: "",
  nextAction: "",
}

function errorKeys(input: AiLogInput) {
  const result = validateAiLog(input)
  return result.ok ? [] : Object.keys(result.errors)
}

test("도구 이름을 쉼표로 나누고 다듬는다", () => {
  assert.deepEqual(normalizeTools(["Claude, LangChain ", "  bge-m3"]), ["Claude", "LangChain", "bge-m3"])
  assert.deepEqual(normalizeTools(["", " , ,", "Cursor"]), ["Cursor"])
  assert.deepEqual(normalizeTools(["Claude   Code"]), ["Claude Code"])
})

test("대소문자나 공백만 다른 도구 이름은 처음 것 하나로 합친다", () => {
  assert.deepEqual(normalizeTools(["Claude", "claude", "CLAUDE"]), ["Claude"])
  assert.deepEqual(normalizeTools(["Claude Code", "ClaudeCode", "claude  code"]), ["Claude Code"])
})

test("도구 이름을 비교하는 값은 대소문자와 공백의 차이를 없앤다", () => {
  assert.equal(toolKey("Claude Code"), "claudecode")
  assert.equal(toolKey(" ChatGPT "), "chatgpt")
  assert.equal(toolKey("bge-m3"), "bge-m3")
})

test("입력한 도구 이름을 Club 에서 이미 쓰는 표기에 맞춘다", () => {
  const known = ["ChatGPT", "Claude Code", "LangChain"]
  assert.deepEqual(canonicalTools(["chatgpt", "claudecode", "Cursor"], known), ["ChatGPT", "Claude Code", "Cursor"])
})

test("표기를 맞춘 뒤 같아진 도구는 하나만 남긴다", () => {
  assert.deepEqual(canonicalTools(["chatgpt", "ChatGPT", "CHAT GPT"], ["ChatGPT"]), ["ChatGPT"])
})

test("Club 에서 처음 쓰는 도구는 입력한 그대로 둔다", () => {
  assert.deepEqual(canonicalTools(["bge-m3"], []), ["bge-m3"])
})

test("필수는 제목과 시도한 내용이다", () => {
  assert.deepEqual(errorKeys(base), [])
  assert.deepEqual(errorKeys({ ...base, title: "", attempt: "" }), ["title", "attempt"])
})

test("제목은 100자, 내용 칸은 5000자까지다", () => {
  assert.deepEqual(errorKeys({ ...base, title: "가".repeat(100) }), [])
  assert.deepEqual(errorKeys({ ...base, title: "가".repeat(101) }), ["title"])
  assert.deepEqual(errorKeys({ ...base, attempt: "가".repeat(5000), result: "나".repeat(5000) }), [])
  assert.deepEqual(
    errorKeys({ ...base, result: "가".repeat(5001), learned: "가".repeat(5001), nextAction: "가".repeat(5001) }),
    ["result", "learned", "nextAction"]
  )
  assert.deepEqual(errorKeys({ ...base, title: astral.repeat(100) }), [])
})

test("도구는 10개까지이고 이름은 30자까지다", () => {
  const tools = (count: number) => Array.from({ length: count }, (_, index) => `t${index}`)
  assert.deepEqual(errorKeys({ ...base, tools: tools(10) }), [])
  assert.deepEqual(errorKeys({ ...base, tools: tools(11) }), ["tools"])
  assert.deepEqual(errorKeys({ ...base, tools: ["가".repeat(30)] }), [])
  assert.deepEqual(errorKeys({ ...base, tools: ["가".repeat(31)] }), ["tools"])
})

test("Session 은 비우거나 식별자 형식이어야 한다", () => {
  assert.deepEqual(errorKeys({ ...base, sessionId: "abc" }), ["sessionId"])
  assert.deepEqual(errorKeys({ ...base, sessionId: "22222222-2222-4222-8222-222222222222" }), [])
})
