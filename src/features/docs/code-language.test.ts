import assert from "node:assert/strict"
import { test } from "node:test"

import { codeLanguageLabel } from "./code-language"

test("Shiki 가 붙인 language-* 에서 보여 줄 이름을 고른다", () => {
  assert.equal(codeLanguageLabel("language-ts"), "TypeScript")
  assert.equal(codeLanguageLabel("language-bash"), "Terminal")
  assert.equal(codeLanguageLabel("other language-py"), "Python")
})

test("이름을 정해 두지 않은 언어는 적은 이름 그대로 보여 준다", () => {
  assert.equal(codeLanguageLabel("language-rust"), "rust")
})

test("언어가 없거나 그냥 글이면 이름을 보여 주지 않는다", () => {
  assert.equal(codeLanguageLabel(undefined), null)
  assert.equal(codeLanguageLabel(""), null)
  assert.equal(codeLanguageLabel("shiki"), null)
  assert.equal(codeLanguageLabel("language-text"), null)
  assert.equal(codeLanguageLabel("language-"), null)
})
