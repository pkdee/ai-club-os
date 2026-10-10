import assert from "node:assert/strict"
import { test } from "node:test"

import { KNOWN_TOOLS } from "./tool-catalog"
import { TOOL_LOGOS, logoUrl } from "./tool-logos"

test("로고는 목록에 있는 도구의 표기에만 걸려 있다", () => {
  const names = new Set(KNOWN_TOOLS.map((tool) => tool.name))
  for (const name of Object.keys(TOOL_LOGOS)) {
    assert.ok(names.has(name), `${name} 은 도구 목록에 없는 표기다`)
  }
})

test("가장 많이 쓰는 도구에는 모두 로고가 있다", () => {
  for (const tool of KNOWN_TOOLS.slice(0, 8)) {
    assert.ok(TOOL_LOGOS[tool.name], `${tool.name} 에 로고가 없다`)
  }
})

test("로고마다 그림 주소가 있다", () => {
  for (const [name, logo] of Object.entries(TOOL_LOGOS)) {
    assert.ok(logoUrl(logo).length > 0, name)
    assert.equal(typeof logo.tinted, "boolean", name)
  }
})
