import assert from "node:assert/strict"
import { test } from "node:test"

import {
  INSIGHT_ITEM_MAX,
  INSIGHT_OVERVIEW_MAX,
  INSIGHT_THEME_MAX,
  insightFromAiOutput,
  insightShownLogIds,
  insightToText,
  parseInsightContent,
} from "./content"

const A = "00000000-0000-4000-8000-00000000000a"
const B = "00000000-0000-4000-8000-00000000000b"
const C = "00000000-0000-4000-8000-00000000000c"

test("모양이 맞는 내용은 그대로 읽는다", () => {
  const content = {
    v: 1,
    overview: "청크 크기를 여러 사람이 비교했다.",
    themes: [{ title: "청크 크기", summary: "500 토큰이 안정적이었다.", logIds: [A, B] }],
    lessons: [{ text: "작다고 정확해지지 않는다.", logIds: [A] }],
    nextActions: [{ text: "겹침을 바꿔 본다.", logIds: [] }],
  }
  assert.deepEqual(parseInsightContent(content), content)
})

test("모양이 아예 다르면 읽지 않는다", () => {
  assert.equal(parseInsightContent(null), null)
  assert.equal(parseInsightContent("글자"), null)
  assert.equal(parseInsightContent([]), null)
  assert.equal(parseInsightContent({ overview: "버전이 없다" }), null)
  assert.equal(parseInsightContent({ v: 2, overview: "모르는 버전" }), null)
})

test("남는 내용이 없으면 읽지 않는다", () => {
  assert.equal(parseInsightContent({ v: 1 }), null)
  assert.equal(parseInsightContent({ v: 1, overview: "   ", themes: [{ title: " " }], lessons: [{ text: "" }] }), null)
})

test("글자를 다듬고 자르며 빈 항목을 뺀다", () => {
  const content = parseInsightContent({
    v: 1,
    overview: `  ${"가".repeat(INSIGHT_OVERVIEW_MAX + 50)}  `,
    themes: [{ title: "  주제  ", summary: 3 }, { title: "", summary: "제목이 없다" }, "글자"],
    lessons: [{ text: "  배운 점\r\n둘째 줄  " }, { text: "   " }, null],
    nextActions: "배열이 아니다",
  })
  assert.equal(Array.from(content?.overview ?? "").length, INSIGHT_OVERVIEW_MAX)
  assert.deepEqual(content?.themes, [{ title: "주제", summary: "", logIds: [] }])
  assert.deepEqual(content?.lessons, [{ text: "배운 점\n둘째 줄", logIds: [] }])
  assert.deepEqual(content?.nextActions, [])
})

test("정해진 수를 넘는 항목은 뺀다", () => {
  const many = Array.from({ length: 20 }, (_, index) => ({ title: `주제 ${index}`, text: `항목 ${index}` }))
  const content = parseInsightContent({ v: 1, themes: many, lessons: many, nextActions: many })
  assert.equal(content?.themes.length, INSIGHT_THEME_MAX)
  assert.equal(content?.lessons.length, INSIGHT_ITEM_MAX)
  assert.equal(content?.nextActions.length, INSIGHT_ITEM_MAX)
})

test("근거 기록은 식별자 모양인 것만 겹치지 않게 남긴다", () => {
  const content = parseInsightContent({
    v: 1,
    lessons: [{ text: "배운 점", logIds: [A, "식별자가 아님", A, 3, B] }],
  })
  assert.deepEqual(content?.lessons[0].logIds, [A, B])
})

test("AI 가 적은 기록 번호를 식별자로 바꾼다", () => {
  const content = insightFromAiOutput(
    {
      overview: "요약",
      themes: [{ title: "주제", summary: "설명", logs: [1, 3] }],
      lessons: [{ text: "배운 점", logs: [2, 2, 9, 0, -1, 1.5, "1"] }],
      next_actions: [{ text: "다음 행동" }],
    },
    [A, B, C]
  )
  assert.deepEqual(content, {
    v: 1,
    overview: "요약",
    themes: [{ title: "주제", summary: "설명", logIds: [A, C] }],
    lessons: [{ text: "배운 점", logIds: [B] }],
    nextActions: [{ text: "다음 행동", logIds: [] }],
  })
})

test("AI 의 답이 엉뚱하면 내용으로 바꾸지 않는다", () => {
  assert.equal(insightFromAiOutput(null, [A]), null)
  assert.equal(insightFromAiOutput("죄송합니다", [A]), null)
  assert.equal(insightFromAiOutput({ themes: [], lessons: [], next_actions: [] }, [A]), null)
})

test("AI 가 식별자를 직접 적어도 받지 않는다", () => {
  const content = insightFromAiOutput({ overview: "요약", lessons: [{ text: "배운 점", logIds: [A], logs: [] }] }, [B])
  assert.deepEqual(content?.lessons[0].logIds, [])
})

test("제목으로 보여 줄 근거 기록은 항목마다 앞의 세 개만, 겹치지 않게 모은다", () => {
  const D = "00000000-0000-4000-8000-00000000000d"
  const content = parseInsightContent({
    v: 1,
    themes: [{ title: "주제", logIds: [A, B, C, D] }],
    lessons: [{ text: "배운 점", logIds: [B, D] }],
    nextActions: [{ text: "다음", logIds: [A] }],
  })
  assert.deepEqual(insightShownLogIds(content!), [A, B, C, D])
  assert.deepEqual(insightShownLogIds(parseInsightContent({ v: 1, themes: [{ title: "주제", logIds: [A, B, C, D] }] })!), [A, B, C])
})

test("한도를 모두 채운 내용도 데이터베이스의 크기 제한 안에 든다", () => {
  const ids = Array.from({ length: 30 }, (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`)
  const many = Array.from({ length: 20 }, () => ({ title: "가".repeat(100), summary: "나".repeat(1000), text: "다".repeat(1000), logIds: ids }))
  const content = parseInsightContent({ v: 1, overview: "라".repeat(2000), themes: many, lessons: many, nextActions: many })
  assert.ok(Buffer.byteLength(JSON.stringify(content)) <= 40000, String(Buffer.byteLength(JSON.stringify(content))))
})

test("붙여 넣을 수 있는 글로 바꾼다", () => {
  const content = parseInsightContent({
    v: 1,
    overview: "청크 크기를 여러 사람이 비교했다.",
    themes: [{ title: "청크 크기", summary: "500 토큰이 안정적이었다.", logIds: [A] }, { title: "임베딩 모델" }],
    lessons: [{ text: "작다고 정확해지지 않는다." }],
    nextActions: [{ text: "겹침을 바꿔 본다." }, { text: "질문을 고정한다." }],
  })
  assert.equal(
    insightToText("3회차", content!),
    [
      "3회차 AI Insight",
      "",
      "요약",
      "청크 크기를 여러 사람이 비교했다.",
      "",
      "반복된 주제",
      "- 청크 크기: 500 토큰이 안정적이었다.",
      "- 임베딩 모델",
      "",
      "배운 점",
      "- 작다고 정확해지지 않는다.",
      "",
      "다음 행동",
      "- 겹침을 바꿔 본다.",
      "- 질문을 고정한다.",
    ].join("\n")
  )
})

test("붙여 넣을 글에는 비어 있는 묶음과 근거 기록을 싣지 않는다", () => {
  const content = parseInsightContent({ v: 1, lessons: [{ text: "배운 점", logIds: [A, B] }] })
  assert.equal(insightToText("2026년 10월", content!), "2026년 10월 AI Insight\n\n배운 점\n- 배운 점")
})
