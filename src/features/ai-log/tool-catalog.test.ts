import assert from "node:assert/strict"
import { test } from "node:test"

import { AI_LOG_TOOL_NAME_MAX, canonicalTools } from "./rules"
import {
  KNOWN_TOOLS,
  expandSearch,
  knownToolName,
  mergeToolCounts,
  suggestTools,
  toolFilterValue,
  toolSpellings,
} from "./tool-catalog"
import { toolKey } from "./tool-key"

test("목록의 표기는 서로 겹치지 않는다", () => {
  const owner = new Map<string, string>()
  for (const tool of KNOWN_TOOLS) {
    for (const spelling of [tool.name, ...(tool.aliases ?? [])]) {
      const key = toolKey(spelling)
      assert.equal(owner.get(key) ?? tool.name, tool.name, `${spelling} 이 두 도구에 걸쳐 있다`)
      owner.set(key, tool.name)
    }
  }
})

test("목록의 표기는 저장할 수 있는 모양이다", () => {
  for (const tool of KNOWN_TOOLS) {
    assert.ok(Array.from(tool.name).length <= AI_LOG_TOOL_NAME_MAX, tool.name)
    for (const spelling of [tool.name, ...(tool.aliases ?? [])]) {
      assert.equal(spelling, spelling.trim(), spelling)
      assert.ok(!/[|,]/.test(spelling), `${spelling} 에 쓸 수 없는 글자가 있다`)
    }
  }
})

test("다르게 적어도 목록의 도구로 알아본다", () => {
  assert.equal(knownToolName("chatgpt"), "ChatGPT")
  assert.equal(knownToolName("Chat GPT"), "ChatGPT")
  assert.equal(knownToolName("챗지피티"), "ChatGPT")
  assert.equal(knownToolName("클로드 코드"), "Claude Code")
  assert.equal(knownToolName("claudecode"), "Claude Code")
  assert.equal(knownToolName("안티그래비티"), "Antigravity")
  assert.equal(knownToolName("코덱스"), "Codex")
  assert.equal(knownToolName("커서"), "Cursor")
  assert.equal(knownToolName("제미나이"), "Gemini")
})

test("목록에 없거나 여러 도구를 함께 가리키는 말은 알아보지 않는다", () => {
  assert.equal(knownToolName("우리가 만든 도구"), null)
  assert.equal(knownToolName("copilot"), null)
  assert.equal(knownToolName("코파일럿"), null)
  assert.equal(knownToolName(""), null)
})

test("저장할 때 목록의 표기가 Club 의 표기보다 먼저다", () => {
  assert.deepEqual(canonicalTools(["챗지피티", "클로드", "커서"], []), ["ChatGPT", "Claude", "Cursor"])
  assert.deepEqual(canonicalTools(["chatgpt"], ["chatgpt"]), ["ChatGPT"])
  assert.deepEqual(canonicalTools(["bge m3"], ["bge-m3", "BGE M3"]), ["BGE M3"])
  assert.deepEqual(canonicalTools(["클로드", "claude", "Claude"], []), ["Claude"])
})

test("적는 동안 맞는 도구를 보여 준다", () => {
  assert.deepEqual(suggestTools("cl", [], []).slice(0, 2), ["Claude", "Claude Code"])
  assert.ok(suggestTools("클로", [], []).includes("Claude Code"))
  assert.ok(suggestTools("gpt", [], []).includes("ChatGPT"))
  assert.deepEqual(suggestTools("copilot", [], []).sort(), ["GitHub Copilot", "Microsoft Copilot"])
  assert.deepEqual(suggestTools("없는도구이름", [], []), [])
})

test("이 Club 에서 쓰는 도구를 먼저 보여 주고 이미 넣은 도구는 뺀다", () => {
  assert.deepEqual(suggestTools("", ["bge-m3", "cursor"], []).slice(0, 2), ["bge-m3", "Cursor"])
  assert.ok(!suggestTools("cl", [], ["클로드"]).includes("Claude"))
  assert.equal(suggestTools("", [], []).length, 8)
})

test("찾는 글자의 도구 이름은 다른 표기까지 함께 찾게 넓힌다", () => {
  assert.equal(expandSearch("클로드"), "claude|클로드")
  assert.equal(expandSearch("클로드 코드"), "claudecode|클로드코드")
  assert.equal(expandSearch("커서 리팩터링"), "cursor|커서 리팩터링")
  assert.equal(expandSearch("청크 크기"), "청크 크기")
  assert.equal(expandSearch(""), "")
})

test("도구로 고를 때는 그 도구의 모든 표기를 넘긴다", () => {
  assert.deepEqual(toolSpellings("챗지피티")[0], "ChatGPT")
  assert.equal(toolFilterValue("Cursor"), "Cursor|커서")
  assert.equal(toolFilterValue("bge-m3"), "bge-m3")
})

test("도구별 횟수를 목록의 표기로 합친다", () => {
  const merged = mergeToolCounts([
    { name: "chatgpt", logCount: 2 },
    { name: "챗지피티", logCount: 1 },
    { name: "bge-m3", logCount: 4 },
    { name: "Claude", logCount: 3 },
  ])
  assert.deepEqual(merged, [
    { name: "bge-m3", logCount: 4 },
    { name: "ChatGPT", logCount: 3 },
    { name: "Claude", logCount: 3 },
  ])
})
