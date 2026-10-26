import assert from "node:assert/strict"
import { test } from "node:test"

import {
  applyEdit,
  continueList,
  insertLink,
  toggleCode,
  toggleList,
  toggleWrap,
  type MarkdownEdit,
  type TextSelection,
} from "./markdown-edit"

// « 와 » 사이가 고른 범위다. 둘이 붙어 있으면 커서만 있는 것이다.
function at(text: string): TextSelection {
  const start = text.indexOf("«")
  const end = text.indexOf("»") - 1
  return { value: text.replace("«", "").replace("»", ""), start, end }
}

function after(selection: TextSelection, edit: MarkdownEdit | null) {
  assert.ok(edit)
  const out = applyEdit(selection.value, edit)
  return `${out.slice(0, edit.selectionStart)}«${out.slice(
    edit.selectionStart,
    edit.selectionEnd
  )}»${out.slice(edit.selectionEnd)}`
}

function bold(text: string) {
  const selection = at(text)
  return after(selection, toggleWrap(selection, "**", "굵은 글"))
}

function italic(text: string) {
  const selection = at(text)
  return after(selection, toggleWrap(selection, "*", "기울인 글"))
}

test("굵게: 고른 글을 감싸고, 다시 누르면 걷어 낸다", () => {
  assert.equal(bold("이건 «중요»하다"), "이건 **«중요»**하다")
  assert.equal(bold("이건 **«중요»**하다"), "이건 «중요»하다")
  assert.equal(bold("이건 «**중요**»하다"), "이건 «중요»하다")
})

test("굵게: 고른 것이 없으면 자리 글을 넣고 골라 둔다", () => {
  assert.equal(bold("앞 «»뒤"), "앞 **«굵은 글»**뒤")
})

test("굵게: 고른 범위 양끝의 빈칸은 감싸지 않는다", () => {
  assert.equal(bold("«중요 »하다"), "**«중요»** 하다")
})

test("기울임은 굵게 안의 글을 굵게로 착각하지 않는다", () => {
  assert.equal(italic("**«중요»**"), "***«중요»***")
  assert.equal(italic("***«중요»***"), "**«중요»**")
  assert.equal(bold("***«중요»***"), "*«중요»*")
})

test("코드: 한 줄 안은 글 사이의 코드, 여러 줄은 코드 블록으로 감싼다", () => {
  const inline = at("«npm test» 를 돌렸다")
  assert.equal(after(inline, toggleCode(inline)), "`«npm test»` 를 돌렸다")

  const block = at("앞\n«a = 1\nb = 2»\n뒤")
  assert.equal(
    after(block, toggleCode(block)),
    "앞\n```\n«a = 1\nb = 2»\n```\n뒤"
  )

  const fenced = at("«```\na = 1\n```»")
  assert.equal(after(fenced, toggleCode(fenced)), "«a = 1»")
})

test("링크: 글을 고르면 주소 자리를, 주소를 고르면 링크 글 자리를 골라 둔다", () => {
  const text = at("«문서»를 봤다")
  assert.equal(after(text, insertLink(text)), "[문서](«https://»)를 봤다")

  const url = at("«https://example.com»")
  assert.equal(after(url, insertLink(url)), "[«링크 글»](https://example.com)")

  const empty = at("«»")
  assert.equal(after(empty, insertLink(empty)), "[«링크 글»](https://)")
})

test("목록: 고른 줄마다 표시를 붙이고, 모두 붙어 있으면 걷어 낸다", () => {
  const lines = at("«하나\n\n둘»")
  assert.equal(after(lines, toggleList(lines, "bullet")), "«- 하나\n\n- 둘»")

  const listed = at("«- 하나\n- 둘»")
  assert.equal(after(listed, toggleList(listed, "bullet")), "«하나\n둘»")

  const ordered = at("«하나\n둘»")
  assert.equal(after(ordered, toggleList(ordered, "ordered")), "«1. 하나\n2. 둘»")
})

test("목록: 다른 목록이면 표시를 바꾸고, 커서는 같은 글자 앞에 둔다", () => {
  const swap = at("«- 하나\n- [ ] 둘»")
  assert.equal(after(swap, toggleList(swap, "ordered")), "«1. 하나\n2. 둘»")

  const cursor = at("앞\n하«»나")
  assert.equal(after(cursor, toggleList(cursor, "bullet")), "앞\n- 하«»나")

  const empty = at("«»")
  assert.equal(after(empty, toggleList(empty, "bullet")), "- «»")
})

test("Enter: 목록 줄이면 다음 줄에 표시를 잇는다", () => {
  const bullet = at("- 하나«»")
  assert.equal(after(bullet, continueList(bullet)), "- 하나\n- «»")

  const ordered = at("  9) 아홉«»")
  assert.equal(after(ordered, continueList(ordered)), "  9) 아홉\n  10) «»")

  const task = at("- [x] 끝낸 일«»")
  assert.equal(after(task, continueList(task)), "- [x] 끝낸 일\n- [ ] «»")
})

test("Enter: 빈 항목이면 표시를 지워 목록을 끝낸다", () => {
  const empty = at("- 하나\n- «»")
  assert.equal(after(empty, continueList(empty)), "- 하나\n«»")
})

test("Enter: 목록이 아니거나 날짜로 시작한 줄, 표시 앞의 커서, 고른 범위는 칸에 맡긴다", () => {
  assert.equal(continueList(at("그냥 글«»")), null)
  assert.equal(continueList(at("2026. 10. 26. 에 했다«»")), null)
  assert.equal(continueList(at("«»- 하나")), null)
  assert.equal(continueList(at("- «하나»")), null)
})
