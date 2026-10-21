// Docs 의 .mdx 맨 앞의 frontmatter 를 읽어 `export const frontmatter` 로 내보낸다. 값의 규칙은 front-matter.mjs 에 있다.
// MDX 는 frontmatter 를 몰라서 그대로 두면 가로줄과 ## 제목으로 읽고, 값에 { 나 < 가 있으면 읽다가 멈춘다.
// 그래서 MDX 가 원문을 읽기 전에 frontmatter 를 같은 길이의 빈칸으로 바꾼다. 위치가 그대로라 원문을 쓰는 remark-markdown.mjs 와 어긋나지 않는다.
// 제목은 frontmatter 의 title 이고 화면이 머리말에 그린다. 본문 맨 앞의 # 제목은 그 제목을 다시 적은 것으로 보고 뺀다.
// npm 의 remark-frontmatter 가 아니라 이 저장소의 플러그인이다. next.config.ts 가 이 파일의 경로로 불러온다.

import { exportConst } from "./esm-export.mjs"
import { blankFrontMatter, docMeta, frontMatter } from "./front-matter.mjs"

function plainText(node) {
  if (typeof node.value === "string") {
    return node.value
  }
  return (node.children ?? []).map(plainText).join("")
}

function findTitle(node) {
  if (node.type === "heading" && node.depth === 1) {
    return node
  }
  for (const child of node.children ?? []) {
    const found = findTitle(child)
    if (found) {
      return found
    }
  }
  return null
}

// remark-parse 가 먼저 붙인 parser 를 감싼다. 원문(file)은 그대로 두고 MDX 가 읽는 글만 바꾼다.
// this 에 바로 값을 넣으면 TypeScript 가 플러그인을 클래스로 읽어서, processor 를 받아 바꾸는 함수로 둔다.
function blankBeforeParse(processor) {
  const parse = processor.parser
  processor.parser = (doc, file) => parse(blankFrontMatter(doc), file)
}

export default function remarkFrontMatter() {
  blankBeforeParse(this)

  return (tree, file) => {
    const source = String(file)
    let meta
    try {
      meta = docMeta(source)
    } catch (error) {
      file.fail(error.message)
    }
    // 본문이 시작하는 곳. remark-markdown.mjs 가 복사할 Markdown 을 여기서부터 만든다.
    file.data.docBodyStart = frontMatter(source).end

    // 본문 맨 앞의 # 제목은 머리말과 겹쳐 보이므로 뺀다. 글이 title 과 다르면 어느 쪽이 맞는지 몰라 빌드를 멈춘다.
    const index = tree.children.findIndex((node) => node.type !== "mdxjsEsm")
    const lead = tree.children[index]
    if (lead?.type === "heading" && lead.depth === 1) {
      const text = plainText(lead).trim()
      if (text !== meta.title) {
        file.fail(
          `본문 첫 # 제목(${text})이 frontmatter 의 title(${meta.title})과 다릅니다. 둘을 같게 하거나 # 줄을 지웁니다.`,
          lead
        )
      }
      tree.children.splice(index, 1)
      file.data.docBodyStart = lead.position.end.offset
    }
    const other = findTitle(tree)
    if (other) {
      file.fail(
        "# 제목은 본문 맨 앞에만 둡니다. 절의 제목은 ## 부터 씁니다.",
        other
      )
    }

    tree.children.unshift(exportConst("frontmatter", meta))
  }
}
