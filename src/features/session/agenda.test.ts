import assert from "node:assert/strict"
import { test } from "node:test"

import { parseAgenda } from "./agenda"

test("줄 앞의 시각을 따로 떼어 낸다", () => {
  assert.deepEqual(parseAgenda("19:00 지난 회차 돌아보기\n19:20 청크 나누기 실습"), [
    { time: "19:00", title: "지난 회차 돌아보기" },
    { time: "19:20", title: "청크 나누기 실습" },
  ])
})

test("한 자리 시각은 두 자리로 맞춘다", () => {
  assert.deepEqual(parseAgenda("9:05 시작"), [{ time: "09:05", title: "시작" }])
})

test("시각 뒤의 물결과 줄표는 뗀다", () => {
  assert.deepEqual(parseAgenda("19:00 ~ 실습\n20:00 - 공유"), [
    { time: "19:00", title: "실습" },
    { time: "20:00", title: "공유" },
  ])
})

test("시각이 없는 줄은 글 그대로 둔다", () => {
  assert.deepEqual(parseAgenda("각자 AI Log 남기기"), [
    { time: null, title: "각자 AI Log 남기기" },
  ])
})

test("빈 줄과 앞뒤 공백은 버린다", () => {
  assert.deepEqual(parseAgenda("\n  19:00 시작  \r\n\n   \n마무리\n"), [
    { time: "19:00", title: "시작" },
    { time: null, title: "마무리" },
  ])
  assert.deepEqual(parseAgenda(""), [])
})

test("있을 수 없는 시각과 시각만 있는 줄은 글로 본다", () => {
  assert.deepEqual(parseAgenda("25:00 늦은 시각"), [{ time: null, title: "25:00 늦은 시각" }])
  assert.deepEqual(parseAgenda("19:70 이상한 분"), [{ time: null, title: "19:70 이상한 분" }])
  assert.deepEqual(parseAgenda("19:00"), [{ time: null, title: "19:00" }])
})
