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
  // 비어 있으면 어느 Project 에도 묶지 않는다.
  projectId: string
  title: string
  tools: string[]
  attempt: string
  result: string
  learned: string
  nextAction: string
}

export type AiLogInputErrors = Partial<Record<keyof AiLogInput, string>>

// 작성자가 기록마다 정하는 두 가지 선택. 둘 다 기본은 꺼짐이다.
export type AiLogOptions = {
  // 켜면 AI Insight 를 만들 때 이 기록을 AI 로 보내지 않는다.
  excludeFromInsight: boolean
  // 켜면 이 기록이 묶인 Project 의 발표에 들어가 Club 밖에서도 보인다.
  shareInPresentation: boolean
}

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

// 브라우저가 줄바꿈을 두 글자로 보내는 경우가 있어 한 글자로 맞춘다. 글자 수 제한이 어긋나지 않게 하려는 것이다.
function formText(formData: FormData, name: string) {
  return String(formData.get(name) ?? "")
    .replace(/\r\n?/g, "\n")
    .trim()
}

// 폼에 적힌 값을 입력으로 읽는다. 저장할 때와 쓰다 만 내용을 맡겨 둘 때 같은 방식으로 읽는다.
export function readAiLogForm(formData: FormData): AiLogInput {
  return {
    sessionId: formText(formData, "sessionId"),
    projectId: formText(formData, "projectId"),
    title: formText(formData, "title"),
    tools: normalizeTools(formData.getAll("tools").map(String)),
    attempt: formText(formData, "attempt"),
    result: formText(formData, "result"),
    learned: formText(formData, "learned"),
    nextAction: formText(formData, "nextAction"),
  }
}

// 폼에서 고른 선택을 읽는다. 선택 칸이 화면에 없었으면 null 이다.
// 데이터베이스에 그 열이 아직 없을 때는 칸을 그리지 않으므로, null 이면 저장할 때 보내지 않는다.
export function readAiLogOptions(formData: FormData): AiLogOptions | null {
  if (formData.get("optionsField") !== "1") {
    return null
  }
  return {
    excludeFromInsight: formData.get("excludeFromInsight") === "on",
    shareInPresentation: formData.get("shareInPresentation") === "on",
  }
}

export function validateAiLog(input: AiLogInput): AiLogValidation {
  const errors: AiLogInputErrors = {}

  if (input.sessionId && !isUuid(input.sessionId)) {
    errors.sessionId = "Session 을 다시 골라 주세요."
  }

  if (input.projectId && !isUuid(input.projectId)) {
    errors.projectId = "Project 를 다시 골라 주세요."
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
