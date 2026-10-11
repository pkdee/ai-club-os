import {
  isMonthKey,
  monthKeyOf,
  monthKeysBetween,
} from "@/features/ai-insight/period"

// 회고의 입력 규칙. 길이는 데이터베이스의 check 제약과 같은 값이어야 한다.

// 한 칸의 최대 길이.
export const RETRO_FIELD_MAX = 2000
// 한 달 회고에서 고를 수 있는 달의 수. 이번 달부터 거슬러 올라간다.
export const RETRO_MONTH_LIMIT = 12

export type RetrospectiveScope = "project" | "session" | "month"

// 무엇을 돌아보는지. month 는 2026-10 같은 값이고 달은 한국 시간으로 나눈다.
export type RetrospectiveTarget =
  | { scope: "project"; projectId: string }
  | { scope: "session"; sessionId: string }
  | { scope: "month"; month: string }

export type RetrospectiveInput = {
  wentWell: string
  toImprove: string
  toTry: string
}

export type RetrospectiveErrors = Partial<
  Record<keyof RetrospectiveInput | "form", string>
>

// 세 칸의 이름과 안내. 화면에 보이는 순서다.
export const RETRO_FIELDS: {
  key: keyof RetrospectiveInput
  label: string
  placeholder: string
}[] = [
  {
    key: "wentWell",
    label: "좋았던 것",
    placeholder: "잘됐거나 계속하고 싶은 것을 적습니다.",
  },
  {
    key: "toImprove",
    label: "아쉬운 것",
    placeholder: "막혔거나 다르게 했으면 하는 것을 적습니다.",
  },
  {
    key: "toTry",
    label: "다음에 해 볼 것",
    placeholder: "다음에 바꿔 보거나 새로 해 볼 것을 적습니다.",
  },
]

// 브라우저가 줄바꿈을 두 글자로 보내는 경우가 있어 한 글자로 맞추고 앞뒤 공백을 뗀다.
function clean(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .trim()
}

export function cleanRetrospective(
  input: Partial<Record<keyof RetrospectiveInput, unknown>>
): RetrospectiveInput {
  return {
    wentWell: clean(input.wentWell),
    toImprove: clean(input.toImprove),
    toTry: clean(input.toTry),
  }
}

// 저장할 수 없는 까닭을 칸마다 돌려준다. 문제가 없으면 null 이다. 다듬은 값을 받는다고 본다.
export function validateRetrospective(
  input: RetrospectiveInput
): RetrospectiveErrors | null {
  const errors: RetrospectiveErrors = {}

  for (const { key, label } of RETRO_FIELDS) {
    if (Array.from(input[key]).length > RETRO_FIELD_MAX) {
      errors[key] = `${label}은 ${RETRO_FIELD_MAX}자 이내로 적어 주세요.`
    }
  }
  if (RETRO_FIELDS.every(({ key }) => input[key] === "")) {
    errors.form = "세 칸 가운데 하나는 적어 주세요."
  }
  return Object.keys(errors).length > 0 ? errors : null
}

// 한 달 회고를 쓸 수 있는 달. 이번 달부터 Club 에 참여한 달까지 거슬러 올라가고, 최근 달이 앞에 온다.
export function retrospectiveMonths(now: Date, joinedAt: string | null) {
  const current = monthKeyOf(now)
  const first = joinedAt ? monthKeyOf(joinedAt) : current

  return monthKeysBetween(first, current, RETRO_MONTH_LIMIT)
}

// 주소로 받은 달이 지금 쓸 수 있는 달인지 본다. 아직 오지 않은 달은 쓸 수 없다.
export function isPastOrCurrentMonth(value: unknown, now: Date): value is string {
  return isMonthKey(value) && value <= monthKeyOf(now)
}

// 그 달의 첫날. 데이터베이스에 넣는 값이다. 예: 2026-10-01
export function monthStartDate(month: string) {
  return `${month}-01`
}
