import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { test } from "node:test"

import { DOC_SLUGS } from "@/content/docs/list"

import {
  DOC_SLUG,
  docNeighbors,
  docsHref,
  formatDocDate,
  isListedDoc,
  type DocEntry,
} from "./catalog"
import { docMeta } from "./front-matter.mjs"

const docs: DocEntry[] = [
  { slug: "first", title: "처음", description: "", published: "2026-10-01", tags: [] },
  { slug: "second", title: "둘째", description: "", published: "2026-10-01", tags: [] },
  { slug: "third", title: "셋째", description: "", published: "2026-10-01", tags: [] },
]
const slugs = docs.map((doc) => doc.slug)

const folder = new URL("../../content/docs/", import.meta.url)

test("목록에 있는 slug 만 문서로 받는다", () => {
  assert.equal(isListedDoc("second", slugs), true)
})

test("목록에 없는 slug 는 파일 이름이나 경로처럼 보여도 받지 않는다", () => {
  for (const slug of ["", "Second", "second.mdx", "../list", "./second", "second/"]) {
    assert.equal(isListedDoc(slug, slugs), false, slug)
  }
})

test("앞뒤 문서는 목록의 순서를 따른다", () => {
  assert.deepEqual(docNeighbors("first", docs), { prev: null, next: docs[1] })
  assert.deepEqual(docNeighbors("second", docs), { prev: docs[0], next: docs[2] })
  assert.deepEqual(docNeighbors("third", docs), { prev: docs[1], next: null })
})

test("목록에 없는 slug 에는 앞뒤 문서가 없다", () => {
  assert.deepEqual(docNeighbors("none", docs), { prev: null, next: null })
})

test("Docs 로 들어가는 주소는 목록의 첫 문서다", () => {
  assert.equal(docsHref("club-1", slugs), "/clubs/club-1/docs/first")
})

test("문서가 없으면 Docs 의 첫 화면으로 들어간다", () => {
  assert.equal(docsHref("club-1", []), "/clubs/club-1/docs")
})

test("목록의 slug 는 모양이 맞고 서로 겹치지 않는다", () => {
  for (const slug of DOC_SLUGS) {
    assert.match(slug, DOC_SLUG, slug)
  }
  assert.equal(new Set(DOC_SLUGS).size, DOC_SLUGS.length)
})

test("목록과 폴더의 .mdx 파일이 서로 맞다", () => {
  // 목록에만 있으면 화면이 파일을 찾지 못하고, 파일만 있으면 아무도 열 수 없다.
  const files = readdirSync(folder)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.slice(0, -".mdx".length))
  assert.deepEqual(files.sort(), [...DOC_SLUGS].sort())
})

test("목록의 문서마다 frontmatter 의 제목, 소개, 날짜, 태그가 규칙에 맞다", () => {
  // 빌드도 같은 검사로 멈추지만, 시험에서 먼저 어느 문서의 무엇이 틀렸는지 알린다.
  for (const slug of DOC_SLUGS) {
    const source = readFileSync(new URL(`${slug}.mdx`, folder), "utf8")
    assert.doesNotThrow(() => docMeta(source), slug)
  }
})

test("날짜를 한국어로 적는다", () => {
  assert.equal(formatDocDate("2026-10-21"), "2026년 10월 21일")
  assert.equal(formatDocDate("2026-01-05"), "2026년 1월 5일")
})
