import assert from "node:assert/strict"
import { test } from "node:test"

import rehypeToc, { headingsOf } from "./rehype-toc.mjs"

type Node = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: Node[]
  data?: unknown
}

// 시험에서 읽는 만큼만 적은 estree 의 모양.
type TocProgram = {
  body: Array<{
    type: string
    declaration: {
      declarations: Array<{
        id: { name: string }
        init: {
          elements: Array<{
            properties: Array<{ key: { name: string }; value: { value: unknown } }>
          }>
        }
      }>
    }
  }>
}

const text = (value: string): Node => ({ type: "text", value })
const element = (
  tagName: string,
  children: Node[],
  id?: string
): Node => ({
  type: "element",
  tagName,
  properties: id ? { id } : {},
  children,
})

function sampleTree(): Node {
  return {
    type: "root",
    children: [
      element("p", [text("들어가는 글")]),
      element("h2", [text("첫 "), element("code", [text("AI Log")])], "첫-ai-log"),
      element("div", [element("h3", [text("안쪽 제목")], "안쪽-제목")]),
      element("h2", [text("id 없는 제목")]),
      element("h3", [text("  ")], "빈-제목"),
      element("h4", [text("넷째 단계")], "넷째-단계"),
    ],
  }
}

test("h2, h3 를 문서에 나온 차례대로 모은다", () => {
  assert.deepEqual(headingsOf(sampleTree()), [
    { id: "첫-ai-log", text: "첫 AI Log", depth: 2 },
    { id: "안쪽-제목", text: "안쪽 제목", depth: 3 },
  ])
})

test("목차를 문서 맨 앞의 export 로 넣는다", () => {
  const tree = sampleTree()
  rehypeToc()(tree)

  const [first] = tree.children ?? []
  assert.equal(first.type, "mdxjsEsm")
  const program = (first.data as { estree: TocProgram }).estree
  const declaration = program.body[0].declaration.declarations[0]
  assert.equal(program.body[0].type, "ExportNamedDeclaration")
  assert.equal(declaration.id.name, "toc")
  assert.deepEqual(
    declaration.init.elements.map((item) =>
      Object.fromEntries(item.properties.map((property) => [property.key.name, property.value.value]))
    ),
    headingsOf(sampleTree())
  )
})
