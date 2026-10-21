import assert from "node:assert/strict"
import { test } from "node:test"

import { evaluate } from "@mdx-js/mdx"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import * as runtime from "react/jsx-runtime"
import remarkGfm from "remark-gfm"

import type { DocMeta } from "./catalog"
import type { MarkdownPart } from "./markdown"
import remarkFrontMatter from "./remark-front-matter.mjs"
import remarkMarkdown from "./remark-markdown.mjs"

// next.config.ts 와 같은 순서로 플러그인을 붙여 모듈까지 만든다.
async function compile(source: string) {
  const mod = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkFrontMatter, remarkGfm, remarkMarkdown],
  })
  return {
    frontmatter: mod.frontmatter as DocMeta,
    markdown: mod.markdown as MarkdownPart[],
    html: renderToStaticMarkup(createElement(mod.default)),
  }
}

const source = [
  "---",
  "title: 2회차 · Prompt {Engineering} <초안>",
  "description: 프롬프트를 다듬는 법",
  "published: 2026-10-21",
  "tags:",
  "  - Prompt",
  "---",
  "",
  "## 첫 절",
  "",
  "[AI Log 쓰기](../logs/new)",
  "",
].join("\n")

test("frontmatter 를 모듈의 frontmatter 로 내보내고 본문에는 그리지 않는다", async () => {
  const doc = await compile(source)
  assert.deepEqual(doc.frontmatter, {
    title: "2회차 · Prompt {Engineering} <초안>",
    description: "프롬프트를 다듬는 법",
    published: "2026-10-21",
    tags: ["Prompt"],
  })
  // MDX 가 frontmatter 를 가로줄과 제목으로 읽지 않았다.
  assert.equal(doc.html, '<h2>첫 절</h2>\n<p><a href="../logs/new">AI Log 쓰기</a></p>')
})

test("복사할 Markdown 에서 frontmatter 를 빼고 본문의 위치는 그대로 쓴다", async () => {
  const doc = await compile(source)
  assert.deepEqual(doc.markdown, [
    "## 첫 절\n\n[AI Log 쓰기](",
    { href: "../logs/new" },
    ")",
  ])
})

test("본문 맨 앞에 title 을 # 제목으로 다시 적으면 화면과 복사할 Markdown 에서 뺀다", async () => {
  const doc = await compile(
    source
      .replace("title: 2회차 · Prompt {Engineering} <초안>", "title: Prompt Engineering 시작하기")
      .replace("## 첫 절", "# Prompt **Engineering** 시작하기\n\n## 첫 절")
  )
  assert.equal(doc.frontmatter.title, "Prompt Engineering 시작하기")
  assert.equal(doc.html, '<h2>첫 절</h2>\n<p><a href="../logs/new">AI Log 쓰기</a></p>')
  assert.equal(doc.markdown[0], "## 첫 절\n\n[AI Log 쓰기](")
})

test("맨 앞의 # 제목이 title 과 다르거나 다른 곳에 # 제목이 있으면 빌드를 멈춘다", async () => {
  await assert.rejects(
    compile(source.replace("## 첫 절", "# 다른 제목\n\n## 첫 절")),
    /# 제목\(다른 제목\)이 frontmatter 의 title/
  )
  await assert.rejects(
    compile(source.replace("[AI Log 쓰기]", "# 가운데 제목\n\n[AI Log 쓰기]")),
    /맨 앞에만 둡니다/
  )
})

test("frontmatter 가 없거나 틀리면 빌드를 멈춘다", async () => {
  await assert.rejects(compile("## 첫 절\n"), /frontmatter 가 없습니다/)
  await assert.rejects(
    compile(source.replace("published: 2026-10-21", "published: 내일")),
    /published\(내일\)/
  )
})
