import assert from "node:assert/strict"
import { test } from "node:test"

import { createAnthropicProvider, TIMEOUT_MS } from "./anthropic"
import { extractJson, redactSecrets } from "./shared"
import { createMockProvider } from "./mock"

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

function message(text: string, extra: Record<string, unknown> = {}) {
  return Response.json({ model: "claude-test-1", stop_reason: "end_turn", content: [{ type: "text", text }], ...extra })
}

function apiError(status: number, type: string, text = "설명") {
  return Response.json({ type: "error", error: { type, message: text } }, { status })
}

function provider(responses: (Response | Error)[]) {
  const { calls, fetchFn } = fake(responses)
  return { calls, provider: createAnthropicProvider({ apiKey: "sk-test-key", model: "claude-test", fetchFn }) }
}

test("지킬 것과 자료, 답의 모양을 실어 보내고 답의 JSON 을 꺼낸다", async () => {
  const { calls, provider: claude } = provider([message(JSON.stringify(answer))])
  const result = await claude.generate(request)

  assert.deepEqual(result, { status: "ok", output: answer, model: "claude-test-1" })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, "https://api.anthropic.com/v1/messages")
  assert.equal(calls[0].headers["x-api-key"], "sk-test-key")
  assert.equal(calls[0].headers["anthropic-version"], "2023-06-01")
  assert.equal(calls[0].body.model, "claude-test")
  assert.equal(calls[0].body.system, "지킬 것")
  assert.deepEqual(calls[0].body.messages, [{ role: "user", content: "자료" }])
  assert.deepEqual(calls[0].body.output_config, { format: { type: "json_schema", schema: { type: "object" } } })
})

test("키는 보내는 글의 본문에 들어가지 않는다", async () => {
  const { calls, provider: claude } = provider([message(JSON.stringify(answer))])
  await claude.generate(request)
  assert.doesNotMatch(JSON.stringify(calls[0].body), /sk-test-key/)
})

test("답의 모양을 넘기는 값을 받지 않으면 그 값 없이 한 번 더 보낸다", async () => {
  const { calls, provider: claude } = provider([
    apiError(400, "invalid_request_error", "output_config: Extra inputs are not permitted"),
    message(JSON.stringify(answer)),
  ])
  const result = await claude.generate(request)

  assert.equal(result.status, "ok")
  assert.equal(calls.length, 2)
  assert.equal("output_config" in calls[1].body, false)
  assert.equal(calls[1].body.system, "지킬 것")
})

test("한 번 더 보내도 처음 보낸 때부터 제한 시간 안에 그만둔다", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const tick = () => new Promise((resolve) => setImmediate(resolve))
  let sent = 0
  // 처음에는 30초 뒤에 400 을, 다음에는 그만두라는 신호가 올 때까지 답하지 않는다.
  const fetchFn = ((_url: string, init: RequestInit) => {
    sent += 1
    if (sent === 1) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(apiError(400, "invalid_request_error")), 30_000)
      )
    }
    return new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("멈춤", "AbortError")))
    })
  }) as unknown as typeof fetch
  const claude = createAnthropicProvider({ apiKey: "sk-test-key", model: "claude-test", fetchFn })
  t.mock.method(console, "error", () => {})

  let result: unknown
  void claude.generate(request).then((value) => {
    result = value
  })
  t.mock.timers.tick(30_000)
  await tick()
  assert.equal(sent, 2)

  t.mock.timers.tick(TIMEOUT_MS - 30_000)
  await tick()
  assert.deepEqual(result, { status: "error", reason: "busy" })
})

test("앞뒤에 다른 글이나 코드 표시가 붙어 있어도 JSON 을 꺼낸다", async () => {
  const { provider: claude } = provider([message("정리했습니다.\n```json\n" + JSON.stringify(answer) + "\n```")])
  const result = await claude.generate(request)
  assert.deepEqual(result.status === "ok" && result.output, answer)
})

test("여러 글 묶음으로 나뉘어 온 답은 이어서 읽는다", async () => {
  const text = JSON.stringify(answer)
  const response = Response.json({
    stop_reason: "end_turn",
    content: [{ type: "thinking", thinking: "생각" }, { type: "text", text: text.slice(0, 10) }, { type: "text", text: text.slice(10) }],
  })
  const { provider: claude } = provider([response])
  const result = await claude.generate(request)
  assert.deepEqual(result, { status: "ok", output: answer, model: "claude-test" })
})

test("오류 번호에 따라 까닭을 나눈다", async () => {
  const cases: [number, string, string][] = [
    [401, "authentication_error", "auth"],
    [403, "permission_error", "auth"],
    [404, "not_found_error", "model"],
    [413, "request_too_large", "too-long"],
    [429, "rate_limit_error", "busy"],
    [500, "api_error", "busy"],
    [529, "overloaded_error", "busy"],
    [418, "unknown_error", "failed"],
  ]
  for (const [status, type, reason] of cases) {
    const { provider: claude } = provider([apiError(status, type)])
    assert.deepEqual(await claude.generate(request), { status: "error", reason }, String(status))
  }
})

