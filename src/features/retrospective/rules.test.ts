import assert from "node:assert/strict"
import { test } from "node:test"

import {
  RETRO_FIELD_MAX,
  cleanRetrospective,
  isPastOrCurrentMonth,
  monthStartDate,
  retrospectiveMonths,
  validateRetrospective,
} from "./rules"

test("앞뒤 공백을 떼고 줄바꿈을 한 글자로 맞춘다", () => {
  assert.deepEqual(
    cleanRetrospective({ wentWell: "  잘됐다\r\n둘째 줄  ", toImprove: "\n\n", toTry: undefined }),
    { wentWell: "잘됐다\n둘째 줄", toImprove: "", toTry: "" }
  )
  assert.deepEqual(cleanRetrospective({}), { wentWell: "", toImprove: "", toTry: "" })
})

test("세 칸 가운데 하나만 적어도 된다", () => {
  assert.equal(validateRetrospective({ wentWell: "", toImprove: "", toTry: "다음에 해 볼 것" }), null)
  assert.equal(validateRetrospective({ wentWell: "하나", toImprove: "둘", toTry: "셋" }), null)
})

test("세 칸이 모두 비어 있으면 저장할 수 없다", () => {
  const errors = validateRetrospective(cleanRetrospective({ wentWell: "  ", toImprove: "\n", toTry: "" }))
  assert.equal(errors?.form, "세 칸 가운데 하나는 적어 주세요.")
  assert.equal(errors?.wentWell, undefined)
})

test("한 칸이 너무 길면 그 칸에 알린다", () => {
  assert.equal(validateRetrospective({ wentWell: "가".repeat(RETRO_FIELD_MAX), toImprove: "", toTry: "" }), null)
  const errors = validateRetrospective({ wentWell: "가".repeat(RETRO_FIELD_MAX + 1), toImprove: "", toTry: "셋" })
  assert.equal(errors?.wentWell, `좋았던 것은 ${RETRO_FIELD_MAX}자 이내로 적어 주세요.`)
  assert.equal(errors?.form, undefined)
  // 글자 수는 보이는 글자로 센다. 두 단위로 저장되는 글자도 한 글자다.
  assert.equal(validateRetrospective({ wentWell: "\u{1D6D1}".repeat(RETRO_FIELD_MAX), toImprove: "", toTry: "" }), null)
})

test("고를 수 있는 달은 이번 달부터 참여한 달까지다", () => {
  const now = new Date("2026-10-11T03:00:00Z")
  assert.deepEqual(retrospectiveMonths(now, "2026-08-20T10:00:00Z"), ["2026-10", "2026-09", "2026-08"])
  assert.deepEqual(retrospectiveMonths(now, "2026-10-01T00:00:00Z"), ["2026-10"])
  // 참여한 때를 모르면 이번 달만 고른다.
  assert.deepEqual(retrospectiveMonths(now, null), ["2026-10"])
  // 오래전에 참여했어도 12달까지만 거슬러 올라간다.
  const months = retrospectiveMonths(now, "2020-01-01T00:00:00Z")
  assert.equal(months.length, 12)
  assert.equal(months[0], "2026-10")
  assert.equal(months[11], "2025-11")
})

test("달은 한국 시간으로 나눈다", () => {
  // 한국 시간으로는 이미 11월 1일이다.
  const now = new Date("2026-10-31T15:30:00Z")
  assert.deepEqual(retrospectiveMonths(now, "2026-10-31T14:00:00Z"), ["2026-11", "2026-10"])
  assert.equal(isPastOrCurrentMonth("2026-11", now), true)
  assert.equal(isPastOrCurrentMonth("2026-12", now), false)
})

test("아직 오지 않은 달과 모양이 틀린 값은 받지 않는다", () => {
  const now = new Date("2026-10-11T03:00:00Z")
  assert.equal(isPastOrCurrentMonth("2026-10", now), true)
  assert.equal(isPastOrCurrentMonth("2025-12", now), true)
  assert.equal(isPastOrCurrentMonth("2026-11", now), false)
  assert.equal(isPastOrCurrentMonth("2026-13", now), false)
  assert.equal(isPastOrCurrentMonth("2026-1", now), false)
  assert.equal(isPastOrCurrentMonth(undefined, now), false)
  assert.equal(monthStartDate("2026-10"), "2026-10-01")
})
