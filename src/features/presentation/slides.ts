import type { ProjectStatus } from "@/features/project/rules"

import {
  presentationStats,
  type ClubPresentation,
  type PresentationStat,
  type PublicLog,
  type PublicPresentation,
  type PublicRetrospective,
} from "./content"

// 발표를 한 장씩 넘겨 보는 화면에 쓰는 장의 모양.
// 이어 보는 화면과 같은 내용을 장으로 나눈 것이고, 여기서 새로 더하는 내용은 없다.
export type Slide =
  | {
      kind: "cover"
      overline: string
      title: string
      // Club 발표에는 진행 상태가 없다.
      status: ProjectStatus | null
      lead: string
    }
  | { kind: "text"; title: string; body: string }
  | { kind: "stats"; title: string; items: PresentationStat[] }
  | { kind: "links"; title: string; items: { label: string; url: string }[] }
  // position 은 발표에 담은 기록 가운데 몇째인지다. 1 부터 센다.
  | { kind: "log"; position: number; total: number; log: PublicLog }
  // position 은 발표에 담은 회고 가운데 몇째인지다. 1 부터 센다.
  | {
      kind: "retrospective"
      position: number
      total: number
      retrospective: PublicRetrospective
    }
  | {
      kind: "tasks"
      title: string
      done: number
      total: number
      items: { title: string; done: boolean }[]
    }
  | { kind: "projects"; title: string; items: ClubPresentation["projects"] }
  | { kind: "sessions"; title: string; items: ClubPresentation["sessions"] }
  | { kind: "names"; title: string; unit: string; names: (string | null)[] }
  | { kind: "end"; title: string }

// 한 장에 담는 항목의 수. 넘으면 다음 장으로 넘긴다.
export const SLIDE_PAGE_SIZE = {
  links: 6,
  tasks: 8,
  projects: 4,
  sessions: 8,
} as const

// 항목을 한 장에 담을 만큼씩 나눈다. 항목이 없으면 장도 없다.
function pages<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let start = 0; start < items.length; start += size) {
    result.push(items.slice(start, start + size))
  }
  return result
}

// 여러 장으로 나뉜 것은 제목에 몇째 장인지 붙인다.
function pageTitle(title: string, index: number, count: number) {
  return count > 1 ? `${title} (${index + 1} / ${count})` : title
}

// 발표를 장으로 나눈다. 내용이 없는 부분은 장을 만들지 않는다.
export function buildSlides(presentation: PublicPresentation): Slide[] {
  const slides: Slide[] = []
  const intro: Slide[] = presentation.intro
    ? [{ kind: "text", title: "소개", body: presentation.intro }]
    : []
  const stats: Slide = {
    kind: "stats",
    title: "한눈에 보기",
    items: presentationStats(presentation),
  }

  if (presentation.scope === "project") {
    const { project, links, tasks, logs, retrospectives } = presentation
    const done = tasks.filter((task) => task.done).length

    slides.push(
      {
        kind: "cover",
        overline: `${presentation.clubName} 의 PROJECT`,
        title: project.name,
        status: project.status,
        lead: project.goal,
      },
      ...intro,
      stats
    )
    pages(links, SLIDE_PAGE_SIZE.links).forEach((items, index, all) =>
      slides.push({
        kind: "links",
        title: pageTitle("결과물", index, all.length),
        items,
      })
    )
    logs.forEach((log, index) =>
      slides.push({ kind: "log", position: index + 1, total: logs.length, log })
    )
    retrospectives.forEach((retrospective, index) =>
      slides.push({
        kind: "retrospective",
        position: index + 1,
        total: retrospectives.length,
        retrospective,
      })
    )
    pages(tasks, SLIDE_PAGE_SIZE.tasks).forEach((items, index, all) =>
      slides.push({
        kind: "tasks",
        title: pageTitle("할 일", index, all.length),
        done,
        total: tasks.length,
        items,
      })
    )
    if (presentation.participantNames?.length) {
      slides.push({
        kind: "names",
        title: "참여자",
        unit: "참여자",
        names: presentation.participantNames,
      })
    }
    slides.push({ kind: "end", title: project.name })
    return slides
  }

  slides.push(
    {
      kind: "cover",
      overline: "CLUB",
      title: presentation.clubName,
      status: null,
      lead: presentation.clubDescription,
    },
    ...intro,
    stats
  )
  pages(presentation.projects, SLIDE_PAGE_SIZE.projects).forEach(
    (items, index, all) =>
      slides.push({
        kind: "projects",
        title: pageTitle("Project", index, all.length),
        items,
      })
  )
  pages(presentation.sessions, SLIDE_PAGE_SIZE.sessions).forEach(
    (items, index, all) =>
      slides.push({
        kind: "sessions",
        title: pageTitle("진행한 Session", index, all.length),
        items,
      })
  )
  if (presentation.memberNames?.length) {
    slides.push({
      kind: "names",
      title: "Member",
      unit: "Member",
      names: presentation.memberNames,
    })
  }
  slides.push({ kind: "end", title: presentation.clubName })
  return slides
}

// 주소에 적힌 장 번호를 읽는다. 1 부터 세는 값을 0 부터 세는 값으로 바꾸고, 틀린 값은 첫 장으로 본다.
export function slideIndex(value: unknown, total: number) {
  const text = Array.isArray(value) ? value[0] : value
  if (typeof text !== "string" || !/^\d{1,4}$/.test(text)) {
    return 0
  }
  return Math.min(Math.max(Number(text) - 1, 0), Math.max(total - 1, 0))
}
