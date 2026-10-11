import assert from "node:assert/strict"
import { test } from "node:test"

import {
  parsePresentation,
  presentationStats,
  type PublicPresentation,
} from "./content"
import { buildSlides, slideIndex } from "./slides"

const token = "0123456789abcdef0123456789abcdef"

const log = {
  title: "청크 크기를 비교했다",
  tools: ["Claude"],
  attempt: "세 가지 크기로 나눴다",
  result: "",
  learned: "중간 크기가 낫다",
  nextAction: "",
  createdAt: "2026-10-08T10:00:00+00:00",
  author: null,
}

function project(extra: Record<string, unknown> = {}): PublicPresentation {
  const parsed = parsePresentation({
    scope: "project",
    clubName: "AI 모각코",
    showNames: true,
    publishedAt: "2026-10-11T03:00:00+00:00",
    intro: "한 학기 동안 만든 것입니다.",
    project: { name: "RAG 챗봇", goal: "자료를 찾아 준다", status: "active", createdAt: "2026-10-01T00:00:00+00:00" },
    participantCount: 2,
    participantNames: ["김하늘", null],
    links: [{ label: "저장소", url: "https://example.com/repo" }],
    tasks: [
      { title: "평가 질문 만들기", done: true },
      { title: "발표 준비", done: false },
    ],
    logCount: 4,
    logs: [log, { ...log, title: "검색 방식을 바꿨다" }],
    retrospectives: [
      { wentWell: "평가 질문을 먼저 정했다", toImprove: "", toTry: "", createdAt: "2026-10-10T10:00:00+00:00", author: "김하늘" },
    ],
    ...extra,
  })
  assert.ok(parsed)
  return parsed
}

function club(extra: Record<string, unknown> = {}): PublicPresentation {
  const parsed = parsePresentation({
    scope: "club",
    clubName: "AI 모각코",
    clubDescription: "매주 모인다",
    showNames: false,
    publishedAt: "2026-10-11T03:00:00+00:00",
    memberCount: 14,
    memberNames: null,
    logCount: 23,
    projectCount: 2,
    sessions: [{ title: "1회차", startsAt: "2026-10-01T10:00:00+00:00" }],
    projects: [{ name: "RAG 챗봇", goal: "", status: "done", token }],
    ...extra,
  })
  assert.ok(parsed)
  return parsed
}

const kinds = (presentation: PublicPresentation) =>
  buildSlides(presentation).map((slide) => slide.kind)

test("Project 발표는 표지에서 시작해 기록을 한 장씩 보여 주고 끝 장으로 맺는다", () => {
  const slides = buildSlides(project())
  assert.deepEqual(
    slides.map((slide) => slide.kind),
    ["cover", "text", "stats", "links", "log", "log", "retrospective", "tasks", "names", "end"]
  )
  const retro = slides.find((slide) => slide.kind === "retrospective")
  assert.deepEqual(
    retro?.kind === "retrospective" && [retro.position, retro.total, retro.retrospective.wentWell],
    [1, 1, "평가 질문을 먼저 정했다"]
  )
  assert.deepEqual(slides[0], {
    kind: "cover",
    overline: "AI 모각코 의 PROJECT",
    title: "RAG 챗봇",
    status: "active",
    lead: "자료를 찾아 준다",
  })
  assert.deepEqual(slides[1], {
    kind: "text",
    title: "소개",
    body: "한 학기 동안 만든 것입니다.",
  })
  const logs = slides.flatMap((slide) => (slide.kind === "log" ? [slide] : []))
  assert.deepEqual(
    logs.map((slide) => [slide.position, slide.total, slide.log.title]),
    [
      [1, 2, "청크 크기를 비교했다"],
      [2, 2, "검색 방식을 바꿨다"],
    ]
  )
})

