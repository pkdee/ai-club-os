"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/session"
import { getClubAccess } from "@/features/club/queries"
import { getSession } from "@/features/session/queries"
import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import {
  insightFromAiOutput,
  parseInsightContent,
  type InsightContent,
} from "./content"
import { INSIGHT_DAILY_LIMIT } from "./limit"
import { isMonthKey, monthKeyOf, monthLabel, monthRange } from "./period"
import {
  INSIGHT_MIN_LOGS,
  buildInsightPrompt,
  type InsightTarget,
} from "./prompt"
import { getInsightProvider, type InsightProviderFailure } from "./provider"
import {
  getPeriodInsight,
  getSessionInsight,
  listInsightSourceLogs,
  listInsightSourceRetrospectives,
  type InsightResult,
} from "./queries"

export type InsightActionResult = { ok: true } | { ok: false; message: string }

// 같은 대상을 이 시간 안에 다시 만들지 못하게 한다. 버튼을 거듭 눌러 비용이 겹쳐 나가는 일을 막는다.
const REGENERATE_WAIT_MS = 20_000

const RETRY_MESSAGE =
  "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."
const ADMIN_ONLY_MESSAGE =
  "운영자만 할 수 있는 일입니다. 내 역할이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const NOT_CONFIGURED_MESSAGE =
  "AI Provider 가 설정되지 않았습니다. 서버의 환경 변수에 ANTHROPIC_API_KEY 를 넣은 뒤 다시 시도해 주세요."
const NOT_READY_MESSAGE =
  "데이터베이스에 AI Insight 의 구조가 아직 없습니다. 최신 마이그레이션을 적용한 뒤 다시 시도해 주세요."
const TARGET_GONE_MESSAGE =
  "정리할 대상을 찾을 수 없습니다. 화면을 새로 고친 뒤 다시 골라 주세요."
const TOO_FEW_MESSAGE = `AI Log 가 ${INSIGHT_MIN_LOGS}개 이상 있어야 정리할 수 있습니다.`
const TOO_SOON_MESSAGE =
  "방금 만들었습니다. 잠시 뒤에 다시 만들어 주세요."
const DAILY_LIMIT_MESSAGE = `오늘은 이 Club 에서 AI Insight 를 ${INSIGHT_DAILY_LIMIT}번 만들었습니다. 내일 다시 만들 수 있습니다.`
const GONE_MESSAGE =
  "AI Insight 를 찾을 수 없습니다. 이미 지워졌거나 내 역할이 바뀌었을 수 있습니다. 화면을 새로 고쳐 확인해 주세요."
const EMPTY_CONTENT_MESSAGE =
  "남길 내용이 없습니다. 요약이나 항목을 하나 이상 남겨 주세요."

const PROVIDER_MESSAGES: Record<InsightProviderFailure, string> = {
  auth: "AI Provider 가 키를 받아들이지 않았습니다. 서버에 넣은 API 키(ANTHROPIC_API_KEY 나 GEMINI_API_KEY)가 맞는지 확인해 주세요.",
  model:
    "설정한 모델을 쓸 수 없습니다. 서버의 AI_INSIGHT_MODEL 값을 확인해 주세요.",
  busy: "AI Provider 가 지금 바쁘거나 응답이 늦습니다. 잠시 뒤 다시 시도해 주세요. 기록은 그대로 남아 있습니다.",
  quota:
    "AI 서비스에서 오늘 쓸 수 있는 횟수를 다 썼습니다. 횟수는 매일 한국 시간 오후 4시쯤(11월부터 3월 사이에는 오후 5시쯤) 다시 채워집니다. 기록은 그대로 남아 있습니다.",
  refused:
    "AI 가 이 기록들을 정리하지 않겠다고 답했습니다. 기록 내용을 확인한 뒤 다시 시도해 주세요.",
  "too-long":
    "보낼 기록이 너무 길어 정리하지 못했습니다. 기록이 적은 대상으로 다시 시도해 주세요.",
  "invalid-output":
    "AI 의 답이 정해진 모양이 아니어서 저장하지 않았습니다. 다시 시도해 주세요.",
  failed: "AI Insight 를 만들지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
}

