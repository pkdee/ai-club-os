import assert from "node:assert/strict"
import { test } from "node:test"

import { evaluate } from "@mdx-js/mdx"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import * as runtime from "react/jsx-runtime"
import remarkGfm from "remark-gfm"

import { layoutDiagram, type DiagramLayout } from "./diagram-layout.mjs"
import { parseDiagram } from "./diagram.mjs"
import type { MarkdownPart } from "./markdown"
import remarkDiagram from "./remark-diagram.mjs"
import remarkFrontMatter from "./remark-front-matter.mjs"
import remarkMarkdown from "./remark-markdown.mjs"

// 사용자가 보여 준 예시 그림을 글로 옮긴 것.
const payment = [
  "flowchart LR",
  "  client[클라이언트] --> gw[gateway]",
  "  gw -->|테스트 결제| test[\"결제 서버 (test)\"]",
  "  gw -- 라이브 결제 --> live[\"결제 서버 (live)\"]",
  "  test --> mock[mock-원천사]",
  "  live --> origin[원천사]",
  "  %% 같은 코드로 두 서버를 띄운다",
  "  subgraph same [같은 코드 베이스]",
  "    test",
  "    live",
  "  end",
].join("\n")

type Box = { x: number; y: number; w: number; h: number }

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const inside = (inner: Box, outer: Box) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.w <= outer.x + outer.w &&
  inner.y + inner.h <= outer.y + outer.h
const center = (box: Box) => box.y + box.h / 2

test("상자, 화살표 글, 묶음을 읽는다", () => {
  assert.deepEqual(parseDiagram(payment), {
    direction: "LR",
    nodes: [
      { id: "client", lines: ["클라이언트"] },
      { id: "gw", lines: ["gateway"] },
      { id: "test", lines: ["결제 서버 (test)"] },
      { id: "live", lines: ["결제 서버 (live)"] },
      { id: "mock", lines: ["mock-원천사"] },
      { id: "origin", lines: ["원천사"] },
    ],
    edges: [
      { from: "client", to: "gw", label: null },
      { from: "gw", to: "test", label: "테스트 결제" },
      { from: "gw", to: "live", label: "라이브 결제" },
      { from: "test", to: "mock", label: null },
      { from: "live", to: "origin", label: null },
    ],
    groups: [{ id: "same", title: "같은 코드 베이스", nodes: ["test", "live"] }],
  })
})

test("한 줄에 이어 쓴 화살표, <br> 로 나눈 글, 묶음으로 가는 화살표를 읽는다", () => {
  const diagram = parseDiagram(
    [
      "graph TD",
      "  a[첫째<br>둘째] --> b --> c[셋째]",
      "  subgraph g [묶음]",
      "    c",
      "  end",
      "  a --> g",
    ].join("\n")
  )
  assert.equal(diagram.direction, "TD")
  assert.deepEqual(diagram.nodes.map((node) => node.lines), [["첫째", "둘째"], ["b"], ["셋째"]])
  assert.deepEqual(
    diagram.edges.map((edge) => `${edge.from}>${edge.to}`),
    ["a>b", "b>c", "a>g"]
  )
})

test("받지 않는 모양은 몇 번째 줄인지 알린다", () => {
  assert.throws(() => parseDiagram("sequenceDiagram"), /1번째 줄.*flowchart/)
  assert.throws(() => parseDiagram("flowchart LR\n  a((동그라미))"), /2번째 줄.*id\[글\]/)
  assert.throws(() => parseDiagram("flowchart LR\n  a --- b"), /2번째 줄.*-->/)
  assert.throws(() => parseDiagram("flowchart LR\n  a[가] --> b\n  a[나]"), /3번째 줄.*두 번/)
  assert.throws(() => parseDiagram("flowchart LR\n  subgraph g\n  a --> b\n  end"), /3번째 줄.*상자만/)
  assert.throws(() => parseDiagram("flowchart LR\n  subgraph g\n  a\n"), /end 로 닫지/)
  assert.throws(() => parseDiagram("flowchart LR\n  a --> a"), /자기 자신/)
  assert.throws(() => parseDiagram(""), /비어 있습니다/)
})

test("사진의 예를 사진처럼 놓는다", () => {
  const layout = layoutDiagram(parseDiagram(payment))
  const [client, gw, testServer, liveServer, mock, origin] = layout.nodes
  const [group] = layout.groups

  // 왼쪽에서 오른쪽으로 네 칸이다.
  assert.ok(client.x < gw.x && gw.x < testServer.x && testServer.x < mock.x)
  assert.equal(testServer.x, liveServer.x)
  assert.equal(mock.x, origin.x)
  // 같은 칸의 상자는 너비가 같고, 묶음 안의 상자와 옆 칸의 상자는 줄이 맞는다.
  assert.equal(testServer.w, liveServer.w)
  assert.equal(center(testServer), center(mock))
  assert.equal(center(liveServer), center(origin))
  // 앞의 두 상자는 두 줄의 가운데에 놓인다.
  assert.equal(center(client), center(gw))
  assert.equal(center(gw), (center(testServer) + center(liveServer)) / 2)
  // 묶음은 두 상자를 감싸고 제목은 묶음 위쪽에 있다.
  assert.ok(inside(testServer, group) && inside(liveServer, group))
  assert.ok(group.title.y < testServer.y)
  assert.equal(group.title.text, "같은 코드 베이스")
  // 화살표 글은 갈라지는 상자보다 오른쪽, 묶음보다 왼쪽에 있다.
  const labels = layout.edges.flatMap((edge) => (edge.label ? [edge.label] : []))
  assert.deepEqual(labels.map((label) => label.text), ["테스트 결제", "라이브 결제"])
  for (const label of labels) {
    assert.ok(label.x > gw.x + gw.w && label.x < group.x)
  }
})

