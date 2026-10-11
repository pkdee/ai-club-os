// Session 과 Project 는 두 가지로 이어진다. 직접 이어 둔 것과, 그 회차에 남긴 AI Log 가 그 Project 에 묶인 것이다.

export type LinkedSession = { id: string; title: string; logCount: number }
export type LinkedProject = { id: string; name: string; logCount: number }

// direct 는 직접 이어 둔 것이라는 뜻이다. 기록만으로 이어진 것은 false 다.
export type SessionLinkItem = LinkedSession & { direct: boolean }
export type ProjectLinkItem = LinkedProject & { direct: boolean }

// 직접 이은 것과 기록으로 이어진 것을 한 목록으로 합친다. 직접 이은 것이 앞에 오고, 그 안에서는 받은 순서다.
function merge<T extends { id: string; logCount: number }, D extends { id: string }>(
  direct: D[],
  viaLogs: T[],
  fill: (item: D) => T
): (T & { direct: boolean })[] {
  const counted = new Map(viaLogs.map((item) => [item.id, item]))
  const linked = new Set(direct.map((item) => item.id))

  return [
    ...direct.map((item) => ({ ...(counted.get(item.id) ?? fill(item)), direct: true })),
    ...viaLogs
      .filter((item) => !linked.has(item.id))
      .map((item) => ({ ...item, direct: false })),
  ]
}

export function mergeProjectLinks(
  direct: { id: string; name: string }[],
  viaLogs: LinkedProject[]
): ProjectLinkItem[] {
  return merge(direct, viaLogs, (item) => ({ ...item, logCount: 0 }))
}

export function mergeSessionLinks(
  direct: { id: string; title: string }[],
  viaLogs: LinkedSession[]
): SessionLinkItem[] {
  return merge(direct, viaLogs, (item) => ({ ...item, logCount: 0 }))
}

// 기록들이 나온 Session 을 기록이 많은 순서로 돌려준다. 수가 같으면 먼저 나온 것이 앞이다.
export function sessionsOfLogs(
  logs: { session: { id: string; title: string } | null }[]
): LinkedSession[] {
  const found = new Map<string, LinkedSession>()
  for (const { session } of logs) {
    if (session) {
      const item = found.get(session.id)
      if (item) {
        item.logCount += 1
      } else {
        found.set(session.id, { ...session, logCount: 1 })
      }
    }
  }
  return [...found.values()].sort((a, b) => b.logCount - a.logCount)
}

// 기록들이 묶인 Project 를 기록이 많은 순서로 돌려준다. 수가 같으면 먼저 나온 것이 앞이다.
export function projectsOfLogs(
  logs: { project: { id: string; name: string } | null }[]
): LinkedProject[] {
  const found = new Map<string, LinkedProject>()
  for (const { project } of logs) {
    if (project) {
      const item = found.get(project.id)
      if (item) {
        item.logCount += 1
      } else {
        found.set(project.id, { ...project, logCount: 1 })
      }
    }
  }
  return [...found.values()].sort((a, b) => b.logCount - a.logCount)
}
