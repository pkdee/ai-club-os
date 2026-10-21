import assert from "node:assert/strict"
import { test } from "node:test"

import { docMarkdown, readingMinutes } from "./markdown"

const entry = { title: "시작하기", description: "처음 들어온 사람을 위한 안내" }
const base = "https://club.example/clubs/c1/docs/getting-started#첫-단계"

test("frontmatter 의 제목과 소개를 앞에 두고 상대 경로 링크를 전체 주소로 바꾼다", () => {
  assert.equal(
    docMarkdown(
      entry,
      ["본문의 [쓰기](", { href: "../logs/new" }, ")와 [다음](", { href: "./next-doc" }, ")"],
      base
    ),
    [
      "# 시작하기",
      "",
      "처음 들어온 사람을 위한 안내",
      "",
      "본문의 [쓰기](https://club.example/clubs/c1/logs/new)와 [다음](https://club.example/clubs/c1/docs/next-doc)",
      "",
    ].join("\n")
  )
})

test("읽는 시간은 한글 500자, 영어 200낱말을 1분으로 어림하고 1분보다 짧게 적지 않는다", () => {
  assert.equal(readingMinutes([]), 1)
  assert.equal(readingMinutes(["가".repeat(1000)]), 2)
  assert.equal(readingMinutes([Array(400).fill("word").join(" ")]), 2)
  assert.equal(
    readingMinutes(["가".repeat(500), { href: "../logs" }, Array(200).fill("AI").join(" ")]),
    2
  )
})
