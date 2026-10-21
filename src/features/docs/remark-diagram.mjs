// Docs 의 ```mermaid 코드 블록을 빌드할 때 흐름도 그림으로 바꾼다. 읽는 글의 모양은 diagram.mjs, 자리는 diagram-layout.mjs 에 있다.
// 코드 블록 자리에 <Diagram layout={...} /> 를 두고, 화면의 Diagram 컴포넌트가 이 자리대로 SVG 를 그린다.
// "마크다운으로 복사" 는 remark-markdown.mjs 가 원문에서 만들어 코드 블록이 그대로 남는다. 그래서 이 플러그인은 그보다 뒤에 둔다.
// 그림을 그릴 수 없으면 빌드를 멈추고 까닭을 알린다. next.config.ts 가 이 파일의 경로로 불러온다.

import { layoutDiagram } from "./diagram-layout.mjs"
import { parseDiagram } from "./diagram.mjs"
import { expressionAttribute } from "./esm-export.mjs"

function replace(parent, file) {
  parent.children = parent.children.map((node) => {
    if (node.type === "code" && node.lang === "mermaid") {
      let layout
      try {
        layout = layoutDiagram(parseDiagram(node.value))
      } catch (error) {
        file.fail(error.message, node)
      }
      return {
        type: "mdxJsxFlowElement",
        name: "Diagram",
        attributes: [expressionAttribute("layout", layout)],
        children: [],
      }
    }
    if (Array.isArray(node.children)) {
      replace(node, file)
    }
    return node
  })
}

export default function remarkDiagram() {
  return (tree, file) => {
    replace(tree, file)
  }
}
