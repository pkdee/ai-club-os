import { isUuid } from "@/lib/uuid"

// AI Insight 의 내용. 데이터베이스에는 이 모양의 JSON 으로 들어간다.
// AI 가 만든 것과 데이터베이스에서 읽은 것 모두 믿지 않고, 쓰기 전에 항상 이 파일의 함수로 다듬는다.

export const INSIGHT_OVERVIEW_MAX = 600
export const INSIGHT_THEME_TITLE_MAX = 60
export const INSIGHT_TEXT_MAX = 300
export const INSIGHT_THEME_MAX = 6
export const INSIGHT_ITEM_MAX = 8
// 항목 하나에 달 수 있는 근거 기록 수. 이 한도들을 모두 채워도 데이터베이스의 크기 제한 안에 든다.
export const INSIGHT_LOG_REF_MAX = 10
// 화면에서 항목 하나에 제목으로 보여 주는 근거 기록 수. 나머지는 수로만 알린다.
export const INSIGHT_SHOWN_REFS = 3

// 여러 기록에 함께 나타난 주제.
export type InsightTheme = {
  title: string
  summary: string
  // 근거가 된 AI Log 의 식별자.
  logIds: string[]
}

// 배운 점이나 다음 행동 하나.
export type InsightItem = {
  text: string
  logIds: string[]
}

export type InsightContent = {
  v: 1
  overview: string
  themes: InsightTheme[]
  lessons: InsightItem[]
  nextActions: InsightItem[]
}

// 데이터베이스가 글자 수를 세는 방식과 맞춘다.
function clip(value: unknown, max: number) {
  if (typeof value !== "string") {
    return ""
  }
  return Array.from(value.replace(/\r\n?/g, "\n").trim())
    .slice(0, max)
    .join("")
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function logIds(value: unknown) {
  const ids: string[] = []
  for (const id of list(value)) {
    if (typeof id === "string" && isUuid(id) && !ids.includes(id)) {
      ids.push(id)
    }
  }
  return ids.slice(0, INSIGHT_LOG_REF_MAX)
}

function items(value: unknown): InsightItem[] {
  return list(value)
    .map((item) => {
      const fields = record(item)
      return {
        text: clip(fields.text, INSIGHT_TEXT_MAX),
        logIds: logIds(fields.logIds),
      }
    })
    .filter((item) => item.text !== "")
    .slice(0, INSIGHT_ITEM_MAX)
}

// 받은 값을 내용으로 다듬는다. 글자는 다듬고 자르며, 빈 항목과 정해진 수를 넘는 항목은 뺀다.
// 모양이 아예 다르거나 남는 내용이 없으면 null 이다.
export function parseInsightContent(value: unknown): InsightContent | null {
  const fields = record(value)
  if (fields.v !== 1) {
    return null
  }

  const content: InsightContent = {
    v: 1,
    overview: clip(fields.overview, INSIGHT_OVERVIEW_MAX),
    themes: list(fields.themes)
      .map((theme) => {
        const themeFields = record(theme)
        return {
          title: clip(themeFields.title, INSIGHT_THEME_TITLE_MAX),
          summary: clip(themeFields.summary, INSIGHT_TEXT_MAX),
          logIds: logIds(themeFields.logIds),
        }
      })
      .filter((theme) => theme.title !== "")
      .slice(0, INSIGHT_THEME_MAX),
    lessons: items(fields.lessons),
    nextActions: items(fields.nextActions),
  }

  return isEmptyInsight(content) ? null : content
}

export function isEmptyInsight(content: InsightContent) {
  return (
    content.overview === "" &&
    content.themes.length === 0 &&
    content.lessons.length === 0 &&
    content.nextActions.length === 0
  )
}

// AI 가 근거로 적은 기록 번호를 식별자로 바꾼다. 번호는 1 부터 세고, 없는 번호는 버린다.
function refs(value: unknown, sourceLogIds: string[]) {
  const ids: string[] = []
  for (const number of list(value)) {
    const id =
      typeof number === "number" && Number.isInteger(number)
        ? sourceLogIds[number - 1]
        : undefined
    if (id && !ids.includes(id)) {
      ids.push(id)
    }
  }
  return ids
}

// AI 가 돌려준 값을 내용으로 바꾼다. sourceLogIds 는 AI 에 보낸 기록의 식별자이고 보낸 순서대로다.
// AI 의 답은 근거를 기록 번호로 적으므로 여기서 식별자로 바꾼 뒤 같은 규칙으로 다듬는다.
export function insightFromAiOutput(
  output: unknown,
  sourceLogIds: string[]
): InsightContent | null {
  const fields = record(output)
  const convert = (value: unknown) =>
    list(value).map((item) => {
      const itemFields = record(item)
      return { ...itemFields, logIds: refs(itemFields.logs, sourceLogIds) }
    })

  return parseInsightContent({
    v: 1,
    overview: fields.overview,
    themes: convert(fields.themes),
    lessons: convert(fields.lessons),
    nextActions: convert(fields.next_actions),
  })
}

// 메신저나 문서에 붙여 넣을 수 있는 글로 바꾼다. title 은 회차의 제목이나 기간의 이름이다.
// 근거 기록은 싣지 않는다. 비어 있는 묶음은 뺀다.
export function insightToText(title: string, content: InsightContent) {
  const lines = [`${title} AI Insight`]
  const section = (heading: string, items: string[]) => {
    if (items.length > 0) {
      lines.push("", heading, ...items)
    }
  }

  section("요약", content.overview ? [content.overview] : [])
  section(
    "반복된 주제",
    content.themes.map((theme) =>
      theme.summary ? `- ${theme.title}: ${theme.summary}` : `- ${theme.title}`
    )
  )
  section("배운 점", content.lessons.map((item) => `- ${item.text}`))
  section("다음 행동", content.nextActions.map((item) => `- ${item.text}`))
  return lines.join("\n")
}

// 화면에 제목으로 보여 줄 근거 기록의 식별자를 겹치지 않게 모은다. 항목마다 앞의 몇 개만 든다.
export function insightShownLogIds(content: InsightContent) {
  const ids = new Set<string>()
  for (const group of [content.themes, content.lessons, content.nextActions]) {
    for (const item of group) {
      for (const id of item.logIds.slice(0, INSIGHT_SHOWN_REFS)) {
        ids.add(id)
      }
    }
  }
  return [...ids]
}
