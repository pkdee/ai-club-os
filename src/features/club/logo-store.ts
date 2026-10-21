import "server-only"

import type { createClient } from "@/lib/supabase/server"

import { CLUB_LOGO_BUCKET, type ClubLogoType } from "./logo-rules"

// Club 로고를 두는 Storage 와 이야기하는 곳. 이 기능에서 Storage 를 부르는 코드는 이 파일에만 둔다.

type Supabase = Awaited<ReturnType<typeof createClient>>

// 한 번에 읽거나 지우는 수.
const CHUNK = 100

// 로고 파일을 올린다. 같은 자리에 덮어쓰지 않는다. 접근 규칙이 운영자인지 본다.
// 실패하면 부른 쪽이 안내를 고를 수 있게 오류를 함께 돌려준다.
export async function uploadClubLogoFile(
  supabase: Supabase,
  path: string,
  file: Blob,
  type: ClubLogoType
): Promise<{ ok: true } | { ok: false; error: { message: string } }> {
  const { error } = await supabase.storage
    .from(CLUB_LOGO_BUCKET)
    .upload(path, file, { contentType: type, upsert: false })
  if (error) {
    console.error("Club 로고를 올리지 못했습니다.", error.message)
    return { ok: false, error: { message: error.message } }
  }
  return { ok: true }
}

// 로고 파일을 읽는다. 없거나 읽지 못하면 null 이다.
export async function downloadClubLogoFile(supabase: Supabase, path: string) {
  const { data, error } = await supabase.storage
    .from(CLUB_LOGO_BUCKET)
    .download(path)
  if (error) {
    return null
  }
  return data
}

// 로고 파일 하나를 지운다. 없는 파일은 그냥 지나간다. Storage 가 응답하지 않으면 false 다.
export async function removeClubLogoFile(supabase: Supabase, path: string) {
  const { error } = await supabase.storage.from(CLUB_LOGO_BUCKET).remove([path])
  if (error) {
    console.error("Club 로고를 지우지 못했습니다.", error.message)
    return false
  }
  return true
}

// 그 Club 의 자리에 있는 로고 파일을 모두 지운다. 지금 쓰는 로고와, 바꾸다 실패해 남은 파일까지다.
// Club 을 지우기 전에 부른다. 파일이 남아 있으면 데이터베이스가 Club 을 지우지 못하게 막는다.
// Storage 가 응답하지 않거나 지우지 못한 파일이 있으면 false 다.
export async function removeClubLogoFiles(supabase: Supabase, clubId: string) {
  for (;;) {
    const { data, error } = await supabase.storage
      .from(CLUB_LOGO_BUCKET)
      .list(clubId, { limit: CHUNK })
    if (error) {
      console.error("Club 로고의 목록을 읽지 못했습니다.", error.message)
      return false
    }

    const paths = data.map((item) => `${clubId}/${item.name}`)
    if (paths.length === 0) {
      return true
    }

    const removed = await supabase.storage.from(CLUB_LOGO_BUCKET).remove(paths)
    if (removed.error) {
      console.error("Club 로고를 지우지 못했습니다.", removed.error.message)
      return false
    }
    // 지울 권한이 없는 파일은 Storage 가 오류 없이 남겨 둔다. 그대로 두고 끝낸다.
    if (removed.data.length < paths.length || data.length < CHUNK) {
      return removed.data.length === paths.length
    }
  }
}
