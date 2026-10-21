// diagram.mjs 가 읽은 흐름도에 자리를 잡아 준다. 빌드할 때 remark-diagram.mjs 가 부르고, 화면은 이 값대로 SVG 를 그린다.
// 상자는 화살표를 따라 칸(LR 은 세로 칸, TD 는 가로 줄)에 놓인다. 칸은 처음 상자에서 가장 긴 길의 길이로 정한다.
// 같은 칸의 상자는 너비(LR)나 높이(TD)를 맞춘다. 칸 안에서는 들어오는 화살표의 상자와 줄이 맞도록 옮긴다.
// 묶음은 한 칸 안의 상자를 감싸고 위에 제목을 둔다.
// 화살표는 상자를 나온 뒤 한 번 꺾여 다음 상자로 들어간다. 거꾸로 가는 화살표는 그림 아래(TD 는 오른쪽)로 돌아간다.
// 화살표가 다른 상자를 지나가게 되면 그릴 수 없으므로 까닭을 담은 Error 를 던진다.
// 글의 자리는 모두 글의 가운데다. 화면은 dominant-baseline 을 central 로 두고 그린다.

/** @typedef {import("./diagram.mjs").Diagram} Diagram */
/**
 * @typedef {{ text: string, x: number, y: number }} DiagramText
 * @typedef {{
 *   width: number,
 *   height: number,
 *   nodes: { x: number, y: number, w: number, h: number, lines: DiagramText[] }[],
 *   groups: { x: number, y: number, w: number, h: number, title: DiagramText }[],
 *   edges: { d: string, head: string, label: (DiagramText & { anchor: "middle" | "start" }) | null }[],
 *   description: string,
 * }} DiagramLayout
 */

// 크기는 px 이다. 화면의 글자 크기와 맞춘다.
export const DIAGRAM_FONT = { node: 14, label: 12, title: 13 }
const NODE_LINE = 20
const NODE_PAD_X = 20
const NODE_PAD_Y = 12
const NODE_MIN_WIDTH = 96
const LABEL_GAP = 6
const GROUP_PAD = 16
const GROUP_HEADER = 40
// 같은 칸에서 상자 사이. 묶음 안과 밖을 같게 두어야 묶음 안의 상자와 옆 칸의 상자가 줄을 맞출 수 있다.
const UNIT_GAP = 20
const RANK_GAP = 56
const ELBOW = 24
const MARGIN = 24
const LANE_GAP = 28
const HEAD = 7
const RADIUS = 6

const WIDE = /[ᄀ-ᇿ⺀-鿿가-힣豈-﫿＀-￯]/

// 글의 너비를 어림한다. 한글은 글자 크기만큼, 영어와 숫자는 그보다 좁게 셈한다. 모자라기보다 넉넉하게 잡는다.
/** @param {string} text @param {number} size */
export function textWidth(text, size) {
  let em = 0
  for (const char of text) {
    if (WIDE.test(char)) {
      em += 1
    } else if (/[A-Z]/.test(char)) {
      em += 0.68
    } else if (/[a-z0-9]/.test(char)) {
      em += 0.58
    } else if (char === " ") {
      em += 0.3
    } else {
      em += 0.42
    }
  }
  return Math.ceil(em * size)
}

const round = (value) => Math.round(value * 2) / 2

// 꺾이는 곳을 둥글린 선.
function pathOf(points) {
  let d = `M ${round(points[0][0])} ${round(points[0][1])}`
  for (let index = 1; index < points.length; index += 1) {
    const [x, y] = points[index]
    const next = points[index + 1]
    if (!next) {
      d += ` L ${round(x)} ${round(y)}`
      continue
    }
    const [px, py] = points[index - 1]
    const inLength = Math.hypot(x - px, y - py)
    const outLength = Math.hypot(next[0] - x, next[1] - y)
    const r = Math.min(RADIUS, inLength / 2, outLength / 2)
    const before = [x - ((x - px) / inLength) * r, y - ((y - py) / inLength) * r]
    const after = [x + ((next[0] - x) / outLength) * r, y + ((next[1] - y) / outLength) * r]
    d += ` L ${round(before[0])} ${round(before[1])} Q ${round(x)} ${round(y)} ${round(after[0])} ${round(after[1])}`
  }
  return d
}

