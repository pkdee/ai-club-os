// 알림은 따로 쌓지 않고 지금의 기록에서 읽어 낸다.
// 여기서는 읽어 온 것들을 알림 한 줄씩으로 다듬고, 무엇이 새것이고 무엇을 챙겨야 하는지 가린다.

export type NotificationSource =
  // 내가 참여하는 Project 에 들어온 참여 요청. 받거나 거절할 때까지 남는다.
  | {
      kind: "join-request"
      id: string
      at: string
      projectId: string
      projectName: string
      requesterName: string
    }
  // 내가 맡은, 아직 끝내지 않은 할 일. at 은 맡게 된 시각이고 알 수 없으면 null 이다.
  | {
      kind: "task"
      id: string
      at: string | null
      projectId: string
      projectName: string
      title: string
      dueOn: string | null
    }
  // 내 참여 요청이 받아들여져 참여자가 됐다.
  | {
      kind: "accepted"
      id: string
      at: string
      projectId: string
      projectName: string
    }
  // 운영자가 AI Insight 를 공개했다. month 는 한 달 정리일 때의 달(YYYY-MM)이다.
  | {
      kind: "insight"
      id: string
      at: string
      title: string
      sessionId: string | null
      month: string | null
    }

export type TaskDue = "overdue" | "soon" | null

export type Notification = NotificationSource & {
  // 마지막으로 알림을 확인한 뒤에 생긴 것이다.
  isNew: boolean
  // 새것이 아니어도 챙겨야 하는 것이다. 들어온 참여 요청과, 기한이 닥쳤거나 지난 할 일이 그렇다.
  needsAttention: boolean
  // 할 일일 때의 기한 상태. overdue 는 지남, soon 은 오늘이나 내일까지다.
  due: TaskDue
}

// 날짜(YYYY-MM-DD)의 다음 날.
function nextDay(date: string) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + 1)
  return value.toISOString().slice(0, 10)
}

// 기한이 지났는지, 닥쳤는지 본다. today 는 한국 시간의 오늘 날짜다.
export function taskDue(dueOn: string | null, today: string): TaskDue {
  if (!dueOn) {
    return null
  }
  if (dueOn < today) {
    return "overdue"
  }
  return dueOn <= nextDay(today) ? "soon" : null
}

// 읽어 온 것들을 알림으로 다듬는다. seenAt 은 마지막으로 확인한 시각이고, 확인한 적이 없으면 null 이다.
// 챙겨야 하는 것이 앞에, 그 안에서는 최근 것이 앞에 온다.
export function buildNotifications(
  sources: NotificationSource[],
  seenAt: string | null,
  today: string
): Notification[] {
  const seen = seenAt ? new Date(seenAt).getTime() : null
  const time = (at: string | null) => (at ? new Date(at).getTime() : 0)

  return sources
    .map((source) => {
      const due = source.kind === "task" ? taskDue(source.dueOn, today) : null
      return {
        ...source,
        // 확인한 적이 없으면 시각을 아는 것은 모두 새것이다.
        isNew: source.at !== null && (seen === null || time(source.at) > seen),
        needsAttention: source.kind === "join-request" || due !== null,
        due,
      }
    })
    .sort(
      (a, b) =>
        Number(b.needsAttention) - Number(a.needsAttention) ||
        time(b.at) - time(a.at)
    )
}

// 메뉴에 보여 줄 수. 새것과 챙겨야 하는 것을 한 번씩만 센다.
export function countNotifications(items: Notification[]) {
  return items.filter((item) => item.isNew || item.needsAttention).length
}
