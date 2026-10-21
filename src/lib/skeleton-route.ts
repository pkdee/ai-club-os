// 불러오는 동안 보여 줄 자리 표시를 주소로 고른다.
// loading.tsx 는 주소를 받지 못하고, 한 loading.tsx 가 그 아래의 여러 화면을 덮는다. 그래서 브라우저의 주소를 읽어 화면을 가린다.
// 주소의 모양만 보며, 맞는 화면이 없으면 other 다.

export type SessionTab = "overview" | "attendance" | "logs" | "insight" | "retros"

export type ClubPage =
  | { kind: "overview" }
  | { kind: "sessions" }
  | { kind: "session"; tab: SessionTab }
  | { kind: "logs" }
  | { kind: "log-form" }
  | { kind: "log" }
  | { kind: "insights" }
  | { kind: "insight-month" }
  | { kind: "projects" }
  | { kind: "project" }
  | { kind: "retros" }
  | { kind: "retro-month" }
  | { kind: "members" }
  | { kind: "notifications" }
  | { kind: "settings" }
  | { kind: "docs" }
  | { kind: "other" }

export type AppPage =
  | { area: "club"; page: ClubPage }
  | { area: "home" }
  | { area: "account" }
  | { area: "join" }
  | { area: "presentation" }
  | { area: "slides" }
  | { area: "other" }

const SESSION_TABS: readonly SessionTab[] = [
  "attendance",
  "logs",
  "insight",
  "retros",
]

// 목록 화면과 그 아래 하나를 보는 화면이 짝인 곳. 주소가 /<이름> 이면 목록, /<이름>/<id> 면 하나다.
const LIST_AND_ITEM: Record<string, [ClubPage, ClubPage]> = {
  insights: [{ kind: "insights" }, { kind: "insight-month" }],
  projects: [{ kind: "projects" }, { kind: "project" }],
  retros: [{ kind: "retros" }, { kind: "retro-month" }],
}

// 아래에 다른 화면이 없는 곳.
const SINGLE: Record<string, ClubPage> = {
  members: { kind: "members" },
  notifications: { kind: "notifications" },
  settings: { kind: "settings" },
}

const OTHER: ClubPage = { kind: "other" }

// /clubs/<clubId> 뒤의 조각들로 Club 안쪽 화면을 고른다.
export function clubPage(segments: readonly string[]): ClubPage {
  const [section, id, sub, ...rest] = segments
  if (section === undefined) {
    return { kind: "overview" }
  }

  if (section === "sessions") {
    if (id === undefined) {
      return { kind: "sessions" }
    }
    if (sub === undefined) {
      return { kind: "session", tab: "overview" }
    }
    const tab = SESSION_TABS.find((name) => name === sub)
    return tab && rest.length === 0 ? { kind: "session", tab } : OTHER
  }

  if (section === "logs") {
    if (id === undefined) {
      return { kind: "logs" }
    }
    if (id === "new") {
      return sub === undefined ? { kind: "log-form" } : OTHER
    }
    if (sub === undefined) {
      return { kind: "log" }
    }
    return sub === "edit" && rest.length === 0 ? { kind: "log-form" } : OTHER
  }

  if (section === "docs") {
    return sub === undefined ? { kind: "docs" } : OTHER
  }

  const pair = LIST_AND_ITEM[section]
  if (pair) {
    if (id === undefined) {
      return pair[0]
    }
    return sub === undefined ? pair[1] : OTHER
  }

  const single = SINGLE[section]
  return single && id === undefined ? single : OTHER
}

// 주소 전체로 화면을 고른다. 쿼리와 해시는 usePathname 이 이미 떼어 낸 것으로 본다.
export function appPage(pathname: string): AppPage {
  const segments = pathname.split("/").filter(Boolean)
  const [first, second, third, ...rest] = segments

  if (first === undefined) {
    return { area: "home" }
  }
  if (first === "clubs" && second !== undefined) {
    return { area: "club", page: clubPage(segments.slice(2)) }
  }
  if (first === "account" && second === undefined) {
    return { area: "account" }
  }
  if (first === "join" && second !== undefined && third === undefined) {
    return { area: "join" }
  }
  if (first === "p" && second !== undefined) {
    if (third === undefined) {
      return { area: "presentation" }
    }
    if (third === "slides" && rest.length === 0) {
      return { area: "slides" }
    }
  }
  return { area: "other" }
}
