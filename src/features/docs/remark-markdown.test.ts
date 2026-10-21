import assert from "node:assert/strict"
import { test } from "node:test"

import { evaluate } from "@mdx-js/mdx"
import * as runtime from "react/jsx-runtime"
import remarkGfm from "remark-gfm"

import type { MarkdownPart } from "./markdown"
import remarkMarkdown from "./remark-markdown.mjs"

// @mdx-js/loader 와 같은 컴파일러로 MDX 를 모듈까지 만들고, 내보낸 markdown 을 읽는다.
async function markdownOf(source: string): Promise<MarkdownPart[]> {
  const mod = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkMarkdown],
  })
  return mod.markdown as MarkdownPart[]
}

test("Markdown 으로 쓴 부분은 원문 그대로 둔다", async () => {
  const source = [
    "# 시작하기",
    "",
    "| 단계 | 뜻 |",
    "| --- | --- |",
    "| **Activity** | 기록 |",
    "",
    "- [ ] 첫 AI Log 쓰기",
    "",
    "```md",
    '<Callout tone="info">코드 안은 바꾸지 않는다</Callout> [링크](../x)',
    "```",
  ].join("\n")

  assert.deepEqual(await markdownOf(`${source}\n`), [source])
})

test("Callout 을 GitHub 의 알림 인용으로 바꾼다", async () => {
  const source = [
    '<Callout tone="warning" title="조심할 것">',
    "  첫 문단입니다.",
    "",
    "  둘째 문단에 [AI Log 쓰기](../logs/new) 가 있습니다.",
    "</Callout>",
    "",
    "<Callout>",
    "제목 없는 안내",
    "</Callout>",
    "",
  ].join("\n")

  assert.deepEqual(await markdownOf(source), [
    [
      "> [!WARNING]",
      "> **조심할 것**",
      ">",
      "> 첫 문단입니다.",
      ">",
      "> 둘째 문단에 [AI Log 쓰기](",
    ].join("\n"),
    { href: "../logs/new" },
    ") 가 있습니다.\n\n> [!NOTE]\n> 제목 없는 안내",
  ])
})

test("앱 안으로 가는 링크만 따로 두고 바깥 주소와 제목 링크는 그대로 둔다", async () => {
  const source =
    "[가](../sessions), [나](./other), [다](/clubs), [라](https://nextjs.org/docs), [마](#제목)\n"

  assert.deepEqual(await markdownOf(source), [
    "[가](",
    { href: "../sessions" },
    "), [나](",
    { href: "./other" },
    "), [다](",
    { href: "/clubs" },
    "), [라](https://nextjs.org/docs), [마](#제목)",
  ])
})

test("export 와 식은 빼고, HTML 태그는 두고, 다른 컴포넌트는 감싼 내용만 남긴다", async () => {
  const source = [
    "export const meta = 1",
    "",
    "앞 {1 + 1} 뒤",
    "",
    "{/* 주석 */}",
    "",
    "<details>",
    "  <summary>예시</summary>",
    "",
    "  내용",
    "</details>",
    "",
    "<Wrapper>",
    "감싼 글",
    "</Wrapper>",
    "",
  ].join("\n")

  assert.deepEqual(await markdownOf(source), [
    [
      "앞  뒤",
      "",
      "<details>",
      "  <summary>예시</summary>",
      "",
      "  내용",
      "</details>",
      "",
      "감싼 글",
    ].join("\n"),
  ])
})
