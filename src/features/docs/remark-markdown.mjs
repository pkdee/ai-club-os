// Docs 의 .mdx 를 빌드할 때 "마크다운으로 복사" 에 쓸 Markdown 을 만들어 `export const markdown` 으로 내보낸다.
// 원문을 그대로 살리고 MDX 에만 있는 것만 바꾼다. Callout 은 GitHub 의 알림 인용으로 바꾸고, import 와 {} 식은 뺀다.
// 상대 경로 링크는 Club 주소를 알아야 풀 수 있어서 { href } 로 따로 두고, 복사할 때 브라우저가 전체 주소로 바꾼다.
// next.config.ts 가 이 파일의 경로로 불러온다. 내보내는 값의 형식은 markdown.ts 의 MarkdownPart 와 같다.

import { exportConst } from "./esm-export.mjs"

// Callout 의 tone 에 맞는 GitHub 알림의 종류.
const ALERT = { info: "NOTE", success: "TIP", warning: "WARNING", danger: "CAUTION" }

// 앱 안의 다른 화면이나 다른 문서로 가는 링크. DocLink 가 앱 안의 이동으로 다루는 것과 같다.
const RELATIVE_HREF = /^(\/|\.\/|\.\.\/)/

// 조각들을 하나의 배열로 잇는다. 이웃한 글은 하나로 합치고 빈 글은 버린다.
function join(...lists) {
  const parts = []
  for (const part of lists.flat(Infinity)) {
    if (typeof part !== "string") {
      parts.push(part)
    } else if (part && typeof parts.at(-1) === "string") {
      parts[parts.length - 1] += part
    } else if (part) {
      parts.push(part)
    }
  }
  return parts
}

function mapText(parts, fn) {
  return parts.map((part) => (typeof part === "string" ? fn(part) : part))
}

function attribute(node, name) {
  const found = node.attributes?.find(
    (item) => item.type === "mdxJsxAttribute" && item.name === name
  )
  return typeof found?.value === "string" ? found.value : undefined
}

function located(node) {
  return (node.children ?? []).filter((child) => child.position)
}

// 줄 하나를 통째로 차지하다가 빠지는 것. import, export 와 {/* 주석 */} 같은 식이다.
const REMOVED_LINES = new Set(["mdxjsEsm", "mdxFlowExpression"])

// 원문의 start 부터 end 까지. 그 안의 자식은 convert 로 바꿔 넣는다.
function slice(source, node, start, end) {
  const parts = []
  let cursor = start
  for (const child of located(node)) {
    parts.push(source.slice(cursor, child.position.start.offset), convert(source, child))
    cursor = child.position.end.offset
    if (REMOVED_LINES.has(child.type)) {
      // 빠진 줄 뒤의 빈 줄도 함께 빼서 빈 줄이 겹치지 않게 한다.
      cursor += /^(?:[ \t]*\n)*/.exec(source.slice(cursor, end))[0].length
    }
  }
  parts.push(source.slice(cursor, end))
  return join(parts)
}

// 여는 태그와 닫는 태그를 뺀 자식들만.
function inner(source, node) {
  const children = located(node)
  if (children.length === 0) {
    return []
  }
  return slice(
    source,
    node,
    children[0].position.start.offset,
    children.at(-1).position.end.offset
  )
}

// <Callout tone="warning" title="제목">본문</Callout> 을 GitHub 의 알림 인용으로 바꾼다.
// 알림을 모르는 곳에서도 제목이 굵은 글씨인 인용으로 읽힌다.
function callout(source, node) {
  const tone = attribute(node, "tone") ?? "info"
  const title = attribute(node, "title")
  // JSX 안의 본문은 들여 쓰는 일이 많다. 첫 자식의 들여쓰기만큼 줄 앞의 빈칸을 덜어 낸다.
  const indent = (located(node)[0]?.position.start.column ?? 1) - 1
  const dedent = new RegExp(`\\n {0,${indent}}`, "g")
  const body = mapText(inner(source, node), (text) => text.replace(dedent, "\n"))
  const head = `[!${ALERT[tone] ?? ALERT.info}]\n${title ? `**${title}**\n\n` : ""}`

  // 모든 줄 앞에 > 를 붙이고, 빈 줄에는 > 만 둔다.
  return mapText(
    join("> ", mapText(join(head, body), (text) => text.replace(/\n/g, "\n> "))),
    (text) => text.replace(/(^|\n)> (?=\n)/g, "$1>")
  )
}

function convert(source, node) {
  switch (node.type) {
    case "mdxjsEsm":
    case "mdxFlowExpression":
    case "mdxTextExpression":
      return []
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement":
      if (node.name === "Callout") {
        return callout(source, node)
      }
      // details 처럼 소문자로 시작하는 HTML 태그는 Markdown 에서도 쓰이므로 그대로 둔다.
      // 다른 컴포넌트는 Markdown 으로 옮길 수 없어서 감싼 내용만 남긴다.
      if (node.name && /^[a-z]/.test(node.name)) {
        break
      }
      return inner(source, node)
    case "link":
      if (RELATIVE_HREF.test(node.url)) {
        return join("[", inner(source, node), "](", { href: node.url }, ")")
      }
      break
  }
  return slice(source, node, node.position.start.offset, node.position.end.offset)
}

// 문서를 start 부터 Markdown 조각으로 바꾼다. 글과 { href } 가 섞인 배열이다.
// start 앞의 frontmatter 와 맨 앞의 # 제목은 빼고, 복사할 때 docMarkdown 이 제목과 소개를 맨 앞에 넣는다.
export function markdownParts(tree, source, start = 0) {
  const parts = slice(source, tree, start, source.length)
  // 맨 앞의 import 를 뺀 자리처럼 앞뒤에 남는 빈 줄을 덜어 낸다.
  if (typeof parts[0] === "string") {
    parts[0] = parts[0].trimStart()
  }
  if (typeof parts.at(-1) === "string") {
    parts[parts.length - 1] = parts.at(-1).trimEnd()
  }
  return join(parts)
}

export default function remarkMarkdown() {
  return (tree, file) => {
    // 본문이 시작하는 곳. 앞서 도는 remark-front-matter.mjs 가 적어 둔다.
    const start = file.data.docBodyStart ?? 0
    tree.children.unshift(
      exportConst("markdown", markdownParts(tree, String(file), start))
    )
  }
}
