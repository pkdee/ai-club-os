// Docs 의 흐름도 글을 읽는다. 문서에 ```mermaid 코드 블록으로 쓰고, 빌드할 때 remark-diagram.mjs 가 그림으로 바꾼다.
// Mermaid 의 flowchart 가운데 일부만 받는다. 받는 글은 Mermaid 로도 그대로 그려지므로 "마크다운으로 복사" 한 곳에서도 그림이 된다.
//
//   flowchart LR                       방향. LR(왼쪽에서 오른쪽) 이나 TD(위에서 아래)
//   client[클라이언트] --> gw[gateway]   상자와 화살표. 상자는 처음 나올 때 [글] 을 붙인다
//   gw -->|테스트 결제| test["결제 서버 (test)"]   화살표 글. 괄호 같은 기호가 든 글은 따옴표로 감싼다
//   a -- 글 --> b                      화살표 글을 이렇게 써도 된다
//   a --> b --> c                      한 줄에 이어 쓴다
//   subgraph same [같은 코드 베이스]     묶음. 안에는 상자만 한 줄에 하나씩 적는다
//     test
//   end
//   %% 설명                             읽지 않는 줄
//
// 상자의 글은 <br> 로 줄을 나눌 수 있다. 화살표는 상자나 묶음을 잇는다.

const HEADER = /^(?:flowchart|graph)\s+(LR|TD|TB)\s*;?$/
const ID = /[A-Za-z_][A-Za-z0-9_]*/y
const SHAPE = /\[\s*(?:"([^"]*)"|([^\]"]*))\s*\]/y
const EDGE = /\s*(?:-->\s*\|([^|]*)\|\s*|--\s+([^\s-][^>]*?)\s+-->\s*|-->\s*)/y
const SUBGRAPH =
  /^subgraph\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[\s*(?:"([^"]*)"|([^\]"]*))\s*\])?\s*$/

/**
 * @typedef {{ id: string, lines: string[] }} DiagramNode
 * @typedef {{ from: string, to: string, label: string | null }} DiagramEdge
 * @typedef {{ id: string, title: string, nodes: string[] }} DiagramGroup
 * @typedef {{ direction: "LR" | "TD", nodes: DiagramNode[], edges: DiagramEdge[], groups: DiagramGroup[] }} Diagram
 */

function labelLines(label, where) {
  const parts = label
    .split(/<br\s*\/?>/i)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) {
    throw new Error(`${where}: 상자의 글이 비어 있습니다.`)
  }
  return parts
}