test("내용이 없는 부분은 장을 만들지 않는다", () => {
  assert.deepEqual(
    kinds(
      project({ intro: "", links: [], tasks: [], logs: [], retrospectives: [], showNames: false })
    ),
    ["cover", "stats", "end"]
  )
  // 이름을 보이는 발표라도 참여자가 없으면 이름 장이 없다.
  assert.deepEqual(
    kinds(project({ participantNames: [], logs: [], retrospectives: [], links: [], tasks: [] })),
    ["cover", "text", "stats", "end"]
  )
})

test("항목이 많으면 여러 장으로 나누고 제목에 몇째 장인지 붙인다", () => {
  const tasks = Array.from({ length: 9 }, (_, index) => ({
    title: `할 일 ${index + 1}`,
    done: index < 3,
  }))
  const slides = buildSlides(project({ tasks })).flatMap((slide) =>
    slide.kind === "tasks" ? [slide] : []
  )
  assert.deepEqual(
    slides.map((slide) => [slide.title, slide.items.length, slide.done, slide.total]),
    [
      ["할 일 (1 / 2)", 8, 3, 9],
      ["할 일 (2 / 2)", 1, 3, 9],
    ]
  )

  // 한 장에 다 들어가면 제목에 아무것도 붙이지 않는다.
  const single = buildSlides(project()).find((slide) => slide.kind === "tasks")
  assert.equal(single?.kind === "tasks" && single.title, "할 일")
})

test("Club 발표는 Project 와 Session 을 장으로 나눈다", () => {
  assert.deepEqual(kinds(club()), ["cover", "stats", "projects", "sessions", "end"])

  const projects = Array.from({ length: 5 }, (_, index) => ({
    name: `Project ${index + 1}`,
    goal: "",
    status: "active",
    token,
  }))
  const slides = buildSlides(
    club({ intro: "  어서 오세요.  ", projects, sessions: [], showNames: true, memberNames: ["김하늘"] })
  )
  assert.deepEqual(
    slides.map((slide) => slide.kind),
    ["cover", "text", "stats", "projects", "projects", "names", "end"]
  )
  assert.deepEqual(slides[0], {
    kind: "cover",
    overline: "CLUB",
    title: "AI 모각코",
    status: null,
    lead: "매주 모인다",
  })
  // 소개 글은 앞뒤 공백을 떼고 쓴다.
  assert.equal(slides[1].kind === "text" && slides[1].body, "어서 오세요.")
})

test("숫자로 보여 주는 값은 이어 보는 화면과 같다", () => {
  const presentation = project()
  const stats = buildSlides(presentation).find((slide) => slide.kind === "stats")
  assert.deepEqual(stats?.kind === "stats" && stats.items, presentationStats(presentation))
  assert.deepEqual(presentationStats(presentation), [
    { label: "남긴 AI Log", value: "4개", caption: "이 가운데 2개를 발표에 담았습니다" },
    { label: "할 일", value: "1 / 2", caption: "끝낸 일과 전체" },
    { label: "참여자", value: "2명" },
  ])
  assert.deepEqual(presentationStats(project({ tasks: [] }))[1], { label: "할 일", value: "없음" })
  assert.deepEqual(
    presentationStats(club()).map((stat) => stat.value),
    ["14명", "1회", "23개", "2개"]
  )
})

test("주소의 장 번호는 있는 장 안에서만 받는다", () => {
  assert.equal(slideIndex("1", 9), 0)
  assert.equal(slideIndex("4", 9), 3)
  assert.equal(slideIndex(["4", "7"], 9), 3)
  assert.equal(slideIndex("9", 9), 8)
  assert.equal(slideIndex("10", 9), 8)
  assert.equal(slideIndex("0", 9), 0)
  assert.equal(slideIndex("-2", 9), 0)
  assert.equal(slideIndex("3.5", 9), 0)
  assert.equal(slideIndex("셋", 9), 0)
  assert.equal(slideIndex(undefined, 9), 0)
  assert.equal(slideIndex("3", 0), 0)
})
