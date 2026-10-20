import "server-only"

import { ANTHROPIC_DEFAULT_MODEL, createAnthropicProvider } from "./anthropic"
import { createGeminiProvider, GEMINI_DEFAULT_MODEL } from "./gemini"
import { createMockProvider } from "./mock"
import type { InsightProvider } from "./types"

export type { InsightProvider, InsightProviderFailure } from "./types"

// 쓸 AI Provider 를 서버의 환경 변수로 고른다. 설정되지 않았으면 null 이다.
//   AI_INSIGHT_PROVIDER  anthropic, gemini, mock 가운데 하나. 비우면 키를 넣은 쪽을 쓰고, 둘 다 넣었으면 anthropic 이다.
//   ANTHROPIC_API_KEY    Anthropic 의 API 키.
//   GEMINI_API_KEY       Google AI Studio 에서 만든 Gemini 의 API 키.
//                        두 키 모두 서버에서만 읽고 브라우저로 보내지 않는다.
//                        이름에 NEXT_PUBLIC_ 을 붙이면 브라우저로 나가므로 절대 붙이지 않는다.
//   AI_INSIGHT_MODEL     쓸 모델. 비우면 고른 Provider 의 기본 모델을 쓴다.
// 기록 기능은 이 값이 없어도 그대로 동작한다.
export function getInsightProvider(): InsightProvider | null {
  const choice = process.env.AI_INSIGHT_PROVIDER?.trim()
  if (choice === "mock") {
    return process.env.NODE_ENV === "production" ? null : createMockProvider()
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim()
  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  const model = process.env.AI_INSIGHT_MODEL?.trim()

  const useGemini = choice === "gemini" || (!choice && !anthropicKey)
  if (useGemini) {
    return geminiKey
      ? createGeminiProvider({ apiKey: geminiKey, model: model || GEMINI_DEFAULT_MODEL })
      : null
  }
  if (choice && choice !== "anthropic") {
    return null
  }
  return anthropicKey
    ? createAnthropicProvider({ apiKey: anthropicKey, model: model || ANTHROPIC_DEFAULT_MODEL })
    : null
}

// 개인 정보 안내와 쓰기 화면에 적는 값. 키는 담지 않는다. Provider 가 없으면 null 이다.
export function insightProviderInfo() {
  const provider = getInsightProvider()
  return provider ? { label: provider.label, dataNotice: provider.dataNotice } : null
}
