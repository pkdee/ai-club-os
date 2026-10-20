import "server-only"

import { extractJson, redactSecrets } from "./shared"
import type {
  InsightProvider,
  InsightProviderFailure,
  InsightProviderRequest,
  InsightProviderResult,
} from "./types"

// Google 의 Interactions API 로 Gemini 를 부른다. 패키지 없이 fetch 로 직접 보낸다.
// 키를 다루는 파일이라 서버에서만 불러올 수 있게 막아 둔다. 브라우저로 가는 코드가 이 파일을 불러오면 빌드가 실패한다.
// 키는 요청의 머리말에만 싣는다. 돌려주는 값, 남기는 글, 저장하는 값 어디에도 넣지 않는다.

const API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
// 환경 변수로 모델을 정하지 않았을 때 쓰는 모델.
export const GEMINI_DEFAULT_MODEL = "gemini-3.8-flash"
// 생각하는 데 쓴 토큰도 이 안에 들어간다. 정리한 답만 생각하면 4096 이면 되지만 여유를 둔다.
const MAX_OUTPUT_TOKENS = 8192
// 기록을 모아 정리하는 일이라 깊이 생각할 필요가 적다. 낮게 두면 빠르고 토큰도 덜 쓴다.
const THINKING_LEVEL = "low"
// 이 시간 안에 답이 오지 않으면 그만둔다. 화면의 서버 동작 제한 시간보다 짧게 둔다.
const TIMEOUT_MS = 50_000

// 무료 등급의 약관이 정한 것을 사용자에게 그대로 알린다.
export const GEMINI_FREE_TIER_NOTICE =
  "Google 의 Gemini 무료 등급을 씁니다. Google 은 받은 글을 서비스를 개선하는 데 쓰고, 검토하는 사람이 읽을 수도 있습니다."

// HTTP 상태만으로 까닭을 정할 수 있는 것.
const FAILURE_BY_STATUS: Record<number, InsightProviderFailure> = {
  401: "auth",
  403: "auth",
  404: "model",
  408: "busy",
  413: "too-long",
  500: "busy",
  502: "busy",
  503: "busy",
  504: "busy",
}

type ErrorBody = {
  error?: { code?: unknown; status?: unknown; message?: unknown; details?: unknown }
}

// 오류 응답에서 까닭을 고른다. 오류의 모양이 API 마다 조금씩 달라서 상태, 이름, 설명을 함께 본다.
export function geminiFailure(status: number, body: ErrorBody | null): InsightProviderFailure {
  const error = body?.error
  const name = `${String(error?.code ?? "")} ${String(error?.status ?? "")}`
  const message = String(error?.message ?? "")
  // 하루 한도인지는 이름이나 설명, 붙어 온 자세한 값에 적혀 온다.
  const detail = `${name} ${message} ${JSON.stringify(error?.details ?? "")}`

  if (status === 429) {
    return /quota_exceeded|per ?day|daily/i.test(detail) ? "quota" : "busy"
  }
  if (status === 400) {
    if (/api[ _-]?key|authentication/i.test(detail)) {
      return "auth"
    }
    if (/token|too long|too large|exceed/i.test(message)) {
      return "too-long"
    }
  }
  return FAILURE_BY_STATUS[status] ?? "failed"
}

type ContentItem = { type?: unknown; text?: unknown }
type Interaction = {
  status?: unknown
  model?: unknown
  output_text?: unknown
  steps?: unknown
  outputs?: unknown
  errors?: unknown
}

function texts(items: unknown) {
  return Array.isArray(items)
    ? items
        .map((item: ContentItem) =>
          item?.type === "text" && typeof item.text === "string" ? item.text : ""
        )
        .join("")
    : ""
}

// 답의 글을 꺼낸다. 문서가 보여 주는 output_text 를 먼저 보고, 없으면 단계 목록에서 모은다.
export function interactionText(body: Interaction | null) {
  if (typeof body?.output_text === "string" && body.output_text !== "") {
    return body.output_text
  }
  const steps = Array.isArray(body?.steps) ? body.steps : []
  const fromSteps = steps
    .filter((step: { type?: unknown }) => step?.type === "model_output")
    .map((step: { content?: unknown }) => texts(step.content))
    .join("")
  return fromSteps !== "" ? fromSteps : texts(body?.outputs)
}

function fail(reason: InsightProviderFailure): InsightProviderResult {
  return { status: "error", reason }
}

export function createGeminiProvider({
  apiKey,
  model,
  fetchFn = fetch,
}: {
  apiKey: string
  model: string
  // 시험에서 바꿔 끼운다.
  fetchFn?: typeof fetch
}): InsightProvider {
  async function send(request: InsightProviderRequest) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      return await fetchFn(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model,
          system_instruction: request.system,
          input: request.user,
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: request.schema,
          },
          generation_config: {
            max_output_tokens: MAX_OUTPUT_TOKENS,
            thinking_level: THINKING_LEVEL,
          },
          // 나중에 이어서 묻지 않으므로 Google 쪽에 대화를 남겨 두지 않는다.
          store: false,
        }),
        signal: controller.signal,
        cache: "no-store",
      })
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    name: "gemini",
    label: "Google 의 Gemini",
    dataNotice: GEMINI_FREE_TIER_NOTICE,
    model,
    async generate(request) {
      // 무료 등급은 하루에 부를 수 있는 횟수가 적다. 실패해도 다시 보내지 않는다.
      let response: Response
      try {
        response = await send(request)
      } catch (error) {
        // 오류를 통째로 남기지 않는다. 종류와 설명만, 키를 가린 뒤에 남긴다.
        console.error(
          "AI Provider 에 닿지 못했습니다.",
          error instanceof Error ? error.name : "알 수 없는 오류",
          redactSecrets(error instanceof Error ? error.message : "", apiKey)
        )
        return fail("busy")
      }

      const body = (await response.json().catch(() => null)) as
        | (Interaction & ErrorBody)
        | null

      if (!response.ok) {
        // 원인을 찾을 수 있게 이름과 설명만 남긴다. 설명은 키를 가린 뒤에 남긴다.
        console.error(
          "AI Provider 가 오류를 돌려줬습니다.",
          response.status,
          redactSecrets(
            `${String(body?.error?.code ?? "")} ${String(body?.error?.status ?? "")}`.trim(),
            apiKey
          ),
          redactSecrets(String(body?.error?.message ?? ""), apiKey)
        )
        return fail(geminiFailure(response.status, body))
      }

      if (body?.status === "failed") {
        const errors = JSON.stringify(body.errors ?? "")
        console.error(
          "AI Provider 가 정리하지 못했다고 답했습니다.",
          redactSecrets(errors, apiKey)
        )
        return fail(/safety|block|prohibit|recitation/i.test(errors) ? "refused" : "failed")
      }

      const output = extractJson(interactionText(body))
      if (output === undefined) {
        console.error("AI Provider 의 답에서 JSON 을 찾지 못했습니다.", body?.status)
        return fail("invalid-output")
      }

      return {
        status: "ok",
        output,
        model: typeof body?.model === "string" ? body.model : model,
      }
    },
  }
}