test("보낸 글이 너무 길다는 오류는 따로 알린다", async () => {
  const tooLong = () => apiError(400, "invalid_request_error", "prompt is too long: 250000 tokens > 200000 maximum")
  const { calls, provider: claude } = provider([tooLong(), tooLong()])
  assert.deepEqual(await claude.generate(request), { status: "error", reason: "too-long" })
  assert.equal(calls.length, 2)
})

test("거절한 답과 한도를 넘은 답을 나눈다", async () => {
  const refused = provider([message("", { stop_reason: "refusal" })])
  assert.deepEqual(await refused.provider.generate(request), { status: "error", reason: "refused" })
  const exceeded = provider([message("", { stop_reason: "model_context_window_exceeded" })])
  assert.deepEqual(await exceeded.provider.generate(request), { status: "error", reason: "too-long" })
})

test("JSON 이 아니거나 중간에 끊긴 답은 모양이 틀린 것으로 본다", async () => {
  const plain = provider([message("죄송하지만 정리할 수 없습니다.")])
  assert.deepEqual(await plain.provider.generate(request), { status: "error", reason: "invalid-output" })
  const cut = provider([message('{"overview": "요약", "themes": [', { stop_reason: "max_tokens" })])
  assert.deepEqual(await cut.provider.generate(request), { status: "error", reason: "invalid-output" })
})

test("닿지 못하면 잠시 뒤 다시 하라고 알린다", async () => {
  const { provider: claude } = provider([new Error("network down")])
  assert.deepEqual(await claude.generate(request), { status: "error", reason: "busy" })
})

test("글에서 JSON 객체를 찾는다", () => {
  assert.deepEqual(extractJson('{"a": 1}'), { a: 1 })
  assert.deepEqual(extractJson('앞 {"a": {"b": 2}} 뒤'), { a: { b: 2 } })
  assert.equal(extractJson("객체가 없다"), undefined)
  assert.equal(extractJson("} 거꾸로 {"), undefined)
  assert.equal(extractJson('{"a": '), undefined)
})

test("시험용 Provider 는 받은 자료로 정해진 모양의 답을 만든다", async () => {
  const user = '<logs>\n<log n="1">\n제목: 기록 1\n시도한 내용: 해 봤다\n배운 점: 배웠다\n</log>\n<log n="2">\n제목: 기록 2\n시도한 내용: 또 해 봤다\n다음 행동: 더 해 본다\n</log>\n</logs>'
  const result = await createMockProvider().generate({ system: "", user, schema: {} })
  assert.equal(result.status, "ok")
  const output = result.status === "ok" ? (result.output as Record<string, unknown[]>) : {}
  assert.deepEqual(output.themes, [{ title: "예시 주제", summary: "처음 두 기록을 근거로 단 예시입니다.", logs: [1, 2] }])
  assert.deepEqual(output.lessons, [{ text: "배웠다", logs: [1] }])
  assert.deepEqual(output.next_actions, [{ text: "더 해 본다", logs: [2] }])
})

test("남기는 글에서 키와 키처럼 생긴 글자를 가린다", async () => {
  assert.equal(redactSecrets("x-api-key: sk-test-key 가 틀렸습니다", "sk-test-key"), "x-api-key: [가림] 가 틀렸습니다")
  assert.equal(redactSecrets("다른 키 sk-ant-api03-AbCdEfGh_1234-xyz 도 보인다", "sk-test-key"), "다른 키 [가림] 도 보인다")
  assert.equal(redactSecrets("키가 없는 글", "sk-test-key"), "키가 없는 글")
})

test("오류가 나도 키는 돌려주는 값과 남기는 글 어디에도 들어가지 않는다", async (t) => {
  const logged: string[] = []
  t.mock.method(console, "error", (...parts: unknown[]) => {
    logged.push(parts.map((part) => (part instanceof Error ? `${part.name} ${part.message} ${part.stack}` : String(part))).join(" "))
  })

  // 중간의 다른 서버가 요청의 머리말을 오류 설명에 되돌려 적은 경우를 흉내 낸다.
  const echoed = () => apiError(400, "invalid_request_error", "bad header x-api-key: sk-test-key")
  const cases: (Response | Error)[][] = [
    [echoed(), echoed()],
    [apiError(401, "authentication_error", "invalid x-api-key sk-test-key")],
    [new Error("fetch failed for sk-test-key")],
    [message("JSON 이 아닌 답 sk-test-key")],
  ]
  for (const responses of cases) {
    const { provider: claude } = provider(responses)
    const result = await claude.generate(request)
    assert.equal(result.status, "error")
    assert.doesNotMatch(JSON.stringify(result), /sk-test-key/)
  }

  assert.ok(logged.length >= 4)
  for (const line of logged) {
    assert.doesNotMatch(line, /sk-test-key/)
  }
})
