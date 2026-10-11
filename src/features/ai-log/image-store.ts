import "server-only"

import type { createClient } from "@/lib/supabase/server"

import { AI_LOG_IMAGE_BUCKET } from "./image-rules"

// AI Log 의 이미지를 두는 Storage 와 이야기하는 곳. 이 기능에서 Storage 를 부르는 코드는 이 파일에만 둔다.

type Supabase = Awaited<ReturnType<typeof createClient>>

// 잠깐 쓰는 주소가 살아 있는 시간. 화면을 열 때마다 새로 만든다.
const SIGNED_URL_SECONDS = 60 * 60
// 한 번에 지우거나 읽는 수.
const CHUNK = 100

function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

// 경로마다 잠깐 쓰는 주소를 만든다. 파일이 없는 경로는 결과에 넣지 않는다.
// Storage 가 응답하지 않으면 null 이다.
export async function signAiLogImageUrls(supabase: Supabase, paths: string[]) {
  const urls = new Map<string, string>()
  if (paths.length === 0) {
    return urls
  }

  const { data, error } = await supabase.storage
    .from(AI_LOG_IMAGE_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_SECONDS)
  if (error) {
    console.error("이미지의 주소를 만들지 못했습니다.", error.message)
    return null
  }

  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) {
      urls.set(item.path, item.signedUrl)
    }
  }
  return urls
}

// 올릴 자리 하나에만 쓰는 표를 만든다. 접근 규칙은 표를 만드는 지금 확인된다.
export async function createAiLogImageUploadToken(
  supabase: Supabase,
  path: string
) {
  const { data, error } = await supabase.storage
    .from(AI_LOG_IMAGE_BUCKET)
    .createSignedUploadUrl(path)
  if (error) {
    console.error("이미지를 올릴 자리를 만들지 못했습니다.", error.message)
    return null
  }
  return data.token
}

// 파일을 지운다. 없는 파일은 그냥 지나간다. Storage 가 응답하지 않으면 false 다.
export async function removeAiLogImageFiles(supabase: Supabase, paths: string[]) {
  for (let start = 0; start < paths.length; start += CHUNK) {
    const { error } = await supabase.storage
      .from(AI_LOG_IMAGE_BUCKET)
      .remove(paths.slice(start, start + CHUNK))
    if (error) {
      console.error("이미지를 지우지 못했습니다.", error.message)
      return false
    }
  }
  return true
}

// 지울 대상. 기록 하나, Club 하나, 또는 한 사람이 붙인 것 모두다.
export type AiLogImageScope =
  | { clubId: string; logId?: string }
  | { createdBy: string }

// 대상에 붙은 이미지의 경로를 모두 읽는다. 목록의 구조가 아직 없으면 빈 목록이다. 읽지 못하면 null 이다.
export async function listAiLogImagePaths(
  supabase: Supabase,
  scope: AiLogImageScope
) {
  const paths: string[] = []

  for (let start = 0; ; start += CHUNK) {
    let query = supabase.from("ai_log_attachments").select("path")
    if ("createdBy" in scope) {
      query = query.eq("created_by", scope.createdBy)
    } else {
      query = query.eq("club_id", scope.clubId)
      if (scope.logId) {
        query = query.eq("log_id", scope.logId)
      }
    }

    const { data, error } = await query
      .order("id", { ascending: true })
      .range(start, start + CHUNK - 1)
    if (error) {
      if (isMissingTable(error)) {
        return []
      }
      console.error("붙인 이미지의 목록을 읽지 못했습니다.", error)
      return null
    }

    paths.push(...data.map((row) => String(row.path)))
    if (data.length < CHUNK) {
      return paths
    }
  }
}

// 대상에 붙은 이미지의 파일을 Storage 에서 지운다. 목록의 줄은 기록이나 Club 이 지워질 때 함께 지워진다.
// 지울 권한이 없는 파일은 Storage 의 접근 규칙이 오류 없이 남겨 둔다.
export async function removeAiLogImagesOf(
  supabase: Supabase,
  scope: AiLogImageScope
) {
  const paths = await listAiLogImagePaths(supabase, scope)
  return paths !== null && (await removeAiLogImageFiles(supabase, paths))
}
