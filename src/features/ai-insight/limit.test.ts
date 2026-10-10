import assert from "node:assert/strict"
import { test } from "node:test"

import { INSIGHT_DAILY_LIMIT, insightRunsLeft } from "./limit"

test("쓴 횟수만큼 남은 횟수가 줄어든다", () => {
  assert.equal(insightRunsLeft(0), INSIGHT_DAILY_LIMIT)
  assert.equal(insightRunsLeft(3), INSIGHT_DAILY_LIMIT - 3)
  assert.equal(insightRunsLeft(INSIGHT_DAILY_LIMIT), 0)
})

test("남은 횟수는 0 아래로 내려가지 않는다", () => {
  assert.equal(insightRunsLeft(INSIGHT_DAILY_LIMIT + 5), 0)
})

test("이상한 값이 와도 한도를 넘겨 돌려주지 않는다", () => {
  assert.equal(insightRunsLeft(-2), INSIGHT_DAILY_LIMIT)
  assert.equal(insightRunsLeft(2.7), INSIGHT_DAILY_LIMIT - 2)
})
