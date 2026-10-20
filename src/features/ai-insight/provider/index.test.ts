import assert from "node:assert/strict"
import { afterEach, test } from "node:test"

import { getInsightProvider, insightProviderInfo } from "./index"

const NAMES = ["AI_INSIGHT_PROVIDER", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "AI_INSIGHT_MODEL"] as const
const saved = Object.fromEntries(NAMES.map((name) => [name, process.env[name]]))

function setEnv(values: Partial<Record<(typeof NAMES)[number], string>>) {
  for (const name of NAMES) {
    delete process.env[name]
  }
  Object.assign(process.env, values)
}

afterEach(() => {
  for (const name of NAMES) {
    if (saved[name] === undefined) {
      delete process.env[name]
    } else {
      process.env[name] = saved[name]
    }
  }
})

test("키가 없으면 Provider 가 없다", () => {
  setEnv({})
  assert.equal(getInsightProvider(), null)
  assert.equal(insightProviderInfo(), null)
})

test("고르지 않았으면 키를 넣은 쪽을 쓴다", () => {
  setEnv({ GEMINI_API_KEY: "AIza-test" })
  assert.equal(getInsightProvider()?.name, "gemini")
  assert.equal(getInsightProvider()?.model, "gemini-3.8-flash")

  setEnv({ ANTHROPIC_API_KEY: "sk-test" })
  assert.equal(getInsightProvider()?.name, "anthropic")

  // 둘 다 넣었으면 예전처럼 Anthropic 을 쓴다.
  setEnv({ ANTHROPIC_API_KEY: "sk-test", GEMINI_API_KEY: "AIza-test" })
  assert.equal(getInsightProvider()?.name, "anthropic")
})

test("고른 Provider 의 키가 없으면 다른 쪽으로 넘어가지 않는다", () => {
  setEnv({ AI_INSIGHT_PROVIDER: "gemini", ANTHROPIC_API_KEY: "sk-test" })
  assert.equal(getInsightProvider(), null)
  setEnv({ AI_INSIGHT_PROVIDER: "anthropic", GEMINI_API_KEY: "AIza-test" })
  assert.equal(getInsightProvider(), null)
  setEnv({ AI_INSIGHT_PROVIDER: "없는-이름", ANTHROPIC_API_KEY: "sk-test", GEMINI_API_KEY: "AIza-test" })
  assert.equal(getInsightProvider(), null)
})

test("고른 Provider 와 모델을 쓰고, 화면에 적을 값에는 키가 없다", () => {
  setEnv({ AI_INSIGHT_PROVIDER: "gemini", ANTHROPIC_API_KEY: "sk-test", GEMINI_API_KEY: "AIza-test", AI_INSIGHT_MODEL: "gemini-3.5-flash-lite" })
  const provider = getInsightProvider()
  assert.equal(provider?.name, "gemini")
  assert.equal(provider?.model, "gemini-3.5-flash-lite")

  const info = insightProviderInfo()
  assert.equal(info?.label, "Google 의 Gemini")
  assert.match(info?.dataNotice ?? "", /무료 등급/)
  assert.doesNotMatch(JSON.stringify(info), /AIza-test|sk-test/)
})
