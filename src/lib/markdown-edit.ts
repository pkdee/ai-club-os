// Markdown 쓰는 칸의 서식 버튼과 단축키가 하는 일. 칸의 글과 고른 범위를 받아 무엇을 바꿀지 돌려준다.
// 바꾸는 일은 한 범위를 새 글로 갈아 끼우는 것 하나로 나타낸다. 브라우저의 되돌리기(Cmd+Z) 한 번으로 돌아가게 하려는 것이다.

export type TextSelection = {
  value: string
  start: number
  end: number
}

export type MarkdownEdit = {
  // value 의 from 부터 to 앞까지를 insert 로 바꾼다.
  from: number
  to: number
  insert: string
  // 바꾼 뒤에 고를 범위.
  selectionStart: number
  selectionEnd: number
}

// 고른 범위 양끝의 빈칸은 감싸지 않는다. "**굵게 **" 처럼 닫는 표시 앞에 빈칸이 있으면 굵게 읽히지 않는다.
function trimmed({ value, start, end }: TextSelection) {
  let from = start
  let to = end
  while (from < to && /\s/.test(value[from])) {
    from += 1
  }
  while (to > from && /\s/.test(value[to - 1])) {
    to -= 1
  }
  return { from, to }
}

function runBefore(value: string, index: number, char: string) {
  let count = 0
  while (index - count - 1 >= 0 && value[index - count - 1] === char) {
    count += 1
  }
  return count
}

function runAfter(value: string, index: number, char: string) {
  let count = 0
  while (index + count < value.length && value[index + count] === char) {
    count += 1
  }
  return count
}

// 같은 글자가 이어진 길이로 이 표시가 붙어 있는지 본다. 별표 셋(***)은 굵게와 기울임이 함께 붙은 것이다.
function marked(run: number, length: number) {
  return run === length || run === 3
}

// 고른 글을 표시로 감싼다. 이미 감싸여 있으면 표시를 걷어 낸다.
// 고른 것이 없으면 placeholder 를 감싸 넣고 그 글을 골라 두어 바로 고쳐 적게 한다.
export function toggleWrap(
  selection: TextSelection,
  marker: string,
  placeholder: string
): MarkdownEdit {
  const { value } = selection
  const { from, to } = trimmed(selection)
  const selected = value.slice(from, to)
  const char = marker[0]
  const length = marker.length

  // 표시까지 함께 고른 경우.
  const lead = runAfter(selected, 0, char)
  const trail = runBefore(selected, selected.length, char)
  if (
    selected.length > lead + trail &&
    marked(lead, length) &&
    marked(trail, length)
  ) {
    const inner = selected.slice(length, selected.length - length)
    return {
      from,
      to,
      insert: inner,
      selectionStart: from,
      selectionEnd: from + inner.length,
    }
  }

  // 표시 안쪽만 고른 경우.
  if (
    marked(runBefore(value, from, char), length) &&
    marked(runAfter(value, to, char), length)
  ) {
    return {
      from: from - length,
      to: to + length,
      insert: selected,
      selectionStart: from - length,
      selectionEnd: to - length,
    }
  }

  const text = selected || placeholder
  return {
    from,
    to,
    insert: `${marker}${text}${marker}`,
    selectionStart: from + length,
    selectionEnd: from + length + text.length,
  }
}

const FENCE = "```"

// 여러 줄을 골랐으면 코드 블록으로 감싸고, 한 줄 안이면 글 사이의 코드로 감싼다.
export function toggleCode(selection: TextSelection): MarkdownEdit {
  const { value, start, end } = selection
  if (!value.slice(start, end).includes("\n")) {
    return toggleWrap(selection, "`", "코드")
  }

  const { from, to } = wholeLines(selection)
  const lines = value.slice(from, to).split("\n")
  // 이미 코드 블록이면 위아래의 ``` 줄을 걷어 낸다.
  if (
    lines.length >= 2 &&
    lines[0].startsWith(FENCE) &&
    lines[lines.length - 1].trim() === FENCE
  ) {
    const inner = lines.slice(1, -1).join("\n")
    return {
      from,
      to,
      insert: inner,
      selectionStart: from,
      selectionEnd: from + inner.length,
    }
  }
  const body = lines.join("\n")
  const opening = `${FENCE}\n`
  return {
    from,
    to,
    insert: `${opening}${body}\n${FENCE}`,
    selectionStart: from + opening.length,
    selectionEnd: from + opening.length + body.length,
  }
}

const LINK_TEXT = "링크 글"
const LINK_URL = "https://"

// 고른 글을 링크로 만든다. 고른 것이 주소면 그 주소로 가는 링크를 만들고 링크 글을 골라 둔다.
// 글을 골랐으면 주소 자리를, 아무것도 고르지 않았으면 링크 글 자리를 골라 둔다.
export function insertLink(selection: TextSelection): MarkdownEdit {
  const { value } = selection
  const { from, to } = trimmed(selection)
  const selected = value.slice(from, to)

  if (/^https?:\/\/\S+$/i.test(selected)) {
    return {
      from,
      to,
      insert: `[${LINK_TEXT}](${selected})`,
      selectionStart: from + 1,
      selectionEnd: from + 1 + LINK_TEXT.length,
    }
  }
  if (selected) {
    const urlAt = from + selected.length + 3
    return {
      from,
      to,
      insert: `[${selected}](${LINK_URL})`,
      selectionStart: urlAt,
      selectionEnd: urlAt + LINK_URL.length,
    }
  }
  return {
    from,
    to,
    insert: `[${LINK_TEXT}](${LINK_URL})`,
    selectionStart: from + 1,
    selectionEnd: from + 1 + LINK_TEXT.length,
  }
}

