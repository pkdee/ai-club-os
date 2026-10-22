import assert from "node:assert/strict"
import { test } from "node:test"

import {
  followEnd,
  formatDuration,
  formatTimeLabel,
  matchesTimeQuery,
  minutesBetween,
  parseTimeInput,
  timeOptions,
  toMinutes,
  withTime,
} from "./time-of-day"

test("시각을 오전과 오후로 읽기 쉽게 적는다", () => {
  assert.equal(formatTimeLabel("19:00"), "오후 7:00")
  assert.equal(formatTimeLabel("07:30"), "오전 7:30")
  assert.equal(formatTimeLabel("00:00"), "오전 12:00")
  assert.equal(formatTimeLabel("12:00"), "오후 12:00")
  assert.equal(formatTimeLabel("23:30"), "오후 11:30")
  // 형식이 틀리면 받은 글을 그대로 둔다.
  assert.equal(formatTimeLabel("24:00"), "24:00")
})

test("걸리는 시간을 시간과 분으로 적는다", () => {
  assert.equal(formatDuration(30), "30분")
  assert.equal(formatDuration(60), "1시간")
  assert.equal(formatDuration(90), "1시간 30분")
  assert.equal(formatDuration(120), "2시간")
  assert.equal(minutesBetween("19:00", "21:00"), 120)
  assert.equal(minutesBetween("19:00", "19:00"), null)
  assert.equal(minutesBetween("", "21:00"), null)
})

test("목록은 하루를 30분 간격으로 나눈다", () => {
  const options = timeOptions()
  assert.equal(options.length, 48)
  assert.equal(options[0], "00:00")
  assert.equal(options[39], "19:30")
  assert.equal(options[47], "23:30")
})

test("종료 목록은 시작에서 30분씩 더한 시각을 그날 안에서만 보여 준다", () => {
  assert.deepEqual(timeOptions("21:30"), ["22:00", "22:30", "23:00", "23:30"])
  assert.deepEqual(timeOptions("19:10").slice(0, 3), ["19:40", "20:10", "20:40"])
  assert.deepEqual(timeOptions("23:30"), [])
  assert.equal(timeOptions("").length, 48)
})

test("목록에 없는 시각은 제자리에 끼워 넣는다", () => {
  assert.deepEqual(withTime(["19:00", "19:30"], "19:10"), ["19:00", "19:10", "19:30"])
  assert.deepEqual(withTime(["19:00", "19:30"], "19:30"), ["19:00", "19:30"])
  assert.deepEqual(withTime(["19:00"], ""), ["19:00"])
})

test("적고 있는 글로 목록을 좁힌다", () => {
  assert.equal(matchesTimeQuery("19:00", "오후 7"), true)
  assert.equal(matchesTimeQuery("19:30", "오후7:3"), true)
  assert.equal(matchesTimeQuery("07:00", "오후 7"), false)
  assert.equal(matchesTimeQuery("19:00", "19"), true)
  assert.equal(matchesTimeQuery("19:00", "7"), true)
  assert.equal(matchesTimeQuery("07:30", "07:3"), true)
  assert.equal(matchesTimeQuery("17:00", "7"), false)
  assert.equal(matchesTimeQuery("19:00", ""), true)
})

test("여러 모양으로 적은 시각을 읽는다", () => {
  for (const text of ["19:10", "1910", "19.10", "오후 7:10", "오후 7시 10분", "오후7시10분", "7:10 PM", "7:10pm", "오후 19:10"]) {
    assert.equal(parseTimeInput(text), "19:10", text)
  }
  assert.equal(parseTimeInput("7시 반"), "07:30")
  assert.equal(parseTimeInput("오후 7시"), "19:00")
  assert.equal(parseTimeInput("오전 12:30"), "00:30")
  assert.equal(parseTimeInput("오후 12시"), "12:00")
  assert.equal(parseTimeInput("0:30"), "00:30")
  assert.equal(parseTimeInput("12"), "12:00")
  assert.equal(parseTimeInput("  21 "), "21:00")
})

test("읽을 수 없는 글은 받지 않는다", () => {
  for (const text of ["", "오후", "24:00", "19:60", "7:5", "오전 13:00", "12345", "저녁", "7시 70분"]) {
    assert.equal(parseTimeInput(text), null, text)
  }
})

test("오전과 오후를 적지 않은 1~11시는 기준에 맞춰 고른다", () => {
  // 기준이 없으면 오전이다. 앞에 0 을 붙이면 언제나 오전이다.
  assert.equal(parseTimeInput("7:10"), "07:10")
  assert.equal(parseTimeInput("07:10", { near: "19:00" }), "07:10")
  assert.equal(parseTimeInput("0710", { near: "19:00" }), "07:10")
  // 시작 시각은 지금 값에 가까운 쪽이다.
  assert.equal(parseTimeInput("7:10", { near: "19:00" }), "19:10")
  assert.equal(parseTimeInput("710", { near: "19:00" }), "19:10")
  assert.equal(parseTimeInput("7", { near: "10:00" }), "07:00")
  // 종료 시각은 시작보다 뒤인 쪽이다.
  assert.equal(parseTimeInput("9", { after: "19:00" }), "21:00")
  assert.equal(parseTimeInput("11", { after: "09:00" }), "11:00")
  assert.equal(parseTimeInput("8:30", { after: "19:00" }), "20:30")
  // 둘 다 시작보다 앞서면 오전으로 읽고, 입력 규칙이 알려 준다.
  assert.equal(parseTimeInput("9", { after: "22:00" }), "09:00")
})

test("시작을 바꾸면 종료가 같은 길이만큼 따라간다", () => {
  assert.equal(followEnd("19:00", "21:00", "18:30"), "20:30")
  assert.equal(followEnd("19:00", "21:00", "19:10"), "21:10")
  // 그날을 넘으면 종료는 그대로다.
  assert.equal(followEnd("19:00", "21:00", "22:30"), "21:00")
  assert.equal(followEnd("19:00", "21:00", "22:00"), "21:00")
  // 종료가 없거나 시작보다 앞서 있었으면 길이를 알 수 없어 그대로 둔다.
  assert.equal(followEnd("19:00", "", "20:00"), "")
  assert.equal(followEnd("19:00", "18:00", "20:00"), "18:00")
  assert.equal(followEnd("", "21:00", "20:00"), "21:00")
})

test("HH:MM 이 아닌 글은 시각으로 보지 않는다", () => {
  assert.equal(toMinutes("19:00"), 19 * 60)
  assert.equal(toMinutes("7:00"), null)
  assert.equal(toMinutes("24:00"), null)
  assert.equal(toMinutes(""), null)
})