function assertTidy(layout: DiagramLayout) {
  const boxes = layout.nodes
  boxes.forEach((a, i) =>
    boxes.slice(i + 1).forEach((b) => assert.ok(!overlaps(a, b), "상자가 겹치지 않는다"))
  )
  for (const box of [...boxes, ...layout.groups]) {
    assert.ok(box.x >= 0 && box.y >= 0, "그림 안에 있다")
    assert.ok(box.x + box.w <= layout.width && box.y + box.h <= layout.height, "그림 안에 있다")
  }
}

test("위에서 아래로 놓고, 거꾸로 가는 화살표는 오른쪽으로 돌아간다", () => {
  const layout = layoutDiagram(
    parseDiagram(
      [
        "flowchart TD",
        "  ask[프롬프트 쓰기] --> ai[AI 답변] --> check[결과 확인]",
        "  check -->|부족하면| ask",
        "  check --> log[AI Log 기록]",
      ].join("\n")
    )
  )
  assertTidy(layout)
  const [ask, ai, check, log] = layout.nodes
  assert.ok(ask.y < ai.y && ai.y < check.y && check.y < log.y)
  assert.equal(new Set(layout.nodes.map((node) => node.w)).size, 1)
  const back = layout.edges[2]
  assert.equal(back.label?.anchor, "start")
  assert.ok((back.label?.x ?? 0) > ask.x + ask.w)
  assert.ok((back.label?.x ?? 0) < layout.width)
})

test("여러 갈래로 나뉘는 상자는 받는 상자들 가운데의 평균에 놓는다", () => {
  const layout = layoutDiagram(
    parseDiagram(
      [
        "flowchart LR",
        "  log[내 AI Log] --> read[읽기]",
        "  log -->|Session| tab[\"Session의<br>AI Log 탭\"]",
        "  log -->|쓰임| insight[AI Insight]",
        "  log -->|발표| present[발표]",
      ].join("\n")
    )
  )
  assertTidy(layout)
  const [log, ...targets] = layout.nodes
  const mean = targets.reduce((sum, target) => sum + center(target), 0) / targets.length
  assert.equal(center(log), mean)
  // 갈라진 상자들은 위에서 아래로 쓴 차례대로 놓인다.
  assert.deepEqual(
    [...targets].sort((a, b) => a.y - b.y),
    targets
  )
})

test("화살표가 다른 상자를 지나가면 그리지 않는다", () => {
  assert.throws(
    () =>
      layoutDiagram(
        parseDiagram(["flowchart LR", "  a --> b --> c", "  a --> c"].join("\n"))
      ),
    /a → c 가 상자 b 를 지나갑니다/
  )
})

test("같은 묶음 안의 상자끼리는 잇지 않는다", () => {
  assert.throws(
    () =>
      layoutDiagram(
        parseDiagram(
          ["flowchart LR", "  subgraph g", "    a", "    b", "  end", "  a --> b"].join("\n")
        )
      ),
    /같은 묶음/
  )
})

// next.config.ts 와 같은 차례로 플러그인을 붙여 모듈까지 만든다. Diagram 은 받은 값을 글로 내보내는 대역이다.
async function compile(body: string) {
  const mod = await evaluate(`---\ntitle: 그림\ndescription: 그림 시험\n---\n\n${body}`, {
    ...runtime,
    remarkPlugins: [remarkFrontMatter, remarkGfm, remarkMarkdown, remarkDiagram],
  })
  const Diagram = ({ layout }: { layout: DiagramLayout }) =>
    createElement("figure", null, layout.description)
  return {
    html: renderToStaticMarkup(createElement(mod.default, { components: { Diagram } })),
    markdown: mod.markdown as MarkdownPart[],
  }
}

test("```mermaid 코드 블록을 그림으로 바꾸고, 복사할 Markdown 에는 코드 블록을 남긴다", async () => {
  const source = "```mermaid\nflowchart LR\n  a[기록] --> b[이해]\n```\n"
  const doc = await compile(`<details>\n  <summary>그림 보기</summary>\n\n${source}\n</details>`)
  assert.match(doc.html, /<figure>흐름도\. 기록 → 이해\.<\/figure>/)
  assert.doesNotMatch(doc.html, /<pre|<code/)
  assert.ok(doc.markdown.join("").includes(source.trim()))
})

test("그릴 수 없는 그림은 빌드를 멈춘다", async () => {
  await assert.rejects(compile("```mermaid\nflowchart LR\n  a --- b\n```\n"), /2번째 줄/)
})
