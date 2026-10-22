// 하루 안의 시각을 "19:00" 같은 HH:MM 글로 다룬다. 날짜와 시간대는 다루지 않는다.
// 시각 고르기 칸(components/ui/time-picker.tsx)이 목록을 만들고 적은 글을 읽을 때 쓴다.

const DAY_MINUTES = 24 * 60
// 목록의 시각 사이 간격(분).
export const TIME_STEP = 30

// "19:00" 을 0시부터 지난 분으로 바꾼다. 형식이 틀리거나 없는 시각이면 null 이다.
export function toMinutes(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])
  return hour < 24 && minute < 60 ? hour * 60 + minute : null
}

// 0시부터 지난 분을 "19:00" 으로 바꾼다.
export function fromMinutes(minutes: number) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0")
  const minute = String(minutes % 60).padStart(2, "0")
  return `${hour}:${minute}`
}

// 예: "19:00" 은 "오후 7:00", "00:30" 은 "오전 12:30", "12:00" 은 "오후 12:00"
export function formatTimeLabel(time: string) {
  const minutes = toMinutes(time)
  if (minutes === null) {
    return time
  }

  const hour = Math.floor(minutes / 60)
  const minute = String(minutes % 60).padStart(2, "0")
  return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${minute}`
}

// 예: 30 은 "30분", 120 은 "2시간", 90 은 "1시간 30분"
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours === 0) {
    return `${rest}분`
  }
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`
}

// 두 시각 사이의 분. 뒤의 것이 앞서거나 형식이 틀리면 null 이다.
export function minutesBetween(start: string, end: string) {
  const from = toMinutes(start)
  const to = toMinutes(end)
  return from !== null && to !== null && to > from ? to - from : null
}

// 고를 수 있는 시각. after 가 있으면 그 시각에서 TIME_STEP 씩 더해 그날 안에 드는 것만,
// 없으면 0시부터 TIME_STEP 마다 하루치를 돌려준다. 종료 시각은 시작에서 30분, 1시간 뒤처럼 고르게 된다.
export function timeOptions(after?: string) {
  const start = after ? toMinutes(after) : null
  const first = start === null ? 0 : start + TIME_STEP
  const options: string[] = []

  for (let minutes = first; minutes < DAY_MINUTES; minutes += TIME_STEP) {
    options.push(fromMinutes(minutes))
  }
  return options
}

// 목록에 없는 시각(예: 19:10)을 제자리에 끼워 넣는다. 이미 있으면 그대로 돌려준다.
export function withTime(options: string[], time: string) {
  if (toMinutes(time) === null || options.includes(time)) {
    return options
  }
  return [...options, time].sort()
}

// 글을 견줄 때 쓰는 모양. 대소문자, 띄어쓰기, 쌍점, 마침표를 지운다. 예: "오후 7:00" 은 "오후700"
function compact(text: string) {
  return text.toLowerCase().replace(/[\s:.]/g, "")
}

// 목록의 시각이 적고 있는 글로 시작하는지 본다. "오후 7", "19", "7:3" 처럼 앞부분만 적어도 맞는다.
export function matchesTimeQuery(time: string, query: string) {
  const minutes = toMinutes(time)
  const typed = compact(query)
  if (minutes === null || typed === "") {
    return minutes !== null
  }

  const hour = Math.floor(minutes / 60)
  const minute = time.slice(3)
  const keys = [
    compact(formatTimeLabel(time)),
    `${time.slice(0, 2)}${minute}`,
    `${hour}${minute}`,
    `${hour % 12 || 12}${minute}`,
  ]
  return keys.some((key) => key.startsWith(typed))
}

// 오전과 오후를 가리키는 말. 글의 맨 앞이나 맨 뒤에 올 수 있다.
const MERIDIEM = /^(오전|오후|a\.?m\.?|p\.?m\.?)|(오전|오후|a\.?m\.?|p\.?m\.?)$/

export type TimeContext = {
  // 이 시각보다 뒤인 쪽을 고른다. 종료 시각을 적을 때 시작 시각을 넘긴다.
  after?: string
  // 이 시각에 가까운 쪽을 고른다. 시작 시각을 적을 때 지금 값을 넘긴다.
  near?: string
}

// 오전, 오후를 적지 않은 1~11시를 둘 가운데 하나로 고른다. 기준이 없으면 오전이다.
function pick(morning: number, context: TimeContext) {
  const evening = morning + 12 * 60
  const after = context.after ? toMinutes(context.after) : null
  if (after !== null) {
    return morning > after || evening <= after ? morning : evening
  }

  const near = context.near ? toMinutes(context.near) : null
  if (near !== null) {
    return Math.abs(evening - near) < Math.abs(morning - near)
      ? evening
      : morning
  }
  return morning
}

// 사람이 적은 시각을 "19:10" 으로 읽는다. 읽지 못하면 null 이다.
// "19:10", "1910", "7:10", "오후 7:10", "오후 7시 10분", "7시 반", "7pm" 을 받는다.
// 앞에 0 을 붙인 "07:10" 과 13시 이후는 24시간 표기로 본다.
export function parseTimeInput(text: string, context: TimeContext = {}) {
  let rest = text.trim().toLowerCase().replace(/\s+/g, "")
  let meridiem: "am" | "pm" | null = null

  const marker = MERIDIEM.exec(rest)
  if (marker) {
    const word = marker[1] ?? marker[2]
    meridiem = word === "오전" || word.startsWith("a") ? "am" : "pm"
    rest = marker[1] ? rest.slice(word.length) : rest.slice(0, -word.length)
  }

  const match =
    /^(\d{1,2})[:.](\d{2})$/.exec(rest) ??
    /^(\d{1,2})시(?:(\d{1,2})분?|(반))?$/.exec(rest) ??
    /^(\d{1,2})(\d{2})$/.exec(rest) ??
    /^(\d{1,2})$/.exec(rest)
  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = match[3] === "반" ? 30 : Number(match[2] ?? 0)
  if (minute > 59 || hour > 23) {
    return null
  }

  if (meridiem) {
    // "오후 19:00" 처럼 24시간 표기에 오후를 붙인 것은 그대로 받는다.
    if (hour > 12) {
      return meridiem === "pm" ? fromMinutes(hour * 60 + minute) : null
    }
    const base = (hour % 12) * 60 + minute
    return fromMinutes(meridiem === "pm" ? base + 12 * 60 : base)
  }

  if (hour >= 1 && hour <= 11 && !match[1].startsWith("0")) {
    return fromMinutes(pick(hour * 60 + minute, context))
  }
  return fromMinutes(hour * 60 + minute)
}

// 시작 시각을 바꾸면 종료 시각도 같은 길이만큼 따라 움직인다.
// 따라간 종료가 그날을 넘거나 전에 길이가 없었으면 종료는 그대로 두고, 맞지 않으면 입력 규칙이 알려 준다.
export function followEnd(start: string, end: string, nextStart: string) {
  const length = minutesBetween(start, end)
  const from = toMinutes(nextStart)
  if (length === null || from === null || from + length >= DAY_MINUTES) {
    return end
  }
  return fromMinutes(from + length)
}