// 흐름도 글을 상자, 화살표, 묶음으로 나눈다. 받지 않는 모양이 있으면 몇 번째 줄인지 담아 Error 를 던진다.
/** @param {string} source @returns {Diagram} */
export function parseDiagram(source) {
  /** @type {"LR" | "TD" | null} */
  let direction = null
  /** @type {Map<string, { id: string, lines: string[], labeled: boolean }>} */
  const nodes = new Map()
  /** @type {DiagramEdge[]} */
  const edges = []
  /** @type {DiagramGroup[]} */
  const groups = []
  /** @type {Map<string, string>} */
  const groupOf = new Map()
  /** @type {DiagramGroup | null} */
  let open = null

  // 상자 하나를 읽고 다음 위치를 돌려준다. [글] 이 한 번도 없던 상자는 id 를 글로 쓴다.
  const readNode = (line, start, where) => {
    ID.lastIndex = start
    const id = ID.exec(line)?.[0]
    if (!id) {
      throw new Error(
        `${where}: 상자의 id 가 있어야 할 자리입니다. id 는 영어, 숫자, _ 로 씁니다.`
      )
    }
    let cursor = ID.lastIndex
    SHAPE.lastIndex = cursor
    const shape = SHAPE.exec(line)
    let label = null
    if (shape) {
      label = labelLines(shape[1] ?? shape[2] ?? "", where)
      cursor = SHAPE.lastIndex
    } else if ("[({".includes(line[cursor] ?? " ")) {
      throw new Error(`${where}: 상자는 id[글] 이나 id["글"] 모양으로만 씁니다.`)
    }
    const known = nodes.get(id)
    if (label && known?.labeled && known.lines.join("\n") !== label.join("\n")) {
      throw new Error(`${where}: 상자 ${id} 에 다른 글을 두 번 적었습니다.`)
    }
    if (!known) {
      nodes.set(id, { id, lines: label ?? [id], labeled: Boolean(label) })
    } else if (label) {
      known.lines = label
      known.labeled = true
    }
    return { id, cursor }
  }

  source.split(/\r?\n/).forEach((raw, index) => {
    const where = `그림의 ${index + 1}번째 줄`
    const line = raw.trim()
    if (!line || line.startsWith("%%")) {
      return
    }
    if (!direction) {
      const header = HEADER.exec(line)
      if (!header) {
        throw new Error(`${where}: 첫 줄은 flowchart LR 이나 flowchart TD 로 씁니다.`)
      }
      direction = header[1] === "LR" ? "LR" : "TD"
      return
    }
    const subgraph = SUBGRAPH.exec(line)
    if (subgraph) {
      if (open) {
        throw new Error(`${where}: 묶음 안에 묶음을 둘 수 없습니다.`)
      }
      const [, id, quoted, plain] = subgraph
      if (groups.some((group) => group.id === id)) {
        throw new Error(`${where}: 묶음 ${id} 를 두 번 만들었습니다.`)
      }
      open = { id, title: (quoted ?? plain ?? "").trim() || id, nodes: [] }
      groups.push(open)
      return
    }
    if (line === "end") {
      if (!open) {
        throw new Error(`${where}: 열지 않은 묶음을 end 로 닫았습니다.`)
      }
      if (open.nodes.length === 0) {
        throw new Error(`${where}: 묶음 ${open.id} 안에 상자가 없습니다.`)
      }
      open = null
      return
    }

    const statement = line.replace(/;$/, "")
    let { id, cursor } = readNode(statement, 0, where)
    if (open) {
      if (cursor !== statement.length) {
        throw new Error(
          `${where}: 묶음 안에는 상자만 한 줄에 하나씩 적습니다. 화살표는 end 다음에 적습니다.`
        )
      }
      if (groupOf.has(id)) {
        throw new Error(`${where}: 상자 ${id} 는 이미 묶음 ${groupOf.get(id)} 안에 있습니다.`)
      }
      groupOf.set(id, open.id)
      open.nodes.push(id)
      return
    }
    while (cursor < statement.length) {
      EDGE.lastIndex = cursor
      const edge = EDGE.exec(statement)
      if (!edge) {
        throw new Error(`${where}: 화살표는 --> 나 -->|글| 로 씁니다.`)
      }
      const label = (edge[1] ?? edge[2] ?? "").trim() || null
      const next = readNode(statement, EDGE.lastIndex, where)
      edges.push({ from: id, to: next.id, label })
      id = next.id
      cursor = next.cursor
    }
  })

  if (!direction) {
    throw new Error("그림이 비어 있습니다. 첫 줄에 flowchart LR 이나 flowchart TD 를 씁니다.")
  }
  if (open) {
    throw new Error(`묶음 ${open.id} 를 end 로 닫지 않았습니다.`)
  }

  // 묶음의 id 로 이은 화살표는 상자가 아니라 묶음을 가리킨다.
  for (const group of groups) {
    if (nodes.get(group.id)?.labeled || groupOf.has(group.id)) {
      throw new Error(`${group.id} 는 묶음의 id 라서 상자로 쓸 수 없습니다.`)
    }
    nodes.delete(group.id)
  }
  for (const edge of edges) {
    if (edge.from === edge.to) {
      throw new Error(`${edge.from} 에서 자기 자신으로 가는 화살표는 그릴 수 없습니다.`)
    }
  }

  return {
    direction,
    nodes: [...nodes.values()].map(({ id, lines }) => ({ id, lines })),
    edges,
    groups,
  }
}
