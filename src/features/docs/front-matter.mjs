// Docs 문서 맨 앞의 frontmatter 를 읽는다. 제목, 소개, 게시한 날, 고친 날, 태그를 여기에 적는다.
// 제목과 소개는 꼭 적고, 날짜와 태그는 적은 문서에만 머리말에 보인다.
// 빌드할 때 remark-front-matter.mjs 가 쓰고, 단위 시험이 저장소의 문서를 검사할 때 쓴다.
// YAML 의 일부만 받는다. 한 줄에 `이름: 값` 하나를 쓰고, 목록은 `[가, 나]` 나 `- 가` 줄로 쓴다.
// 값은 모두 글로 읽는다. 날짜도 글이다.

// 문서 맨 앞의 --- 줄부터 그다음 --- 줄까지.
const FENCE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/

const KEYS = ["title", "description", "published", "updated", "tags"]

// docMeta 가 돌려주는 값. catalog.ts 의 DocMeta 와 같다.
/** @typedef {{ title: string, description: string, published?: string, updated?: string, tags: string[] }} DocMeta */

// 날짜의 모양. 예: 2026-10-21
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/

// 날짜가 모양이 맞고 달력에 있는 날인지 본다. 2026-02-30 같은 날은 받지 않는다.
export function isDocDate(value) {
  const match = DATE.exec(value)
  if (!match) {
    return false
  }
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

// 문서 맨 앞의 frontmatter. raw 는 두 --- 줄 사이의 글이고, end 는 닫는 줄 다음의 위치다. 없으면 null 이다.
/** @param {string} source @returns {{ raw: string, end: number } | null} */
export function frontMatter(source) {
  const match = FENCE.exec(source)
  return match ? { raw: match[1], end: match[0].length } : null
}

// frontmatter 를 줄바꿈만 남기고 빈칸으로 바꾼다. 글의 길이와 줄 수가 그대로여서 본문의 위치가 어긋나지 않는다.
/** @param {string} source @returns {string} */
export function blankFrontMatter(source) {
  const block = frontMatter(source)
  if (!block) {
    return source
  }
  return (
    source.slice(0, block.end).replace(/[^\r\n]/g, " ") +
    source.slice(block.end)
  )
}

// 값 하나. 따옴표로 감쌌으면 따옴표 안의 글이고, 아니면 # 로 시작하는 줄 끝의 설명을 뺀 글이다.
function scalar(text, where) {
  const value = text.trim()
  const double = /^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/.exec(value)
  if (double) {
    return JSON.parse(`"${double[1]}"`)
  }
  const single = /^'((?:[^']|'')*)'\s*(?:#.*)?$/.exec(value)
  if (single) {
    return single[1].replaceAll("''", "'")
  }
  if (value.startsWith('"') || value.startsWith("'")) {
    throw new Error(`${where}: 따옴표로 연 값을 닫지 않았습니다.`)
  }
  return value.replace(/\s+#.*$/, "")
}

// [가, "나, 다"] 모양의 목록. 따옴표 안의 쉼표는 나누지 않는다.
function inlineList(text, where) {
  const value = text.trim().replace(/\s+#[^\]]*$/, "")
  if (!value.endsWith("]")) {
    throw new Error(`${where}: [ 로 연 목록을 ] 로 닫지 않았습니다.`)
  }
  const inner = value.slice(1, -1)
  if (!inner.trim()) {
    return []
  }
  const items = []
  let current = ""
  let quote = null
  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index]
    if (quote === '"' && char === "\\") {
      current += char + (inner[index + 1] ?? "")
      index += 1
    } else if (quote) {
      current += char
      if (char === quote) {
        quote = null
      }
    } else if (char === '"' || char === "'") {
      quote = char
      current += char
    } else if (char === ",") {
      items.push(current)
      current = ""
    } else {
      current += char
    }
  }
  if (quote) {
    throw new Error(`${where}: 따옴표로 연 값을 닫지 않았습니다.`)
  }
  items.push(current)
  return items.map((item) => scalar(item, where))
}

