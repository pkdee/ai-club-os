import assert from "node:assert/strict"
import { test } from "node:test"

import {
  blankFrontMatter,
  docMeta,
  frontMatter,
  isDocDate,
  parseFrontMatter,
} from "./front-matter.mjs"

// 시험마다 frontmatter 의 줄을 바꿔 끼운다. 기본은 규칙에 맞는 문서다.
function doc(lines: string[], body = "## 첫 절\n") {
  return `---\n${lines.join("\n")}\n---\n\n${body}`
}

const valid = [
  "title: 시작하기",
  "description: 처음 들어온 사람을 위한 안내",
  "published: 2026-10-21",
]

test("이름과 값을 글로 읽고, 따옴표와 줄 끝의 설명을 벗긴다", () => {
  assert.deepEqual(
    parseFrontMatter(
      [
        "# 이 줄은 설명이다",
        "title: 2회차 · Prompt Engineering",
        'description: "목표: 따옴표 안의 # 은 글이다"',
        "single: 'It''s'",
        "published: 2026-10-21 # 처음 올린 날",
      ].join("\n")
    ),
    {
      title: "2회차 · Prompt Engineering",
      description: "목표: 따옴표 안의 # 은 글이다",
      single: "It's",
      published: "2026-10-21",
    }
  )
})

test("목록은 [가, 나] 와 - 로 시작하는 줄 둘 다 받는다", () => {
  assert.deepEqual(parseFrontMatter('tags: [Prompt, "가, 나", 2회차]'), {
    tags: ["Prompt", "가, 나", "2회차"],
  })
  assert.deepEqual(parseFrontMatter("tags: []"), { tags: [] })
  assert.deepEqual(parseFrontMatter("tags:\n  - Prompt\n  - 2회차"), {
    tags: ["Prompt", "2회차"],
  })
})

test("규칙에 맞는 frontmatter 를 화면이 쓰는 값으로 돌려준다", () => {
  assert.deepEqual(docMeta(doc([...valid, "tags: [안내]"])), {
    title: "시작하기",
    description: "처음 들어온 사람을 위한 안내",
    published: "2026-10-21",
    tags: ["안내"],
  })
})

test("날짜와 태그는 빼도 된다. 날짜는 적었을 때만 담는다", () => {
  assert.deepEqual(docMeta(doc(valid.slice(0, 2))), {
    title: "시작하기",
    description: "처음 들어온 사람을 위한 안내",
    tags: [],
  })
  assert.equal("updated" in docMeta(doc(valid)), false)
  assert.equal(docMeta(doc([...valid, "updated: 2026-10-22"])).updated, "2026-10-22")
})

test("frontmatter 가 없거나 꼭 적을 값이 빠지면 까닭을 알린다", () => {
  assert.throws(() => docMeta("## 첫 절\n"), /frontmatter 가 없습니다/)
  assert.throws(() => docMeta(doc(valid.slice(1))), /title 가 없습니다/)
  assert.throws(() => docMeta(doc([valid[0], valid[2]])), /description 가 없습니다/)
  assert.throws(() => docMeta(doc([...valid.slice(1), "title: ''"])), /비어 있지 않은 글/)
})

test("모르는 이름, 틀린 날짜, 순서가 뒤집힌 날짜를 받지 않는다", () => {
  assert.throws(() => docMeta(doc([...valid, "descripton: 오타"])), /모르는 이름.*descripton/)
  assert.throws(() => docMeta(doc([...valid.slice(0, 2), "published: 2026-02-30"])), /있는 날/)
  assert.throws(() => docMeta(doc([...valid, "updated: 2026-10-20"])), /앞섭니다/)
  assert.throws(() => docMeta(doc([...valid.slice(0, 2), "updated: 2026-10-22"])), /published 와 함께/)
})

test("태그는 목록으로 적고, # 없이, 겹치지 않게 쓴다", () => {
  assert.throws(() => docMeta(doc([...valid, "tags: 안내"])), /목록으로/)
  assert.throws(() => docMeta(doc([...valid, "tags: [#안내]"])), /# 을 붙이지/)
  assert.throws(() => docMeta(doc([...valid, "tags: [안내, 안내]"])), /두 번/)
  assert.throws(() => docMeta(doc([...valid, "tags: [안내, ]"])), /빈 태그/)
})

test("읽지 못하는 줄은 몇 번째 줄인지 알린다", () => {
  assert.throws(() => parseFrontMatter("title 시작하기"), /2번째 줄.*이름: 값/)
  assert.throws(() => parseFrontMatter("title: a\ntitle: b"), /3번째 줄.*두 번/)
  assert.throws(() => parseFrontMatter('title: "닫지 않음'), /따옴표/)
  assert.throws(() => parseFrontMatter("tags: [가, 나"), /\] 로 닫지/)
  assert.throws(() => parseFrontMatter("- 가"), /이름이 없습니다/)
})

test("frontmatter 를 빈칸으로 바꿔도 글의 길이와 줄은 그대로다", () => {
  const source = doc([...valid, "tags: [{식}, <태그>]"], "## 첫 절\n\n본문\n")
  const blanked = blankFrontMatter(source)
  assert.equal(blanked.length, source.length)
  assert.deepEqual(
    blanked.split("\n").map((line) => line.length),
    source.split("\n").map((line) => line.length)
  )
  const end = frontMatter(source)?.end ?? 0
  assert.ok(end > 0)
  assert.equal(blanked.slice(0, end).trim(), "")
  assert.equal(blanked.slice(end), source.slice(end))
})

test("맨 앞이 --- 가 아니면 frontmatter 로 보지 않는다", () => {
  const source = "## 첫 절\n\n---\ntitle: 가\n---\n"
  assert.equal(frontMatter(source), null)
  assert.equal(blankFrontMatter(source), source)
})

test("날짜는 2026-10-21 모양의 있는 날만 받는다", () => {
  assert.equal(isDocDate("2026-10-21"), true)
  assert.equal(isDocDate("2028-02-29"), true)
  for (const value of ["2026-02-30", "2026-13-01", "2026-1-5", "2026/10/21", ""]) {
    assert.equal(isDocDate(value), false, value)
  }
})
