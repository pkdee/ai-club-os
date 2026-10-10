// Project 입력 규칙. 데이터베이스의 check 제약과 같은 값이어야 한다.
export const PROJECT_NAME_MAX = 80
export const PROJECT_GOAL_MAX = 2000
export const PROJECT_LINK_LABEL_MAX = 60
export const PROJECT_LINK_URL_MAX = 500
export const PROJECT_TASK_TITLE_MAX = 120
// 한 Project 에 둘 수 있는 링크와 할 일의 수. 데이터베이스는 막지 않고 앱이 넣기 전에 확인한다.
export const PROJECT_LINK_LIMIT = 20
export const PROJECT_TASK_LIMIT = 100

// 진행 상태 값은 데이터베이스의 projects.status 와 같아야 한다.
export const PROJECT_STATUSES = ["planning", "active", "done"] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "준비",
  active: "진행 중",
  done: "완료",
}

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus)
}

export type ProjectInput = {
  name: string
  goal: string
}

export type ProjectInputErrors = Partial<Record<keyof ProjectInput, string>>

// 데이터베이스가 글자 수를 세는 방식과 맞춘다.
function length(value: string) {
  return Array.from(value).length
}

// 틀린 것이 없으면 null 이다.
export function validateProject(input: ProjectInput): ProjectInputErrors | null {
  const errors: ProjectInputErrors = {}

  if (length(input.name) === 0) {
    errors.name = "Project 이름을 입력해 주세요."
  } else if (length(input.name) > PROJECT_NAME_MAX) {
    errors.name = `Project 이름은 ${PROJECT_NAME_MAX}자 이내로 적어 주세요.`
  }
  if (length(input.goal) > PROJECT_GOAL_MAX) {
    errors.goal = `목표는 ${PROJECT_GOAL_MAX}자 이내로 적어 주세요.`
  }

  return Object.keys(errors).length > 0 ? errors : null
}

// 결과물 링크의 주소를 확인한다. 맞으면 null, 틀리면 그 까닭을 돌려준다.
// http 와 https 주소만 받는다. 누르면 실행되는 다른 모양의 주소를 막으려는 것이다.
export function linkUrlError(url: string): string | null {
  if (url === "") {
    return "주소를 입력해 주세요."
  }
  if (length(url) > PROJECT_LINK_URL_MAX) {
    return `주소는 ${PROJECT_LINK_URL_MAX}자 이내로 적어 주세요.`
  }
  if (/\s/.test(url)) {
    return "주소에는 공백을 넣을 수 없습니다."
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return "주소가 맞는지 확인해 주세요. https:// 로 시작해야 합니다."
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "http:// 나 https:// 로 시작하는 주소만 넣을 수 있습니다."
  }
  return null
}

export function linkLabelError(label: string): string | null {
  if (length(label) === 0) {
    return "링크의 이름을 입력해 주세요."
  }
  if (length(label) > PROJECT_LINK_LABEL_MAX) {
    return `링크의 이름은 ${PROJECT_LINK_LABEL_MAX}자 이내로 적어 주세요.`
  }
  return null
}

export function taskTitleError(title: string): string | null {
  if (length(title) === 0) {
    return "할 일을 입력해 주세요."
  }
  if (length(title) > PROJECT_TASK_TITLE_MAX) {
    return `할 일은 ${PROJECT_TASK_TITLE_MAX}자 이내로 적어 주세요.`
  }
  return null
}

// 주소에서 보여 줄 짧은 이름을 꺼낸다. 예: github.com
export function linkHost(url: string) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

// 기한은 날짜만 받는다. 예: 2026-10-20. 없는 날짜(2월 31일 같은 것)는 받지 않는다.
export function isDueDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

// 기한이 지났는지 본다. today 는 한국 시간의 오늘 날짜(YYYY-MM-DD)다.
// 기한 당일은 지난 것이 아니고, 끝낸 일은 기한이 지나도 지난 것으로 치지 않는다.
export function isOverdue(dueOn: string | null, done: boolean, today: string) {
  return !done && dueOn !== null && dueOn < today
}

// 예: 10월 20일. 올해가 아니면 해도 붙인다. 예: 2027년 1월 5일
export function formatDueDate(dueOn: string, today: string) {
  const [year, month, day] = dueOn.split("-").map(Number)
  const label = `${month}월 ${day}일`
  return dueOn.slice(0, 4) === today.slice(0, 4) ? label : `${year}년 ${label}`
}