// 선의 끝을 화살촉 밑동까지 줄이고, 화살촉의 세 점을 돌려준다.
function arrow(points) {
  const tip = points[points.length - 1]
  const [px, py] = points[points.length - 2]
  const length = Math.hypot(tip[0] - px, tip[1] - py)
  const dx = (tip[0] - px) / length
  const dy = (tip[1] - py) / length
  const base = [tip[0] - dx * HEAD, tip[1] - dy * HEAD]
  const side = HEAD * 0.6
  const head = [
    tip,
    [base[0] - dy * side, base[1] + dx * side],
    [base[0] + dy * side, base[1] - dx * side],
  ]
    .map(([x, y]) => `${round(x)},${round(y)}`)
    .join(" ")
  return { line: [...points.slice(0, -1), base], head }
}

// 가로나 세로 선분이 상자를 지나가는지 본다. 테두리에 닿기만 하는 것은 지나간 것으로 보지 않는다.
function crosses([ax, ay], [bx, by], box) {
  return (
    Math.max(ax, bx) > box.x + 1 &&
    Math.min(ax, bx) < box.x + box.w - 1 &&
    Math.max(ay, by) > box.y + 1 &&
    Math.min(ay, by) < box.y + box.h - 1
  )
}

/** @param {Diagram} diagram @returns {DiagramLayout} */
export function layoutDiagram(diagram) {
  const lr = diagram.direction === "LR"
  const nodeById = new Map(diagram.nodes.map((node) => [node.id, node]))
  const groupOfNode = new Map()
  for (const group of diagram.groups) {
    for (const id of group.nodes) {
      groupOfNode.set(id, group)
    }
  }

  // 칸에 놓는 단위. 묶이지 않은 상자 하나이거나, 한 묶음의 상자들이다.
  const units = []
  const unitOf = new Map()
  for (const node of diagram.nodes) {
    const group = groupOfNode.get(node.id)
    if (group && unitOf.has(group.id)) {
      continue
    }
    const unit = {
      order: units.length,
      group: group ?? null,
      nodes: group ? group.nodes.map((id) => nodeById.get(id)) : [node],
      rank: 0,
      out: [],
      start: 0,
    }
    units.push(unit)
    for (const member of unit.nodes) {
      unitOf.set(member.id, unit)
    }
    if (group) {
      unitOf.set(group.id, unit)
    }
  }

  const name = (id) =>
    nodeById.get(id)?.lines.join(" ") ??
    diagram.groups.find((group) => group.id === id)?.title ??
    id
  const edges = diagram.edges.map((edge) => {
    const from = unitOf.get(edge.from)
    const to = unitOf.get(edge.to)
    if (from === to) {
      throw new Error(
        `${name(edge.from)} 와 ${name(edge.to)} 는 같은 묶음 안에 있어 화살표로 이을 수 없습니다.`
      )
    }
    const item = { edge, from, to, back: false }
    from.out.push(item)
    return item
  })
  const forward = (item) => !item.back

  // 거꾸로 가는 화살표를 찾는다. 먼저 나온 상자부터 따라가며, 따라가는 중인 상자로 돌아가는 화살표다.
  const state = new Map()
  const visit = (unit) => {
    state.set(unit, "open")
    for (const item of unit.out) {
      if (state.get(item.to) === "open") {
        item.back = true
      } else if (!state.has(item.to)) {
        visit(item.to)
      }
    }
    state.set(unit, "done")
  }
  for (const unit of units) {
    if (!state.has(unit)) {
      visit(unit)
    }
  }

  // 칸: 들어오는 화살표가 없는 상자부터 가장 긴 길의 길이.
  const waiting = new Map(units.map((unit) => [unit, 0]))
  for (const item of edges.filter(forward)) {
    waiting.set(item.to, waiting.get(item.to) + 1)
  }
  const queue = units.filter((unit) => waiting.get(unit) === 0)
  while (queue.length > 0) {
    const unit = queue.shift()
    for (const item of unit.out.filter(forward)) {
      item.to.rank = Math.max(item.to.rank, unit.rank + 1)
      waiting.set(item.to, waiting.get(item.to) - 1)
      if (waiting.get(item.to) === 0) {
        queue.push(item.to)
      }
    }
  }
  const ranks = []
  for (const unit of units) {
    ranks[unit.rank] = [...(ranks[unit.rank] ?? []), unit]
  }

  // 칸 안의 차례: 앞 칸에서 들어오는 상자들의 자리 가운데를 따른다. 선이 덜 엇갈리게 하려는 것이다.
  ranks.forEach((rank, index) => {
    if (index === 0) {
      return
    }
    const key = new Map(
      rank.map((unit, position) => {
        const from = edges
          .filter((item) => forward(item) && item.to === unit && item.from.rank < index)
          .map((item) => {
            const list = ranks[item.from.rank]
            return (list.indexOf(item.from) + 0.5) / list.length
          })
        const value = from.length
          ? from.reduce((sum, value) => sum + value, 0) / from.length
          : (position + 0.5) / rank.length
        return [unit, value]
      })
    )
    rank.sort((a, b) => key.get(a) - key.get(b) || a.order - b.order)
  })

  // 크기. LR 은 같은 칸의 상자 너비를, TD 는 같은 줄의 상자 높이를 맞춘다.
  const size = new Map(
    diagram.nodes.map((node) => [
      node.id,
      {
        w: Math.max(
          NODE_MIN_WIDTH,
          Math.max(...node.lines.map((line) => textWidth(line, DIAGRAM_FONT.node))) +
            NODE_PAD_X * 2
        ),
        h: node.lines.length * NODE_LINE + NODE_PAD_Y * 2,
      },
    ])
  )
  const titleWidth = (group) => textWidth(group.title, DIAGRAM_FONT.title)
  const thickness = ranks.map((rank) =>
    Math.max(
      ...rank.flatMap((unit) => [
        ...unit.nodes.map((node) => (lr ? size.get(node.id).w : size.get(node.id).h)),
        lr && unit.group ? titleWidth(unit.group) : 0,
      ])
    )
  )
  ranks.forEach((rank, index) => {
    for (const unit of rank) {
      for (const node of unit.nodes) {
        size.get(node.id)[lr ? "w" : "h"] = thickness[index]
      }
    }
  })
  // TD 는 위아래로 이어지는 상자의 너비도 모두 맞춘다. 너비가 들쭉날쭉하면 줄이 흐트러져 보인다.
  if (!lr) {
    const nodeWidth = Math.max(...[...size.values()].map((box) => box.w))
    for (const box of size.values()) {
      box.w = nodeWidth
    }
  }
  const hasGroup = ranks.map((rank) => rank.some((unit) => unit.group))
  const offset = hasGroup.map((value) => (value ? (lr ? GROUP_PAD : GROUP_HEADER) : 0))
  const outer = thickness.map(
    (value, index) =>
      value + (hasGroup[index] ? (lr ? GROUP_PAD * 2 : GROUP_HEADER + GROUP_PAD) : 0)
  )

  // 칸 안에서 쌓는 축(cross)의 크기와, 단위 안에서 상자마다의 자리.
  const crossOf = (node) => (lr ? size.get(node.id).h : size.get(node.id).w)
  for (const unit of units) {
    const content =
      unit.nodes.reduce((sum, node) => sum + crossOf(node), 0) +
      UNIT_GAP * (unit.nodes.length - 1)
    unit.cross = !unit.group
      ? content
      : lr
        ? GROUP_HEADER + content + GROUP_PAD
        : Math.max(content, titleWidth(unit.group)) + GROUP_PAD * 2
    let inner = !unit.group ? 0 : lr ? GROUP_HEADER : (unit.cross - content) / 2
    unit.inner = new Map()
    for (const node of unit.nodes) {
      unit.inner.set(node.id, inner)
      inner += crossOf(node) + UNIT_GAP
    }
  }
  // 화살표가 닿는 자리의 cross 값. 묶음이면 묶음의 가운데, 상자면 상자의 가운데다.
  const anchor = (id) => {
    const unit = unitOf.get(id)
    return unit.group?.id === id
      ? unit.start + unit.cross / 2
      : unit.start + unit.inner.get(id) + crossOf(nodeById.get(id)) / 2
  }

  // 먼저 칸마다 가운데에 쌓고, 다음 칸부터 앞 칸에서 들어오는 상자와 줄이 맞도록 옮긴다. 서로 겹치면 아래로 민다.
  const totals = ranks.map(
    (rank) => rank.reduce((sum, unit) => sum + unit.cross, 0) + UNIT_GAP * (rank.length - 1)
  )
  const widest = Math.max(...totals)
  ranks.forEach((rank, index) => {
    let cross = (widest - totals[index]) / 2
    for (const unit of rank) {
      unit.start = cross
      cross += unit.cross + UNIT_GAP
    }
  })
  // 겹치는 단위는 한 덩어리로 묶어, 덩어리 안의 단위가 가고 싶은 자리의 평균에 둔다.
  // 한 상자에서 여러 상자로 갈라질 때 갈라진 상자들이 그 상자를 가운데에 두고 펼쳐지게 하려는 것이다.
  ranks.forEach((rank, index) => {
    if (index === 0) {
      return
    }
    const clusters = []
    for (const unit of rank) {
      const incoming = edges.filter(
        (item) => forward(item) && item.to === unit && item.from.rank === index - 1
      )
      const wanted = incoming.length
        ? unit.start +
          incoming.reduce((sum, item) => sum + anchor(item.edge.from) - anchor(item.edge.to), 0) /
            incoming.length
        : unit.start
      // sum 은 단위마다 "덩어리가 여기서 시작하면 좋겠다" 는 자리의 합이다.
      let cluster = { units: [unit], offsets: [0], size: unit.cross, sum: wanted, count: 1, start: wanted }
      while (clusters.length > 0) {
        const previous = clusters[clusters.length - 1]
        if (previous.start + previous.size + UNIT_GAP <= cluster.start) {
          break
        }
        clusters.pop()
        const shift = previous.size + UNIT_GAP
        const sum = previous.sum + cluster.sum - shift * cluster.count
        const count = previous.count + cluster.count
        cluster = {
          units: [...previous.units, ...cluster.units],
          offsets: [...previous.offsets, ...cluster.offsets.map((value) => value + shift)],
          size: shift + cluster.size,
          sum,
          count,
          start: sum / count,
        }
      }
      clusters.push(cluster)
    }
    for (const cluster of clusters) {
      cluster.units.forEach((unit, position) => {
        unit.start = cluster.start + cluster.offsets[position]
      })
    }
  })
  const top = Math.min(...units.map((unit) => unit.start))
  for (const unit of units) {
    unit.start += MARGIN - top
  }
  const crossEnd = Math.max(...units.map((unit) => unit.start + unit.cross))

  // 칸 사이의 폭. LR 은 마지막 선분 위에 화살표 글이 들어갈 만큼 벌린다.
  const gaps = ranks.slice(1).map((_, index) => {
    if (!lr) {
      return RANK_GAP
    }
    const label = Math.max(
      0,
      ...edges
        .filter((item) => forward(item) && item.to.rank === index + 1 && item.edge.label)
        .map((item) => textWidth(item.edge.label, DIAGRAM_FONT.label))
    )
    return Math.max(RANK_GAP, ELBOW + label + LABEL_GAP * 2 + HEAD + 8)
  })
  const mainStart = [MARGIN]
  gaps.forEach((gap, index) => mainStart.push(mainStart[index] + outer[index] + gap))
  const mainEnd = mainStart[ranks.length - 1] + outer[ranks.length - 1]

  // 상자와 묶음의 자리. main 은 칸을 따라가는 축이다.
  const place = (main, cross, mainSize, crossSize) =>
    lr
      ? { x: main, y: cross, w: mainSize, h: crossSize }
      : { x: cross, y: main, w: crossSize, h: mainSize }
  const boxOf = new Map()
  const groupBoxes = []
  for (const unit of units) {
    if (unit.group) {
      const box = place(mainStart[unit.rank], unit.start, outer[unit.rank], unit.cross)
      boxOf.set(unit.group.id, box)
      groupBoxes.push({ group: unit.group, box })
    }
    for (const node of unit.nodes) {
      boxOf.set(
        node.id,
        place(
          mainStart[unit.rank] + offset[unit.rank],
          unit.start + unit.inner.get(node.id),
          thickness[unit.rank],
          crossOf(node)
        )
      )
    }
  }

  // 화살표.
  const nodeBoxes = diagram.nodes.map((node) => ({ id: node.id, box: boxOf.get(node.id) }))
  let lanes = 0
  const drawn = edges.map((item) => {
    const { edge } = item
    const s = boxOf.get(edge.from)
    const t = boxOf.get(edge.to)
    // 묶음 안의 상자로 들어가는 화살표의 글은 묶음 바깥에 둔다.
    const enter =
      item.to.group && item.to.group.id !== edge.to ? boxOf.get(item.to.group.id) : t
    let points
    let label = null
    if (item.back) {
      lanes += 1
      const lane = crossEnd + LANE_GAP * lanes
      if (lr) {
        const start = [s.x + s.w / 2, s.y + s.h]
        const end = [t.x + t.w / 2, t.y + t.h]
        points = [start, [start[0], lane], [end[0], lane], end]
        if (edge.label) {
          label = {
            text: edge.label,
            x: (start[0] + end[0]) / 2,
            y: lane + LABEL_GAP + DIAGRAM_FONT.label / 2,
            anchor: "middle",
          }
        }
      } else {
        const start = [s.x + s.w, s.y + s.h / 2]
        const end = [t.x + t.w, t.y + t.h / 2]
        points = [start, [lane, start[1]], [lane, end[1]], end]
        if (edge.label) {
          label = { text: edge.label, x: lane + LABEL_GAP, y: (start[1] + end[1]) / 2, anchor: "start" }
        }
      }
    } else if (lr) {
      const start = [s.x + s.w, s.y + s.h / 2]
      const end = [t.x, t.y + t.h / 2]
      const bend = start[0] + ELBOW
      points =
        Math.abs(start[1] - end[1]) < 1
          ? [start, end]
          : [start, [bend, start[1]], [bend, end[1]], end]
      if (edge.label) {
        const from = points[points.length - 2][0]
        label = {
          text: edge.label,
          x: (from + enter.x) / 2,
          y: end[1] - LABEL_GAP - DIAGRAM_FONT.label / 2,
          anchor: "middle",
        }
      }
    } else {
      const start = [s.x + s.w / 2, s.y + s.h]
      const end = [t.x + t.w / 2, t.y]
      const bend = start[1] + ELBOW
      points =
        Math.abs(start[0] - end[0]) < 1
          ? [start, end]
          : [start, [start[0], bend], [end[0], bend], end]
      if (edge.label) {
        const from = points[points.length - 2][1]
        label = { text: edge.label, x: end[0] + LABEL_GAP + 2, y: (from + enter.y) / 2, anchor: "start" }
      }
    }

    // 지나가는 상자가 있으면 그릴 수 없다. 이은 상자와, 그 상자가 든 묶음 안의 상자는 빼고 본다.
    const own = new Set([
      edge.from,
      edge.to,
      ...item.from.nodes.map((node) => node.id),
      ...item.to.nodes.map((node) => node.id),
    ])
    for (let index = 1; index < points.length; index += 1) {
      const hit = nodeBoxes.find(
        ({ id, box }) => !own.has(id) && crosses(points[index - 1], points[index], box)
      )
      if (hit) {
        throw new Error(
          `화살표 ${name(edge.from)} → ${name(edge.to)} 가 상자 ${name(hit.id)} 를 지나갑니다. 상자를 거쳐 가게 하거나 순서를 바꿉니다.`
        )
      }
    }

    const { line, head } = arrow(points)
    return {
      d: pathOf(line),
      head,
      label: label && { ...label, x: round(label.x), y: round(label.y) },
    }
  })

  // 그림의 크기. 돌아가는 화살표의 길과 화살표 글이 모두 들어가게 한다.
  let width = lr ? mainEnd : crossEnd + LANE_GAP * lanes
  let height = lr ? crossEnd + LANE_GAP * lanes : mainEnd
  for (const { label } of drawn) {
    if (!label) {
      continue
    }
    const labelWidth = textWidth(label.text, DIAGRAM_FONT.label)
    width = Math.max(width, label.anchor === "start" ? label.x + labelWidth : label.x + labelWidth / 2)
    height = Math.max(height, label.y + DIAGRAM_FONT.label / 2)
  }

  const description = [
    "흐름도.",
    ...diagram.edges.map(
      (edge) => `${name(edge.from)} → ${name(edge.to)}${edge.label ? ` (${edge.label})` : ""}.`
    ),
    ...diagram.groups.map((group) => `${group.title} 묶음: ${group.nodes.map(name).join(", ")}.`),
  ].join(" ")

  return {
    width: Math.ceil(width + MARGIN),
    height: Math.ceil(height + MARGIN),
    nodes: diagram.nodes.map((node) => {
      const box = boxOf.get(node.id)
      return {
        x: round(box.x),
        y: round(box.y),
        w: round(box.w),
        h: round(box.h),
        lines: node.lines.map((text, index) => ({
          text,
          x: round(box.x + box.w / 2),
          y: round(box.y + box.h / 2 + (index - (node.lines.length - 1) / 2) * NODE_LINE),
        })),
      }
    }),
    groups: groupBoxes.map(({ group, box }) => ({
      x: round(box.x),
      y: round(box.y),
      w: round(box.w),
      h: round(box.h),
      title: { text: group.title, x: round(box.x + box.w / 2), y: round(box.y + GROUP_HEADER / 2) },
    })),
    edges: drawn,
    description,
  }
}