// 고른 범위가 걸친 줄 전체. 다음 줄 맨 앞까지 고른 것은 그 줄을 넣지 않는다.
function wholeLines({ value, start, end }: TextSelection) {
  const from = value.lastIndexOf("\n", start - 1) + 1
  const last = end > start && value[end - 1] === "\n" ? end - 1 : end
  const lineEnd = value.indexOf("\n", last)
  return { from, to: lineEnd === -1 ? value.length : lineEnd }
}

export type ListKind = "bullet" | "ordered"

// 들여쓰기, 목록 표시, 할 일 칸까지.
const ANY_LIST = /^(\s*)(?:[-*+]|\d{1,9}[.)])\s+(?:\[[ xX]\]\s+)?/
const LIST: Record<ListKind, RegExp> = {
  bullet: /^(\s*)[-*+]\s+/,
  ordered: /^(\s*)\d{1,9}[.)]\s+/,
}

// 고른 줄들을 목록으로 만든다. 모두 이미 그 목록이면 표시를 걷어 낸다.
// 다른 목록 표시가 붙어 있던 줄은 표시를 바꾼다. 여러 줄을 고르면 사이의 빈 줄은 그대로 둔다.
export function toggleList(
  selection: TextSelection,
  kind: ListKind
): MarkdownEdit {
  const { value, start, end } = selection
  const { from, to } = wholeLines(selection)
  const lines = value.slice(from, to).split("\n")
  const filled = lines.filter((line) => line.trim() !== "")
  const listed =
    filled.length > 0 && filled.every((line) => LIST[kind].test(line))

  let number = 0
  const next = lines.map((line) => {
    if (listed) {
      return line.replace(LIST[kind], "$1")
    }
    if (line.trim() === "" && lines.length > 1) {
      return line
    }
    const existing = line.match(ANY_LIST)
    const indent = existing ? existing[1] : (line.match(/^\s*/)?.[0] ?? "")
    const rest = line.slice(existing ? existing[0].length : indent.length)
    number += 1
    return `${indent}${kind === "bullet" ? "- " : `${number}. `}${rest}`
  })
  const insert = next.join("\n")

  // 커서만 있었으면 같은 글자 앞에 커서를 둔다.
  if (start === end) {
    const shift = next[0].length - lines[0].length
    const cursor = Math.min(
      Math.max(from, start + shift),
      from + next[0].length
    )
    return { from, to, insert, selectionStart: cursor, selectionEnd: cursor }
  }
  return {
    from,
    to,
    insert,
    selectionStart: from,
    selectionEnd: from + insert.length,
  }
}

// 들여쓰기, 표시, 표시 뒤의 빈칸, 할 일 칸. 번호는 세 자리까지만 잇는다.
// "2026. 10. 26." 처럼 날짜로 시작한 줄에서 Enter 를 눌러 "2027. " 이 생기지 않게 하려는 것이다.
const CONTINUED = /^(\s*)(?:([-*+])|(\d{1,3})([.)]))(\s+)(\[[ xX]\]\s+)?/

// 목록 줄에서 Enter 를 누르면 다음 줄에 같은 표시를 이어 붙인다. 번호 목록은 번호를 하나 올린다.
// 내용이 없는 항목에서 누르면 표시를 지워 목록을 끝낸다. 목록이 아니면 null 이고, 그때는 칸이 하던 대로 둔다.
export function continueList(selection: TextSelection): MarkdownEdit | null {
  const { value, start, end } = selection
  if (start !== end) {
    return null
  }
  const lineStart = value.lastIndexOf("\n", start - 1) + 1
  const found = value.indexOf("\n", start)
  const lineEnd = found === -1 ? value.length : found
  const line = value.slice(lineStart, lineEnd)
  const match = line.match(CONTINUED)
  if (!match || start - lineStart < match[0].length) {
    return null
  }

  if (line.slice(match[0].length).trim() === "") {
    return {
      from: lineStart,
      to: lineEnd,
      insert: "",
      selectionStart: lineStart,
      selectionEnd: lineStart,
    }
  }

  const [, indent, bullet, number, delimiter, space, task] = match
  const marker = number ? `${Number(number) + 1}${delimiter}` : bullet
  const insert = `\n${indent}${marker}${space}${task ? "[ ] " : ""}`
  return {
    from: start,
    to: start,
    insert,
    selectionStart: start + insert.length,
    selectionEnd: start + insert.length,
  }
}

// edit 를 적용한 글. 시험과, 브라우저가 글을 바꾸지 못했을 때 확인하는 데 쓴다.
export function applyEdit(value: string, edit: MarkdownEdit) {
  return value.slice(0, edit.from) + edit.insert + value.slice(edit.to)
}
