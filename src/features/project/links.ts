// AI Log 를 거쳐 이어진 Session 과 Project 를 센다. Session 과 Project 는 직접 묶지 않고 기록으로만 이어진다.

export type LinkedSession = { id: string; title: string; logCount: number }
export type LinkedProject = { id: string; name: string; logCount: number }

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