// 이 Club 의 운영자인지 확인한다. AI 를 부르기 전에 먼저 확인해서, 운영자가 아닌 요청으로 비용이 나가지 않게 한다.
// 저장할 때는 데이터베이스의 접근 규칙이 한 번 더 판단한다.
async function isClubAdmin(clubId: string) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  const access = await getClubAccess(clubId, user.id)
  return access.status === "ok" && access.club.role === "admin"
}

type InsightPlace =
  | { scope: "session"; session_id: string }
  | { scope: "period"; period_start: string; period_end: string }

// AI 로 정리해서 초안으로 저장한다. 이미 있으면 같은 행을 고쳐 쓰고 초안으로 되돌린다.
async function generate(
  clubId: string,
  target: InsightTarget,
  place: InsightPlace,
  readExisting: () => Promise<InsightResult>,
  source: Parameters<typeof listInsightSourceLogs>[1]
): Promise<InsightActionResult> {
  const provider = getInsightProvider()
  if (!provider) {
    return { ok: false, message: NOT_CONFIGURED_MESSAGE }
  }

  const existing = await readExisting()
  if (existing.status === "unavailable") {
    return { ok: false, message: NOT_READY_MESSAGE }
  }
  if (existing.status === "error") {
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (
    existing.insight &&
    Date.now() - new Date(existing.insight.updatedAt).getTime() <
      REGENERATE_WAIT_MS
  ) {
    return { ok: false, message: TOO_SOON_MESSAGE }
  }

  const logs = await listInsightSourceLogs(clubId, source)
  if (!logs) {
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (logs.length < INSIGHT_MIN_LOGS) {
    return { ok: false, message: TOO_FEW_MESSAGE }
  }

  // 하루 횟수에 한 번을 남긴다. 다 썼으면 데이터베이스가 막는다.
  // AI 를 부르기 전에 남겨서 실패한 시도도 센다. 횟수를 두는 구조가 아직 없으면 세지 않고 진행한다.
  const supabase = await createClient()
  const claimed = await supabase
    .from("ai_insight_runs")
    .insert({ club_id: clubId })
  if (
    claimed.error &&
    claimed.error.code !== "42P01" &&
    claimed.error.code !== "PGRST205"
  ) {
    if (claimed.error.code === "P0001") {
      return { ok: false, message: DAILY_LIMIT_MESSAGE }
    }
    console.error("AI Insight 를 만든 횟수를 남기지 못했습니다.", claimed.error)
    return {
      ok: false,
      message:
        claimed.error.code === "42501" ? ADMIN_ONLY_MESSAGE : RETRY_MESSAGE,
    }
  }

  // 작성자가 써도 된다고 한 회고를 참고 자료로 함께 보낸다. 없거나 읽지 못해도 그대로 진행한다.
  const retrospectives = await listInsightSourceRetrospectives(clubId, source)
  const prompt = buildInsightPrompt(target, logs, retrospectives)
  const result = await provider.generate(prompt)
  if (result.status === "error") {
    return { ok: false, message: PROVIDER_MESSAGES[result.reason] }
  }

  const content = insightFromAiOutput(result.output, prompt.logIds)
  if (!content) {
    return { ok: false, message: PROVIDER_MESSAGES["invalid-output"] }
  }

  const fields = {
    content,
    source_log_ids: prompt.logIds,
    provider: provider.name,
    model: result.model,
  }
  let insightId = existing.insight?.id

  if (!insightId) {
    const { error } = await supabase
      .from("ai_insights")
      .insert({ club_id: clubId, ...place, ...fields })

    if (error?.code === "23505") {
      // 그사이 다른 운영자가 먼저 만들었다. 그 행을 고쳐 쓴다.
      const raced = await readExisting()
      insightId = raced.status === "ok" ? raced.insight?.id : undefined
      if (!insightId) {
        return { ok: false, message: RETRY_MESSAGE }
      }
    } else if (error) {
      console.error("AI Insight 를 저장하지 못했습니다.", error)
      return {
        ok: false,
        message: error.code === "42501" ? ADMIN_ONLY_MESSAGE : RETRY_MESSAGE,
      }
    }
  }

  if (insightId) {
    const { data, error } = await supabase
      .from("ai_insights")
      .update({ ...fields, status: "draft" })
      .eq("club_id", clubId)
      .eq("id", insightId)
      .select("id")

    if (error) {
      console.error("AI Insight 를 고쳐 쓰지 못했습니다.", error)
      return { ok: false, message: RETRY_MESSAGE }
    }
    // 접근 규칙에 막히면 오류 없이 바뀐 행이 0개로 돌아온다.
    if (data.length === 0) {
      return { ok: false, message: ADMIN_ONLY_MESSAGE }
    }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// 한 회차의 AI Log 를 정리한다. 운영자만 할 수 있다.
export async function generateSessionInsight(
  clubId: string,
  sessionId: string
): Promise<InsightActionResult> {
  if (!(await isClubAdmin(clubId))) {
    return { ok: false, message: ADMIN_ONLY_MESSAGE }
  }
  if (!isUuid(sessionId)) {
    return { ok: false, message: TARGET_GONE_MESSAGE }
  }

  const session = await getSession(clubId, sessionId)
  if (session.status !== "ok") {
    return {
      ok: false,
      message:
        session.status === "error" ? RETRY_MESSAGE : TARGET_GONE_MESSAGE,
    }
  }

  return generate(
    clubId,
    { scope: "session", label: session.session.title },
    { scope: "session", session_id: sessionId },
    () => getSessionInsight(clubId, sessionId),
    { sessionId }
  )
}

// 한 달 동안 남긴 Club 의 AI Log 를 정리한다. 달은 2026-10 같은 값으로 받는다. 운영자만 할 수 있다.
export async function generatePeriodInsight(
  clubId: string,
  month: string
): Promise<InsightActionResult> {
  if (!(await isClubAdmin(clubId))) {
    return { ok: false, message: ADMIN_ONLY_MESSAGE }
  }
  // 아직 오지 않은 달은 정리할 것이 없다.
  if (!isMonthKey(month) || month > monthKeyOf(new Date())) {
    return { ok: false, message: TARGET_GONE_MESSAGE }
  }

  const { start, end } = monthRange(month)
  return generate(
    clubId,
    { scope: "period", label: monthLabel(month) },
    { scope: "period", period_start: start, period_end: end },
    () => getPeriodInsight(clubId, start, end),
    { from: start, to: end }
  )
}

// 운영자가 고친 내용을 저장한다. 받은 값은 믿지 않고 같은 규칙으로 다듬은 뒤 저장한다.
export async function saveInsightContent(
  clubId: string,
  insightId: string,
  value: InsightContent
): Promise<InsightActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(insightId)) {
    return { ok: false, message: GONE_MESSAGE }
  }

  const content = parseInsightContent(value)
  if (!content) {
    return { ok: false, message: EMPTY_CONTENT_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_insights")
    .update({ content })
    .eq("club_id", clubId)
    .eq("id", insightId)
    .select("id")

  if (error) {
    console.error("AI Insight 의 내용을 고치지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: GONE_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// 공개하거나 초안으로 되돌린다. 공개하면 Member 에게 보인다.
export async function setInsightStatus(
  clubId: string,
  insightId: string,
  status: "draft" | "published"
): Promise<InsightActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(insightId) || (status !== "draft" && status !== "published")) {
    return { ok: false, message: GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_insights")
    .update({ status })
    .eq("club_id", clubId)
    .eq("id", insightId)
    .select("id")

  if (error) {
    console.error("AI Insight 의 공개 상태를 바꾸지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: GONE_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}

// AI Insight 를 지운다. 지우면 되살릴 수 없지만 원본 AI Log 는 그대로라서 다시 만들 수 있다.
export async function deleteInsight(
  clubId: string,
  insightId: string
): Promise<InsightActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (!isUuid(insightId)) {
    return { ok: false, message: GONE_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("ai_insights")
    .delete()
    .eq("club_id", clubId)
    .eq("id", insightId)
    .select("id")

  if (error) {
    console.error("AI Insight 를 지우지 못했습니다.", error)
    return { ok: false, message: RETRY_MESSAGE }
  }
  if (data.length === 0) {
    return { ok: false, message: GONE_MESSAGE }
  }

  revalidatePath(`/clubs/${clubId}`, "layout")
  return { ok: true }
}