// frontmatter 의 글을 이름과 값으로 나눈다. 값은 글이거나 글의 목록이다.
export function parseFrontMatter(raw) {
  const data = {}
  let list = null
  raw.split(/\r?\n/).forEach((line, index) => {
    // 문서의 첫 줄이 여는 --- 이므로 frontmatter 의 첫 줄은 문서의 둘째 줄이다.
    const where = `frontmatter 의 ${index + 2}번째 줄`
    if (!line.trim() || /^\s*#/.test(line)) {
      return
    }
    const item = /^\s*-(?:\s+(.*))?$/.exec(line)
    if (item) {
      if (!list) {
        throw new Error(`${where}: 목록의 줄(- 값) 위에 이름이 없습니다.`)
      }
      list.push(scalar(item[1] ?? "", where))
      return
    }
    const pair = /^([A-Za-z][\w-]*)[ \t]*:(?:[ \t]+(.*))?$/.exec(line)
    if (!pair) {
      throw new Error(`${where}: "이름: 값" 모양이 아닙니다.`)
    }
    const [, key, value = ""] = pair
    if (Object.hasOwn(data, key)) {
      throw new Error(`${where}: ${key} 를 두 번 적었습니다.`)
    }
    list = null
    if (!value.trim()) {
      // 값이 없으면 다음 줄부터 - 로 시작하는 목록이 온다.
      list = []
      data[key] = list
    } else if (value.trim().startsWith("[")) {
      data[key] = inlineList(value, where)
    } else {
      data[key] = scalar(value, where)
    }
  })
  return data
}

function text(data, key) {
  const value = data[key]
  if (value === undefined) {
    throw new Error(`frontmatter 에 ${key} 가 없습니다.`)
  }
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`frontmatter 의 ${key} 는 비어 있지 않은 글이어야 합니다.`)
  }
  return value.trim()
}

function date(data, key) {
  const value = text(data, key)
  if (!isDocDate(value)) {
    throw new Error(
      `frontmatter 의 ${key}(${value})는 2026-10-21 모양의 있는 날이어야 합니다.`
    )
  }
  return value
}

function tags(data) {
  const value = data.tags ?? []
  if (!Array.isArray(value)) {
    throw new Error(
      "frontmatter 의 tags 는 [가, 나] 나 - 로 시작하는 줄의 목록으로 적습니다."
    )
  }
  for (const tag of value) {
    if (!tag.trim()) {
      throw new Error("frontmatter 의 tags 에 빈 태그가 있습니다.")
    }
    if (tag.startsWith("#")) {
      throw new Error(`frontmatter 의 태그(${tag})에는 # 을 붙이지 않습니다.`)
    }
  }
  if (new Set(value).size !== value.length) {
    throw new Error("frontmatter 의 tags 에 같은 태그가 두 번 있습니다.")
  }
  return value
}

// 문서 원문에서 frontmatter 를 읽어 화면이 쓰는 값으로 돌려준다. 빠지거나 모양이 틀린 값이 있으면 까닭을 담은 Error 를 던진다.
/** @param {string} source @returns {DocMeta} */
export function docMeta(source) {
  const block = frontMatter(source)
  if (!block) {
    throw new Error(
      "문서 맨 앞에 --- 줄로 감싼 frontmatter 가 없습니다. title 과 description 을 적습니다."
    )
  }
  const data = parseFrontMatter(block.raw)
  const unknown = Object.keys(data).filter((key) => !KEYS.includes(key))
  if (unknown.length > 0) {
    throw new Error(
      `frontmatter 에 모르는 이름이 있습니다: ${unknown.join(", ")}. 쓸 수 있는 이름은 ${KEYS.join(", ")} 입니다.`
    )
  }

  /** @type {DocMeta} */
  const meta = {
    title: text(data, "title"),
    description: text(data, "description"),
    tags: [],
  }
  if (data.published !== undefined) {
    meta.published = date(data, "published")
  }
  if (data.updated !== undefined) {
    const updated = date(data, "updated")
    if (meta.published === undefined) {
      throw new Error("frontmatter 의 updated 는 published 와 함께 적습니다.")
    }
    if (updated < meta.published) {
      throw new Error(
        `frontmatter 의 updated(${updated})가 published(${meta.published})보다 앞섭니다.`
      )
    }
    meta.updated = updated
  }
  meta.tags = tags(data)
  return meta
}
