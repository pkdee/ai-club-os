import assert from "node:assert/strict"
import { test } from "node:test"

import { toolMergeGroups } from "./tool-merge"

test("표기만 다른 이름을 한 묶음으로 본다", () => {
  assert.deepEqual(
    toolMergeGroups([
      { tool: "My Tool", logCount: 3 },
      { tool: "mytool", logCount: 1 },
      { tool: "MY  TOOL", logCount: 1 },
    ]),
    [
      {
        target: "My Tool",
        sources: [
          { tool: "mytool", logCount: 1 },
          { tool: "MY  TOOL", logCount: 1 },
        ],
      },
    ]
  )
})

test("널리 쓰는 도구는 그 도구의 표기로 합친다", () => {
  const groups = toolMergeGroups([
    { tool: "chatgpt", logCount: 5 },
    { tool: "ChatGPT", logCount: 2 },
    { tool: "챗지피티", logCount: 1 },
  ])
  assert.equal(groups.length, 1)
  assert.equal(groups[0].target, "ChatGPT")
  assert.deepEqual(groups[0].sources.map((item) => item.tool), ["chatgpt", "챗지피티"])
})

test("표기가 하나뿐이어도 널리 쓰는 표기와 다르면 합칠 것으로 본다", () => {
  assert.deepEqual(toolMergeGroups([{ tool: "챗지피티", logCount: 2 }]), [
    { target: "ChatGPT", sources: [{ tool: "챗지피티", logCount: 2 }] },
  ])
})

test("이미 하나로 적힌 도구는 묶음에 나오지 않는다", () => {
  assert.deepEqual(
    toolMergeGroups([
      { tool: "ChatGPT", logCount: 4 },
      { tool: "우리 팀 도구", logCount: 2 },
    ]),
    []
  )
})

test("합칠 기록이 많은 묶음이 앞에 온다", () => {
  const groups = toolMergeGroups([
    { tool: "Alpha", logCount: 9 },
    { tool: "alpha", logCount: 1 },
    { tool: "Beta", logCount: 2 },
    { tool: "beta", logCount: 2 },
    { tool: "BETA", logCount: 1 },
  ])
  assert.deepEqual(groups.map((group) => group.target), ["Beta", "Alpha"])
})
