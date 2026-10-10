import assert from "node:assert/strict"
import { test } from "node:test"

import { editsFromRevisions, type AiLogContent, type AiLogRevision } from "./revisions"

const base: AiLogContent = {
  title: "제목",
  tools: ["Claude"],
  attempt: "시도",
  result: "",
  learned: "",
  nextAction: "",
}
const rev = (id: string, at: string, content: Partial<AiLogContent>): AiLogRevision => ({
  ...base,
  ...content,
  id,
  replacedAt: at,
})

test("수정 기록이 없으면 푼 것도 없다", () => {
  assert.deepEqual(editsFromRevisions(base, []), [])
})

test("가장 최근의 수정은 지금의 내용과 견준다", () => {
  const edits = editsFromRevisions({ ...base, title: "고친 제목" }, [rev("r1", "2026-10-11T05:00:00Z", {})])
  assert.deepEqual(edits, [
    {
      id: "r1",
      at: "2026-10-11T05:00:00Z",
      changes: [{ label: "제목", before: "제목", after: "고친 제목" }],
    },
  ])
})

test("앞선 수정은 그다음에 남은 내용과 견준다", () => {
  const edits = editsFromRevisions({ ...base, attempt: "셋째" }, [
    rev("r2", "2026-10-11T06:00:00Z", { attempt: "둘째" }),
    rev("r1", "2026-10-11T05:00:00Z", { attempt: "첫째" }),
  ])
  assert.deepEqual(
    edits.map((edit) => edit.changes),
    [
      [{ label: "시도한 내용", before: "둘째", after: "셋째" }],
      [{ label: "시도한 내용", before: "첫째", after: "둘째" }],
    ]
  )
})

test("도구가 바뀐 것도 보여 준다", () => {
  const edits = editsFromRevisions({ ...base, tools: ["Claude", "Cursor"] }, [rev("r1", "2026-10-11T05:00:00Z", {})])
  assert.deepEqual(edits[0].changes, [
    { label: "사용한 도구", before: "Claude", after: "Claude, Cursor" },
  ])
})

test("한 번에 여러 항목을 고쳤으면 모두 보여 준다", () => {
  const edits = editsFromRevisions({ ...base, result: "결과", learned: "배움" }, [rev("r1", "2026-10-11T05:00:00Z", {})])
  assert.deepEqual(edits[0].changes.map((change) => change.label), ["결과", "배운 점"])
})
