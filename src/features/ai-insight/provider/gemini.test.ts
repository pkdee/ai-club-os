import assert from "node:assert/strict"
import { test } from "node:test"

import { createGeminiProvider, GEMINI_FREE_TIER_NOTICE, geminiFailure, interactionText } from "./gemini"
import { redactSecrets } from "./shared"

const KEY = "AIzaTestKey_0123456789abcdefghijklmnop"
const request = { system: "지킬 것", user: "자료", schema: { type: "object" } }
const answer = { overview: "요약", themes: [], lessons: [], next_actions: [] }

type Call = { url: string; headers: Record<string, string>; body: Record<string, unknown> }

// 정해 둔 응답을 차례로 돌려주는 가짜 fetch. 받은 요청을 calls 에 남긴다.
function fake(responses: (Response | Error)[]) {
  const calls: Call[] = []
  const fetchFn = (async (url: string, init: RequestInit) => {
    calls.push({
      url,
      headers: init.headers as Record<string, string>,
      body: JSON.parse(String(init.body)),
    })
    const next = responses.shift()
    if (next instanceof Error) {
      throw next
    }
    return next!
  }) as unknown as typeof fetch
  return { calls, fetchFn }
}

function interaction(text: string, extra: Record<string, unknown> = {}) {
  return Response.json({ object: "interaction", status: "completed", model: "gemini-test-1", output_text: text, ...extra })
}

function apiError(status: number, code: string, message = "설명", details?: unknown) {
  return Response.json({ error: { code, message, ...(details ? { details } : {}) } }, { status })
}

function provider(responses: (Response | Error)[]) {
  const { calls, fetchFn } = fake(responses)
  return { calls, provider: createGeminiProvider({ apiKey: KEY, model: "gemini-test", fetchFn }) }
}

test("지킬 것과 자료, 답의 모양을 실어 보내고 답의 JSON 을 꺼낸다", async () => {
  const { calls, provider: gemini } = provider([interaction(JSON.stringify(answer))])
  const result = await gemini.generate(request)

  assert.deepEqual(result, { status: "ok", output: answer, model: "gemini-test-1" })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, "https://generativelanguage.googleapis.com/v1beta/interactions")
  assert.equal(calls[0].headers["x-goog-api-key"], KEY)
  assert.equal(calls[0].body.model, "gemini-test")
  assert.equal(calls[0].body.system_instruction, "지킬 것")
  assert.equal(calls[0].body.input, "자료")
  assert.deepEqual(calls[0].body.response_format, { type: "text", mime_type: "application/json", schema: { type: "object" } })
  assert.equal(calls[0].body.store, false)
  assert.deepEqual(calls[0].body.generation_config, { max_output_tokens: 8192, thinking_level: "low" })
})

test("키는 보내는 글의 본문에 들어가지 않는다", async () => {
  const { calls, provider: gemini } = provider([interaction(JSON.stringify(answer))])
  await gemini.generate(request)
  assert.doesNotMatch(JSON.stringify(calls[0].body), new RegExp(KEY))
})

test("무료 등급에서 받은 글을 어떻게 쓰는지 알릴 글을 갖는다", () => {
  const { provider: gemini } = provider([])
  assert.equal(gemini.name, "gemini")
  assert.equal(gemini.label, "Google 의 Gemini")
  assert.equal(gemini.dataNotice, GEMINI_FREE_TIER_NOTICE)
  assert.match(GEMINI_FREE_TIER_NOTICE, /무료 등급/)
})

test("output_text 가 없으면 단계 목록에서 답의 글을 모은다", () => {
  const text = JSON.stringify(answer)
  assert.equal(
    interactionText({
      steps: [
        { type: "user_input", content: [{ type: "text", text: "자료" }] },
        { type: "model_output", content: [{ type: "text", text: text.slice(0, 10) }, { type: "text", text: text.slice(10) }] },
      ],
    }),
    text
  )
  assert.equal(interactionText({ outputs: [{ type: "thought", text: "생각" }, { type: "text", text }] }), text)
  assert.equal(interactionText(null), "")
})

test("앞뒤에 다른 글이나 코드 표시가 붙어 있어도 JSON 을 꺼낸다", async () => {
  const { provider: gemini } = provider([interaction("```json\n" + JSON.stringify(answer) + "\n```")])
  const result = await gemini.generate(request)
  assert.deepEqual(result.status === "ok" && result.output, answer)
})

