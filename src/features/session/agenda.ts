// Session 의 시간표. 한 줄에 하나씩 적은 글을 화면에 보여 줄 줄로 나눈다.

export type AgendaItem = {
  // 줄 앞에 적은 시각(HH:MM). 적지 않았으면 null 이다.
  time: string | null
  title: string
}

// 줄 앞의 시각. 9:00 과 09:00, 그리고 뒤에 붙인 물결이나 줄표까지 받는다. 예: "19:00 ~ 실습", "19:00 - 실습"
const TIMED_LINE = /^(\d{1,2}):(\d{2})\s*(?:[~-]\s*)?(.*)$/

// 시간표 글을 줄로 나눈다. 빈 줄은 버리고, 줄 앞에 시각이 있으면 따로 떼어 낸다.
// 있을 수 없는 시각(25:00 같은 것)은 시각으로 보지 않고 글 그대로 둔다.
export function parseAgenda(agenda: string): AgendaItem[] {
  return agenda
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((line) => {
      const match = TIMED_LINE.exec(line)
      if (match) {
        const hour = Number(match[1])
        const minute = Number(match[2])
        const title = match[3].trim()
        if (hour <= 23 && minute <= 59 && title !== "") {
          return {
            time: `${String(hour).padStart(2, "0")}:${match[2]}`,
            title,
          }
        }
      }
      return { time: null, title: line }
    })
}
