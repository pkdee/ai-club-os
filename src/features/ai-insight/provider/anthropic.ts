import type {
  InsightProvider,
  InsightProviderFailure,
  InsightProviderRequest,
  InsightProviderResult,
} from "./types"

// Anthropic 의 Messages API 로 Claude 를 부른다. 패키지 없이 fetch 로 직접 보낸다.

const API_URL = "https://api.anthropic.com/v1/messages"
const API_VERSION = "2023-06-01"
// 환경 변수로 모델을 정하지 않았을 때 쓰는 모델.
export const ANTHROPIC_DEFAULT_MODEL = "claude-opus-5-5"
const MAX_TOKENS = 4096
// 이 시간 안에 답이 오지 않으면 그만둔다. 화면의 서버 동작 제한 시간보다 짧게 둔다.
const TIMEOUT_MS = 50_000

const FAILURE_BY_STATUS: Record<number, InsightProviderFailure> = {
  401: "auth",
  403: "auth",
  404: "model",
  413: "too-long",
  429: "busy",
  500: "busy",
  503: "busy",
  529: "busy",
}

// 답의 글에서 JSON 객체를 꺼낸다. 앞뒤에 다른 글이나 코드 표시가 붙어 있어도 찾는다. 없으면 undefined 다.
export function extractJson(text: string): unknown {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end <= start) {
    return undefined
  }
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return undefined
  }
}

function fail(reason: InsightProviderFailure): InsightProviderResult {
  return { status: "error", reason }
}

export function createAnthropicProvider({
  apiKey,
  model,
  fetchFn = fetch,
}: {
  apiKey: string
  model: string
  // 시험에서 바꿔 끼운다.
  fetchFn?: typeof fetch
}): InsightProvider {
  // structured 이면 답의 모양을 API 에 함께 넘겨 그 모양으로만 답하게 한다.
  async function send(request: InsightProviderRequest, structured: boolean) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      return await fetchFn(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": API_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_TOKENS,
          system: request.system,
          messages: [{ role: "user", content: request.user }],
          ...(structured && {
            output_config: {
              format: { type: "json_schema", schema: request.schema },
            },
          }),
        }),
        signal: controller.signal,
        cache: "no-store",
      })
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    name: "anthropic",
    label: "Anthropic 의 Claude",
    model,
    async generate(request) {
      let response: Response
      try {
        response = await send(request, true)
        // 답의 모양을 넘기는 값을 받지 않는 모델이면 그 값 없이 한 번 더 보낸다. 모양은 지킬 것에도 적혀 있다.
        if (response.status === 400) {
          response = await send(request, false)
        }
      } catch (error) {
        console.error("AI Provider 에 닿지 못했습니다.", error)
        return fail("busy")
      }

      const body = (await response.json().catch(() => null)) as {
        content?: unknown
        stop_reason?: unknown
        model?: unknown
        error?: { type?: unknown; message?: unknown }
      } | null

      if (!response.ok) {
        const message = String(body?.error?.message ?? "")
        // 오류 내용에는 키가 들어 있지 않다. 원인을 찾을 수 있게 종류와 설명만 남긴다.
        console.error(
          "AI Provider 가 오류를 돌려줬습니다.",
          response.status,
          body?.error?.type,
          message
        )
        if (response.status === 400 && /too long|too large|context/i.test(message)) {
          return fail("too-long")
        }
        return fail(FAILURE_BY_STATUS[response.status] ?? "failed")
      }

      if (body?.stop_reason === "refusal") {
        return fail("refused")
      }
      if (body?.stop_reason === "model_context_window_exceeded") {
        return fail("too-long")
      }

      const blocks = Array.isArray(body?.content) ? body.content : []
      const text = blocks
        .map((block: { type?: unknown; text?: unknown }) =>
          block?.type === "text" && typeof block.text === "string"
            ? block.text
            : ""
        )
        .join("")
      const output = extractJson(text)
      if (output === undefined) {
        console.error(
          "AI Provider 의 답에서 JSON 을 찾지 못했습니다.",
          body?.stop_reason
        )
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
