import { ANTHROPIC_DEFAULT_MODEL, createAnthropicProvider } from "./anthropic"
import { createMockProvider } from "./mock"
import type { InsightProvider } from "./types"

export type { InsightProvider, InsightProviderFailure } from "./types"

// 쓸 AI Provider 를 서버의 환경 변수로 고른다. 설정되지 않았으면 null 이다.
//   AI_INSIGHT_PROVIDER  anthropic(기본값) 또는 mock
//   ANTHROPIC_API_KEY    Anthropic 의 API 키. 서버에서만 읽고 브라우저로 보내지 않는다.
//   AI_INSIGHT_MODEL     쓸 모델. 비우면 기본 모델을 쓴다.
// 기록 기능은 이 값이 없어도 그대로 동작한다.
export function getInsightProvider(): InsightProvider | null {
  if (process.env.AI_INSIGHT_PROVIDER === "mock") {
    return process.env.NODE_ENV === "production" ? null : createMockProvider()
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return null
  }
  return createAnthropicProvider({
    apiKey,
    model: process.env.AI_INSIGHT_MODEL?.trim() || ANTHROPIC_DEFAULT_MODEL,
  })
}
