import assert from "node:assert/strict"
import { test } from "node:test"

import { parsePresentation } from "./content"
import { isPresentationToken, presentationPath } from "./token"

const token = "0123456789abcdef0123456789abcdef"

const project = {
  scope: "project",
  clubName: "AI 모각코",
  showNames: false,
  publishedAt: "2026-10-11T03:00:00+00:00",
  project: { name: "RAG 챗봇", goal: "자료를 찾아 준다", status: "active", createdAt: "2026-10-01T00:00:00+00:00" },
  participantCount: 3,
  participantNames: null,
  links: [{ label: "저장소", url: "https://example.com/repo" }],
  tasks: [{ title: "평가 질문 만들기", done: true }],
  logCount: 4,
  logs: [
    {
      title: "청크 크기를 비교했다",
      tools: ["Claude"],
      attempt: "세 가지 크기로 나눴다",
      result: "",
      learned: "중간 크기가 낫다",
      nextAction: "",
      createdAt: "2026-10-08T10:00:00+00:00",
      author: null,
    },
  ],
}

test("링크 값은 32자의 16진수만 받는다", () => {
  assert.equal(isPresentationToken(token), true)
  assert.equal(isPresentationToken(token.toUpperCase()), false)
  assert.equal(isPresentationToken(token.slice(1)), false)
  assert.equal(isPresentationToken(`${token}0`), false)
  assert.equal(isPresentationToken("../clubs"), false)
  assert.equal(isPresentationToken(null), false)
  assert.equal(presentationPath(token), `/p/${token}`)
})

test("Project 발표를 그대로 읽는다", () => {
  const parsed = parsePresentation(project)
  assert.equal(parsed?.scope, "project")
  assert.deepEqual(parsed, project)
})

test("발표로 볼 수 없는 값은 받지 않는다", () => {
  assert.equal(parsePresentation(null), null)
  assert.equal(parsePresentation("발표"), null)
  assert.equal(parsePresentation([]), null)
  assert.equal(parsePresentation({ ...project, scope: "slides" }), null)
  assert.equal(parsePresentation({ ...project, clubName: "" }), null)
  assert.equal(parsePresentation({ ...project, project: { name: "" } }), null)
})

test("누르면 실행되는 주소의 링크는 뺀다", () => {
  const parsed = parsePresentation({
    ...project,
    links: [
      { label: "나쁜 링크", url: "javascript:alert(1)" },
      { label: "자료", url: "data:text/html,x" },
      { label: "", url: "https://example.com" },
      { label: "저장소", url: "https://example.com/repo" },
    ],
  })
  assert.equal(parsed?.scope, "project")
  assert.deepEqual(parsed?.scope === "project" && parsed.links, [
    { label: "저장소", url: "https://example.com/repo" },
  ])
})

test("이름을 보이지 않는 발표에서는 이름이 와도 쓰지 않는다", () => {
  const parsed = parsePresentation({ ...project, participantNames: ["김하늘"] })
  assert.equal(parsed?.scope === "project" && parsed.participantNames, null)
})

test("이름을 보이는 발표에서 빈 이름은 null 로 둔다", () => {
  const parsed = parsePresentation({
    ...project,
    showNames: true,
    participantNames: ["김하늘", null, "  ", 3],
    logs: [{ ...project.logs[0], author: "박서연" }, { ...project.logs[0], author: " " }],
  })
  assert.equal(parsed?.scope, "project")
  if (parsed?.scope === "project") {
    assert.deepEqual(parsed.participantNames, ["김하늘", null, null, null])
    assert.deepEqual(parsed.logs.map((log) => log.author), ["박서연", null])
  }
})

test("모양이 틀린 항목은 빼고 나머지는 남긴다", () => {
  const parsed = parsePresentation({
    ...project,
    project: { ...project.project, status: "paused", createdAt: "언젠가" },
    participantCount: -3,
    logCount: "많이",
    tasks: [{ title: "할 일" }, { done: true }, "글자"],
    logs: [{ title: "" }, null, { title: "제목만 있는 기록", tools: [1, "Claude", ""] }],
  })
  assert.equal(parsed?.scope, "project")
  if (parsed?.scope === "project") {
    assert.equal(parsed.project.status, "planning")
    assert.equal(parsed.project.createdAt, "")
    assert.equal(parsed.participantCount, 0)
    assert.equal(parsed.logCount, 0)
    assert.deepEqual(parsed.tasks, [{ title: "할 일", done: false }])
    assert.deepEqual(parsed.logs.map((log) => [log.title, log.tools, log.attempt]), [
      ["제목만 있는 기록", ["Claude"], ""],
    ])
  }
})

test("Club 발표를 읽고, 링크 값이 틀린 Project 는 뺀다", () => {
  const parsed = parsePresentation({
    scope: "club",
    clubName: "AI 모각코",
    clubDescription: "매주 모인다",
    showNames: true,
    publishedAt: "2026-10-11T03:00:00+00:00",
    memberCount: 14,
    memberNames: ["김하늘", null],
    logCount: 23,
    projectCount: 2,
    sessions: [{ title: "1회차", startsAt: "2026-10-01T10:00:00+00:00" }, { startsAt: "2026-10-08T10:00:00+00:00" }],
    projects: [
      { name: "RAG 챗봇", goal: "", status: "done", token },
      { name: "링크 값이 틀린 것", goal: "", status: "done", token: "../../login" },
    ],
  })
  assert.equal(parsed?.scope, "club")
  if (parsed?.scope === "club") {
    assert.equal(parsed.memberCount, 14)
    assert.deepEqual(parsed.memberNames, ["김하늘", null])
    assert.deepEqual(parsed.sessions, [{ title: "1회차", startsAt: "2026-10-01T10:00:00+00:00" }])
    assert.deepEqual(parsed.projects, [{ name: "RAG 챗봇", goal: "", status: "done", token }])
  }
})
