// AI Log 의 수정 기록. 고치기 전의 내용들을 한 번의 수정에서 무엇이 바뀌었는지로 풀어 보여 준다.

export type AiLogContent = {
  title: string
  tools: string[]
  attempt: string
  result: string
  learned: string
  nextAction: string
}

// 고치기 전의 내용 하나. replacedAt 은 이 내용이 고쳐져 지난 것이 된 시각이다.
export type AiLogRevision = AiLogContent & {
  id: string
  replacedAt: string
}

export type RevisionChange = {
  label: string
  before: string
  after: string
}

// 한 번의 수정. at 은 고친 시각이고 changes 는 그때 바뀐 항목이다.
export type AiLogEdit = {
  id: string
  at: string
  changes: RevisionChange[]
}

const FIELDS: { key: keyof Omit<AiLogContent, "tools">; label: string }[] = [
  { key: "title", label: "제목" },
  { key: "attempt", label: "시도한 내용" },
  { key: "result", label: "결과" },
  { key: "learned", label: "배운 점" },
  { key: "nextAction", label: "다음 행동" },
]

function contentChanges(before: AiLogContent, after: AiLogContent) {
  const changes: RevisionChange[] = FIELDS.filter(
    ({ key }) => before[key] !== after[key]
  ).map(({ key, label }) => ({ label, before: before[key], after: after[key] }))

  const toolsBefore = before.tools.join(", ")
  const toolsAfter = after.tools.join(", ")
  if (toolsBefore !== toolsAfter) {
    changes.push({ label: "사용한 도구", before: toolsBefore, after: toolsAfter })
  }
  return changes
}

// 수정 기록을 최근 수정부터 차례로 푼다. revisions 는 최근에 남은 것부터 온다고 본다.
// 각 수정에서 바뀐 것은, 그때 지난 것이 된 내용과 그다음 내용(더 최근의 수정 기록이나 지금의 내용)을 견줘 구한다.
export function editsFromRevisions(
  current: AiLogContent,
  revisions: AiLogRevision[]
): AiLogEdit[] {
  return revisions.map((revision, index) => ({
    id: revision.id,
    at: revision.replacedAt,
    changes: contentChanges(revision, index === 0 ? current : revisions[index - 1]),
  }))
}
