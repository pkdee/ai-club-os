import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import { parsePresentation, type PublicPresentation } from "./content"
import { isPresentationToken } from "./token"

// 공개된 발표 하나. 행이 있으면 공개된 것이다.
export type Presentation = {
  id: string
  token: string
  showNames: boolean
  publishedAt: string
  // 발표에만 보이는 소개 글. 데이터베이스에 그 열이 아직 없으면 null 이다.
  intro: string | null
}

// unavailable 은 데이터베이스에 발표의 구조가 아직 없다는 뜻이다.
// introReady 는 소개 글을 적을 수 있다는 뜻이다. 그 열이 아직 없으면 소개 글 칸을 그리지 않는다.
export type PresentationResult =
  | { status: "ok"; presentation: Presentation | null; introReady: boolean }
  | { status: "unavailable" }
  | { status: "error" }

export type PublicPresentationResult =
  | { status: "ok"; presentation: PublicPresentation }
  // 링크가 틀렸거나 공개를 거뒀다.
  | { status: "not-found" }
  | { status: "error" }

type PresentationRow = {
  id: string
  token: string
  show_names: boolean
  created_at: string
  // 소개 글 열이 아직 없는 데이터베이스에서 읽으면 이 값이 없다.
  intro?: string
}

const COLUMNS = "id, token, show_names, created_at"
// 소개 글. 그 열이 생긴 뒤에만 읽을 수 있다.
const INTRO_COLUMN = ", intro"
// 열이 아직 없을 때의 오류 번호.
const MISSING_COLUMN = "42703"

type ReadResponse = { data: unknown; error: { code?: string } | null }

// 소개 글과 함께 읽어 보고, 그 열이 아직 없으면 소개 글 없이 다시 읽는다.
async function readPresentation(
  read: (columns: string) => PromiseLike<ReadResponse>,
  label: string
): Promise<PresentationResult> {
  let response = await read(COLUMNS + INTRO_COLUMN)
  const introReady = response.error?.code !== MISSING_COLUMN
  if (!introReady) {
    response = await read(COLUMNS)
  }
  return toResult(response.data, response.error, label, introReady)
}

function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

function toResult(
  data: unknown,
  error: { code?: string } | null,
  label: string,
  introReady: boolean
): PresentationResult {
  if (error) {
    if (isMissingTable(error)) {
      return { status: "unavailable" }
    }
    console.error(`${label} 발표를 불러오지 못했습니다.`, error)
    return { status: "error" }
  }
  const row = data as PresentationRow | null
  return {
    status: "ok",
    presentation: row
      ? {
          id: row.id,
          token: row.token,
          showNames: row.show_names,
          publishedAt: row.created_at,
          intro: typeof row.intro === "string" ? row.intro : null,
        }
      : null,
    introReady,
  }
}

// 한 Project 의 발표를 읽는다. 공개하지 않았으면 null 이다. Club 의 Member 에게 보인다.
export const getProjectPresentation = cache(
  async (clubId: string, projectId: string): Promise<PresentationResult> => {
    if (!isUuid(projectId)) {
      return { status: "ok", presentation: null, introReady: false }
    }

    const supabase = await createClient()
    return readPresentation(
      (columns) =>
        supabase
          .from("presentations")
          .select(columns)
          .eq("club_id", clubId)
          .eq("scope", "project")
          .eq("project_id", projectId)
          .maybeSingle(),
      "Project"
    )
  }
)

// Club 의 발표를 읽는다. 공개하지 않았으면 null 이다.
export const getClubPresentation = cache(
  async (clubId: string): Promise<PresentationResult> => {
    const supabase = await createClient()
    return readPresentation(
      (columns) =>
        supabase
          .from("presentations")
          .select(columns)
          .eq("club_id", clubId)
          .eq("scope", "club")
          .maybeSingle(),
      "Club"
    )
  }
)

// 한 Project 에 묶인 AI Log 가운데 작성자가 발표에 넣어도 된다고 한 것의 수와 전체 수.
// 공개하기 전에 무엇이 나가는지 알리는 데 쓴다. 세지 못하면 null 이다.
export async function countProjectSharedLogs(
  clubId: string,
  projectId: string
): Promise<{ shared: number; total: number } | null> {
  if (!isUuid(projectId)) {
    return null
  }

  const supabase = await createClient()
  const count = (onlyShared: boolean) => {
    let query = supabase
      .from("ai_logs")
      .select("id", { count: "exact" })
      .eq("club_id", clubId)
      .eq("project_id", projectId)
    if (onlyShared) {
      query = query.eq("share_in_presentation", true)
    }
    return query.range(0, 0)
  }

  const [all, shared] = await Promise.all([count(false), count(true)])
  if (all.error || shared.error || all.count === null || shared.count === null) {
    // 열이 아직 없을 때의 오류는 남기지 않는다.
    if (all.error?.code !== "42703" && shared.error?.code !== "42703") {
      console.error(
        "발표에 넣을 AI Log 수를 세지 못했습니다.",
        all.error ?? shared.error
      )
    }
    return null
  }
  return { shared: shared.count, total: all.count }
}

// 링크 값으로 발표의 내용을 읽는다. 로그인하지 않은 사람도 읽을 수 있는 단 하나의 조회다.
// 무엇을 내보낼지는 데이터베이스의 get_presentation 함수가 정하고, 여기서는 받은 값의 모양을 한 번 더 확인한다.
export const getPublicPresentation = cache(
  async (token: string): Promise<PublicPresentationResult> => {
    if (!isPresentationToken(token)) {
      return { status: "not-found" }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_presentation", {
      presentation_token: token,
    })

    if (error) {
      // 함수가 아직 없으면 발표도 없는 것이다.
      if (error.code === "PGRST202" || error.code === "42883") {
        return { status: "not-found" }
      }
      console.error("발표를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const presentation = parsePresentation(data)
    return presentation
      ? { status: "ok", presentation }
      : { status: "not-found" }
  }
)
