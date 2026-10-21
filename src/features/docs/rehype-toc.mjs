// Docs 의 .mdx 를 빌드할 때 h2, h3 로 목차를 만들어 `export const toc` 로 내보낸다.
// rehype-slug 가 붙인 id 를 쓰므로 그 뒤에 둔다. next.config.ts 가 이 파일의 경로로 불러온다.
// Turbopack 의 로더가 Node 에서 바로 불러오므로 TypeScript 가 아닌 .mjs 로 쓴다.
// 목차의 한 줄은 { id, text, depth } 이고 depth 는 2 나 3 이다. 형식은 catalog.ts 의 DocHeading 과 같다.

import { exportConst } from "./esm-export.mjs"

// 요소 안의 글자를 이어 붙인다.
function textOf(node) {
  if (node.type === "text") {
    return node.value
  }
  return (node.children ?? []).map(textOf).join("")
}

// 문서에 나온 차례대로 h2, h3 를 모은다. id 나 글자가 없는 제목은 갈 곳이 없어 뺀다.
export function headingsOf(tree) {
  const headings = []

  function visit(node) {
    if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
      const id = node.properties?.id
      const text = textOf(node).trim()
      if (typeof id === "string" && id && text) {
        headings.push({ id, text, depth: node.tagName === "h2" ? 2 : 3 })
      }
      return
    }
    for (const child of node.children ?? []) {
      visit(child)
    }
  }

  visit(tree)
  return headings
}

export default function rehypeToc() {
  return (tree) => {
    tree.children.unshift(exportConst("toc", headingsOf(tree)))
  }
}
