import assert from "node:assert/strict"
import { test } from "node:test"

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import Markdown from "react-markdown"

import {
  hasLanguageFence,
  isWebImage,
  markdownOptions,
  PLAIN_TEXT_OPTIONS,
} from "./markdown"

function html(markdown: string) {
  return renderToStaticMarkup(
    createElement(Markdown, { ...markdownOptions("t-") }, markdown)
  )
}

function plain(markdown: string) {
  return renderToStaticMarkup(
    createElement(Markdown, PLAIN_TEXT_OPTIONS, markdown)
  ).replace(/\s+/g, " ")
}

test("한 줄을 바꾼 것도 줄바꿈으로 그린다", () => {
  assert.equal(html("첫 줄\n둘째 줄"), "<p>첫 줄<br/>\n둘째 줄</p>")
})

test("HTML 은 그리지 않고 적은 글자 그대로 보인다", () => {
  const out = html('<img src=x onerror="alert(1)"> 와 <b>굵게</b>')
  assert.ok(!out.includes("<img"))
  assert.ok(!out.includes("<b>"))
  assert.ok(out.includes("&lt;b&gt;굵게&lt;/b&gt;"))
})

test("안전하지 않은 주소의 링크는 주소를 비운다", () => {
  const out = html("[누르기](javascript:alert(1)) [문서](https://example.com)")
  assert.ok(!out.includes("javascript:"))
  assert.ok(out.includes('href="https://example.com"'))
})

test("GFM 의 표, 할 일 목록, 주소 자동 링크를 읽는다", () => {
  assert.ok(html("| a | b |\n| - | - |\n| 1 | 2 |").includes("<table>"))
  assert.ok(html("- [x] 끝낸 일").includes('type="checkbox"'))
  assert.ok(
    html("https://example.com 을 봤다").includes('href="https://example.com"')
  )
})

test("물결표 하나는 취소선으로 읽지 않는다", () => {
  assert.equal(html("1~2시간, 3~4번"), "<p>1~2시간, 3~4번</p>")
  assert.ok(html("~~지운 글~~").includes("<del>지운 글</del>"))
})

test("언어를 적지 않은 코드 블록에 language-text 를 붙이고, 적은 언어는 그대로 둔다", () => {
  assert.ok(html("```\nprint(1)\n```").includes('<code class="language-text">'))
  assert.ok(
    html("```python\nprint(1)\n```").includes('<code class="language-python">')
  )
  assert.ok(html("글 사이의 `code`").includes("<code>code</code>"))
})

test("각주의 id 앞에 받은 이름을 붙인다", () => {
  const out = html("본문[^1]\n\n[^1]: 각주")
  assert.ok(out.includes('id="t-fn-1"'))
  assert.ok(out.includes("각주"))
})

test("글만 남길 때는 서식을 벗기고 줄 사이를 빈칸으로 둔다", () => {
  assert.equal(
    plain("# 제목\n\n- **하나**\n- `둘`\n\n첫 줄\n둘째 줄").trim(),
    "제목 하나 둘 첫 줄 둘째 줄"
  )
  assert.equal(plain("<b>굵게</b>").trim(), "&lt;b&gt;굵게&lt;/b&gt;")
})

test("바깥 이미지는 http, https 주소만 불러온다", () => {
  assert.equal(isWebImage("https://example.com/a.png"), true)
  assert.equal(isWebImage("HTTP://example.com/a.png"), true)
  assert.equal(isWebImage("/clubs/1/logo/a.png"), false)
  assert.equal(isWebImage(""), false)
  assert.equal(isWebImage(undefined), false)
})

test("언어를 적은 코드 블록이 있을 때만 색을 입힌다", () => {
  assert.equal(hasLanguageFence("```python\nprint(1)\n```"), true)
  assert.equal(hasLanguageFence("글\n   ~~~ts\nlet a\n~~~"), true)
  assert.equal(hasLanguageFence("```\nprint(1)\n```"), false)
  assert.equal(hasLanguageFence("글 사이의 ```코드```"), false)
  assert.equal(hasLanguageFence("    들여 쓴 코드"), false)
})
