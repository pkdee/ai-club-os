import {
  isProjectStatus,
  linkUrlError,
  type ProjectStatus,
} from "@/features/project/rules"

import { isPresentationToken } from "./token"

// 발표에 담기는 내용. 데이터베이스의 get_presentation 함수가 돌려주는 값을 이 모양으로 다듬어 쓴다.
// 밖으로 나가는 화면에 그리는 값이라, 받은 값을 그대로 믿지 않고 모양을 모두 확인한다.

export type PublicLog = {
  title: string
  tools: string[]
  attempt: string
  result: string
  learned: string
  nextAction: string
  createdAt: string
  // 이름을 보이지 않는 발표이거나, 작성자가 나갔거나, 내보낼 이름이 없으면 null 이다.
  author: string | null
}

// 발표에만 보이는 소개 글의 길이. 데이터베이스의 check 제약과 같은 값이어야 한다.
export const PRESENTATION_INTRO_MAX = 600

export type ProjectPresentation = {
  scope: "project"
  clubName: string
  showNames: boolean
  publishedAt: string
  // 공개하는 사람이 적은 소개 글. 적지 않았으면 빈 글자다.
  intro: string
  project: {
    name: string
    goal: string
    status: ProjectStatus
    createdAt: string
  }
  participantCount: number
  // 이름을 보이지 않는 발표이면 null 이다. 내보낼 이름이 없는 사람은 목록 안에서 null 이다.
  participantNames: (string | null)[] | null
  links: { label: string; url: string }[]
  tasks: { title: string; done: boolean }[]
  // 이 Project 에 묶인 AI Log 전체의 수. 발표에 들어간 것보다 많을 수 있다.
  logCount: number
  logs: PublicLog[]
}

export type ClubPresentation = {
  scope: "club"
  clubName: string
  clubDescription: string
  showNames: boolean
  publishedAt: string
  intro: string
  memberCount: number
  memberNames: (string | null)[] | null
  logCount: number
  projectCount: number
  sessions: { title: string; startsAt: string }[]
  // 발표가 공개된 Project. token 은 그 발표의 링크 값이다.
  projects: { name: string; goal: string; status: ProjectStatus; token: string }[]
}

export type PublicPresentation = ProjectPresentation | ClubPresentation

export type PresentationStat = { label: string; value: string; caption?: string }

// 발표의 맨 위에 숫자로 보여 주는 것들. 이어 보는 화면과 한 장씩 넘겨 보는 화면이 같은 값을 쓴다.
export function presentationStats(
  presentation: PublicPresentation
): PresentationStat[] {
  if (presentation.scope === "project") {
    const { tasks, logs } = presentation
    const done = tasks.filter((task) => task.done).length

    return [
      {
        label: "남긴 AI Log",
        value: `${presentation.logCount}개`,
        caption: `이 가운데 ${logs.length}개를 발표에 담았습니다`,
      },
      tasks.length > 0
        ? {
            label: "할 일",
            value: `${done} / ${tasks.length}`,
            caption: "끝낸 일과 전체",
          }
        : { label: "할 일", value: "없음" },
      { label: "참여자", value: `${presentation.participantCount}명` },
    ]
  }

  return [
    { label: "Member", value: `${presentation.memberCount}명` },
    { label: "진행한 Session", value: `${presentation.sessions.length}회` },
    { label: "AI Log", value: `${presentation.logCount}개` },
    { label: "Project", value: `${presentation.projectCount}개` },
  ]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function text(value: unknown) {
  return typeof value === "string" ? value : ""
}

function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0
}

function list(value: unknown) {
  return Array.isArray(value) ? value : []
}

// 날짜로 읽을 수 있는 글자만 받는다. 아니면 빈 글자다.
function time(value: unknown) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime())
    ? value
    : ""
}

function names(value: unknown): (string | null)[] | null {
  return Array.isArray(value)
    ? value.map((name) =>
        typeof name === "string" && name.trim() !== "" ? name : null
      )
    : null
}

function status(value: unknown): ProjectStatus {
  return isProjectStatus(value) ? value : "planning"
}

function parseLog(value: unknown): PublicLog[] {
  if (!isRecord(value) || text(value.title) === "") {
    return []
  }
  return [
    {
      title: text(value.title),
      tools: list(value.tools).filter(
        (tool): tool is string => typeof tool === "string" && tool !== ""
      ),
      attempt: text(value.attempt),
      result: text(value.result),
      learned: text(value.learned),
      nextAction: text(value.nextAction),
      createdAt: time(value.createdAt),
      author:
        typeof value.author === "string" && value.author.trim() !== ""
          ? value.author
          : null,
    },
  ]
}

// 받은 값을 발표의 모양으로 다듬는다. 발표로 볼 수 없는 값이면 null 이다.
export function parsePresentation(value: unknown): PublicPresentation | null {
  if (!isRecord(value) || text(value.clubName) === "") {
    return null
  }
  const base = {
    clubName: text(value.clubName),
    showNames: value.showNames === true,
    publishedAt: time(value.publishedAt),
    intro: text(value.intro).trim(),
  }

  if (value.scope === "project") {
    const project = value.project
    if (!isRecord(project) || text(project.name) === "") {
      return null
    }
    return {
      scope: "project",
      ...base,
      project: {
        name: text(project.name),
        goal: text(project.goal),
        status: status(project.status),
        createdAt: time(project.createdAt),
      },
      participantCount: count(value.participantCount),
      participantNames: base.showNames ? names(value.participantNames) : null,
      // 누르면 열리는 주소라서 http 와 https 만 남긴다.
      links: list(value.links).flatMap((link) =>
        isRecord(link) &&
        text(link.label) !== "" &&
        linkUrlError(text(link.url)) === null
          ? [{ label: text(link.label), url: text(link.url) }]
          : []
      ),
      tasks: list(value.tasks).flatMap((task) =>
        isRecord(task) && text(task.title) !== ""
          ? [{ title: text(task.title), done: task.done === true }]
          : []
      ),
      logCount: count(value.logCount),
      logs: list(value.logs).flatMap(parseLog),
    }
  }

  if (value.scope === "club") {
    return {
      scope: "club",
      ...base,
      clubDescription: text(value.clubDescription),
      memberCount: count(value.memberCount),
      memberNames: base.showNames ? names(value.memberNames) : null,
      logCount: count(value.logCount),
      projectCount: count(value.projectCount),
      sessions: list(value.sessions).flatMap((session) =>
        isRecord(session) && text(session.title) !== ""
          ? [{ title: text(session.title), startsAt: time(session.startsAt) }]
          : []
      ),
      projects: list(value.projects).flatMap((project) =>
        isRecord(project) &&
        text(project.name) !== "" &&
        isPresentationToken(project.token)
          ? [
              {
                name: text(project.name),
                goal: text(project.goal),
                status: status(project.status),
                token: project.token,
              },
            ]
          : []
      ),
    }
  }

  return null
}
