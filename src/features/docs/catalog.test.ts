import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import { test } from "node:test"

import { DOCS } from "@/content/docs/list"

import { DOC_SLUG, docNeighbors, findDoc, type DocEntry } from "./catalog"

const docs: DocEntry[] = [
  { slug: "first", title: "처음", description: "" },
  { slug: "second", title: "둘째", description: "" },
  { slug: "third", title: "셋째", description: "" },
]

test("목록에 있는 slug 로 문서를 찾는다", () => {
  assert.equal(findDoc("second", docs)?.title, "둘째")
})

test("목록에 없는 slug 는 파일 이름이나 경로처럼 보여도 찾지 않는다", () => {
  for (const slug of ["", "Second", "second.mdx", "../list", "./second", "second/"]) {
    assert.equal(findDoc(slug, docs), null, slug)
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

test("목록의 slug 는 모양이 맞고 서로 겹치지 않는다", () => {
  for (const doc of DOCS) {
    assert.match(doc.slug, DOC_SLUG, doc.slug)
    assert.ok(doc.title.trim(), doc.slug)
    assert.ok(doc.description.trim(), doc.slug)
  }
  assert.equal(new Set(DOCS.map((doc) => doc.slug)).size, DOCS.length)
})

test("목록과 폴더의 .mdx 파일이 서로 맞다", () => {
  // 목록에만 있으면 화면이 파일을 찾지 못하고, 파일만 있으면 아무도 열 수 없다.
  const files = readdirSync(new URL("../../content/docs/", import.meta.url))
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => name.slice(0, -".mdx".length))
  assert.deepEqual(files.sort(), DOCS.map((doc) => doc.slug).sort())
})
