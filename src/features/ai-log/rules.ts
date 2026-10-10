import { isUuid } from "@/lib/uuid"

import { knownToolName } from "./tool-catalog"
import { toolKey } from "./tool-key"

export { toolKey }

// AI Log 입력 규칙. 데이터베이스의 check 제약과 같은 값이어야 한다. 입력 항목은 잠정 결정이다.
export const AI_LOG_TITLE_MAX = 100
export const AI_LOG_TEXT_MAX = 5000
export const AI_LOG_TOOL_NAME_MAX = 30
export const AI_LOG_TOOL_COUNT_MAX = 10

export type AiLogInput = {
  // 비어 있으면 Session 없이 Club 의 기록으로 남긴다.
  sessionId: string
  title: string
  tools: string[]
  attempt: string
  result: string
  learned: string
  nextAction: string
}

export type AiLogInputErrors = Partial<Record<keyof AiLogInput, string>>

export type AiLogValidation =
  | { ok: true }
  | { ok: false; errors: AiLogInputErrors }

// 데이터베이스가 글자 수를 세는 방식과 맞춘다.
function length(value: string) {
  return Array.from(value).length
}

// 도구 이름을 다듬는다. 쉼표로 나누고, 빈 값과 표기만 다른 중복을 뺀다.
export function normalizeTools(values: string[]) {
  const seen = new Set<string>()
  const tools: string[] = []

  for (const value of values.flatMap((item) => item.split(","))) {
    const tool = value.trim().replace(/\s+/g, " ")
    const key = toolKey(tool)
    if (key && !seen.has(key)) {
      seen.add(key)
      tools.push(tool)
    }
  }
  return tools
}

// 입력한 도구 이름의 표기를 맞춘다.
// 널리 쓰는 도구 목록에 있으면 그 표기로("챗지피티" 는 "ChatGPT" 로), 없으면 이 Club 에서 이미 쓰는 표기로 바꾼다.
// 어디에도 없는 도구는 입력한 그대로 둔다.
export function canonicalTools(entered: string[], clubTools: string[]) {
  const spelling = new Map<string, string>()
  for (const tool of clubTools) {
    if (!spelling.has(toolKey(tool))) {
      spelling.set(toolKey(tool), tool)
    }
  }
  return normalizeTools(
    entered.map(
      (tool) => knownToolName(tool) ?? spelling.get(toolKey(tool)) ?? tool
    )
  )
}

export function validateAiLog(input: AiLogInput): AiLogValidation {
  const errors: AiLogInputErrors = {}

  if (input.sessionId && !isUuid(input.sessionId)) {
    errors.sessionId = "Session 을 다시 골라 주세요."
  }

  if (length(input.title) === 0) {
    errors.title = "제목을 입력해 주세요."
  } else if (length(input.title) > AI_LOG_TITLE_MAX) {
    errors.title = `제목은 ${AI_LOG_TITLE_MAX}자 이내로 적어 주세요.`
  }

  if (input.tools.length > AI_LOG_TOOL_COUNT_MAX) {
    errors.tools = `도구는 ${AI_LOG_TOOL_COUNT_MAX}개까지 넣을 수 있습니다.`
  } else if (input.tools.some((tool) => length(tool) > AI_LOG_TOOL_NAME_MAX)) {
    errors.tools = `도구 이름은 ${AI_LOG_TOOL_NAME_MAX}자 이내로 적어 주세요.`
  }

  if (length(input.attempt) === 0) {
    errors.attempt = "시도한 내용을 입력해 주세요. 짧게 적어도 됩니다."
  } else if (length(input.attempt) > AI_LOG_TEXT_MAX) {
    errors.attempt = `시도한 내용은 ${AI_LOG_TEXT_MAX}자 이내로 적어 주세요.`
  }

  const optional = [
    ["result", "결과는"],
    ["learned", "배운 점은"],
    ["nextAction", "다음 행동은"],
  ] as const
  for (const [name, label] of optional) {
    if (length(input[name]) > AI_LOG_TEXT_MAX) {
      errors[name] = `${label} ${AI_LOG_TEXT_MAX}자 이내로 적어 주세요.`
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true }
}