test("실패해도 다시 보내지 않는다", async () => {
  const { calls, provider: gemini } = provider([apiError(503, "service_unavailable"), interaction(JSON.stringify(answer))])
  assert.deepEqual(await gemini.generate(request), { status: "error", reason: "busy" })
  assert.equal(calls.length, 1)
})

test("오류에 따라 까닭을 나눈다", async () => {
  const cases: [number, string, string, string][] = [
    [401, "authentication", "API key not valid", "auth"],
    [403, "permission_denied", "설명", "auth"],
    [400, "invalid_request", "API key not valid. Please pass a valid API key.", "auth"],
    [404, "model_not_found", "설명", "model"],
    [400, "invalid_request", "The input token count exceeds the maximum number of tokens allowed", "too-long"],
    [429, "rate_limit_exceeded", "Too many requests per minute", "busy"],
    [429, "too_many_requests", "설명", "busy"],
    [429, "quota_exceeded", "설명", "quota"],
    [500, "api_error", "설명", "busy"],
    [503, "service_unavailable", "설명", "busy"],
    [504, "deadline_exceeded", "설명", "busy"],
    [400, "failed_precondition", "설명", "failed"],
    [418, "unknown", "설명", "failed"],
  ]
  for (const [status, code, message, reason] of cases) {
    const { provider: gemini } = provider([apiError(status, code, message)])
    assert.deepEqual(await gemini.generate(request), { status: "error", reason }, `${status} ${code}`)
  }
})

test("예전 모양의 오류에서도 하루 한도를 알아본다", () => {
  const details = [
    {
      "@type": "type.googleapis.com/google.rpc.QuotaFailure",
      violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" }],
    },
  ]
  assert.equal(
    geminiFailure(429, { error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "You exceeded your current quota.", details } }),
    "quota"
  )
  const perMinute = [{ violations: [{ quotaId: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier" }] }]
  assert.equal(
    geminiFailure(429, { error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "You exceeded your current quota.", details: perMinute } }),
    "busy"
  )
})

test("정리하지 못했다는 답은 거절과 실패로 나눈다", async () => {
  const blocked = provider([interaction("", { status: "failed", errors: [{ code: "safety", message: "blocked" }] })])
  assert.deepEqual(await blocked.provider.generate(request), { status: "error", reason: "refused" })
  const failed = provider([interaction("", { status: "failed", errors: [{ code: "internal", message: "설명" }] })])
  assert.deepEqual(await failed.provider.generate(request), { status: "error", reason: "failed" })
})

test("JSON 이 아니거나 중간에 끊긴 답은 모양이 틀린 것으로 본다", async () => {
  const plain = provider([interaction("정리할 수 없습니다.")])
  assert.deepEqual(await plain.provider.generate(request), { status: "error", reason: "invalid-output" })
  const cut = provider([interaction('{"overview": "요약", "themes": [', { status: "incomplete" })])
  assert.deepEqual(await cut.provider.generate(request), { status: "error", reason: "invalid-output" })
})

test("닿지 못하면 잠시 뒤 다시 하라고 알린다", async () => {
  const { provider: gemini } = provider([new Error("network down")])
  assert.deepEqual(await gemini.generate(request), { status: "error", reason: "busy" })
})

test("Gemini 의 키처럼 생긴 글자도 가린다", () => {
  assert.equal(redactSecrets(`키 ${KEY} 가 틀렸습니다`, "다른 값"), "키 [가림] 가 틀렸습니다")
})

test("오류가 나도 키는 돌려주는 값과 남기는 글 어디에도 들어가지 않는다", async (t) => {
  const logged: string[] = []
  t.mock.method(console, "error", (...parts: unknown[]) => {
    logged.push(parts.map((part) => (part instanceof Error ? `${part.name} ${part.message} ${part.stack}` : String(part))).join(" "))
  })

  const cases: (Response | Error)[][] = [
    [apiError(400, "invalid_request", `bad header x-goog-api-key: ${KEY}`)],
    [apiError(401, "authentication", `invalid key ${KEY}`)],
    [new Error(`fetch failed for ${KEY}`)],
    [interaction("", { status: "failed", errors: [{ code: "internal", message: `echo ${KEY}` }] })],
    [interaction(`JSON 이 아닌 답 ${KEY}`)],
  ]
  for (const responses of cases) {
    const { provider: gemini } = provider(responses)
    const result = await gemini.generate(request)
    assert.equal(result.status, "error")
    assert.doesNotMatch(JSON.stringify(result), new RegExp(KEY))
  }

  assert.ok(logged.length >= 5)
  for (const line of logged) {
    assert.doesNotMatch(line, new RegExp(KEY))
  }
})
