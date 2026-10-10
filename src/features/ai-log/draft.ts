import type { AiLogInput } from "./rules"

// 쓰다 만 AI Log 를 브라우저에 잠시 맡겨 두는 규칙. 맡겨 둔 내용은 서버로 보내지 않는다.

const VERSION = 1
// 이 기간이 지난 것은 버린다.
export const AI_LOG_DRAFT_DAYS = 7

export type AiLogDraft = {
  // 맡겨 둔 시각.
  savedAt: string
  values: AiLogInput
}

// 맡겨 둘 때 쓰는 이름. 사람과 Club, 기록마다 따로 둔다.
// 같은 브라우저를 다른 계정이 쓰더라도 서로의 내용이 보이지 않는다. logId 가 없으면 새 기록이다.
export function draftKey(userId: string, clubId: string, logId?: string) {
  return `ai-club-os:ai-log-draft:${userId}:${clubId}:${logId ?? "new"}`
}

const TEXT_FIELDS = [
  "title",
  "attempt",
  "result",
  "learned",
  "nextAction",
] as const

function sameTools(a: string[], b: string[]) {
  return a.length === b.length && a.every((tool, index) => tool === b[index])
}

// 맡겨 둘 만큼 달라졌는지 본다. 적는 칸이나 도구가 처음 값과 다르면 달라진 것이다.
// Session 이나 Project 만 바꾼 것은 다시 고르기 쉬우므로 달라진 것으로 치지 않는다.
export function hasDraftContent(values: AiLogInput, defaults: AiLogInput) {
  return (
    TEXT_FIELDS.some((name) => values[name] !== defaults[name]) ||
    !sameTools(values.tools, defaults.tools)
  )
}

export function serializeDraft(values: AiLogInput, now: Date) {
  return JSON.stringify({ v: VERSION, savedAt: now.toISOString(), values })
}

function isInput(value: unknown): value is AiLogInput {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const input = value as Record<string, unknown>

  return (
    typeof input.sessionId === "string" &&
    // Project 를 고르는 칸이 생기기 전에 맡겨 둔 것에는 이 값이 없다.
    (input.projectId === undefined || typeof input.projectId === "string") &&
    TEXT_FIELDS.every((name) => typeof input[name] === "string") &&
    Array.isArray(input.tools) &&
    input.tools.every((tool) => typeof tool === "string")
  )
}

// 맡겨 둔 글자를 읽는다. 모양이 틀렸거나 기한이 지났으면 null 이다.
// 브라우저에 있던 값은 누가 고쳤을 수 있으므로 모양을 모두 확인한다.
export function parseDraft(raw: string | null, now: Date): AiLogDraft | null {
  if (!raw) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null
  }

  const { v, savedAt, values } = parsed as Record<string, unknown>
  if (v !== VERSION || typeof savedAt !== "string" || !isInput(values)) {
    return null
  }

  const age = now.getTime() - new Date(savedAt).getTime()
  if (Number.isNaN(age) || age < 0 || age > AI_LOG_DRAFT_DAYS * 24 * 60 * 60 * 1000) {
    return null
  }

  return {
    savedAt,
    values: {
      sessionId: values.sessionId,
      projectId: values.projectId ?? "",
      title: values.title,
      tools: [...values.tools],
      attempt: values.attempt,
      result: values.result,
      learned: values.learned,
      nextAction: values.nextAction,
    },
  }
}
