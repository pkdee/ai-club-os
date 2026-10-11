import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/uuid"

import { signAiLogImageUrls } from "./image-store"

export type AiLogImage = {
  id: string
  // 잠깐 쓰는 주소. 올리다 만 것이어서 파일이 없으면 null 이다.
  url: string | null
  sizeBytes: number
}

// 한 기록에 붙은 이미지. 붙인 순서다.
// unavailable 은 데이터베이스에 이미지의 구조가 아직 없다는 뜻이다.
// loadFailed 는 목록은 읽었지만 Storage 가 응답하지 않아 주소를 만들지 못했다는 뜻이다.
export type AiLogImagesResult =
  | { status: "ok"; images: AiLogImage[]; loadFailed: boolean }
  | { status: "unavailable" }
  | { status: "error" }

function isMissingTable(error: { code?: string }) {
  return error.code === "42P01" || error.code === "PGRST205"
}

export const listAiLogImages = cache(
  async (clubId: string, logId: string): Promise<AiLogImagesResult> => {
    if (!isUuid(logId)) {
      return { status: "ok", images: [], loadFailed: false }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ai_log_attachments")
      .select("id, path, size_bytes")
      .eq("club_id", clubId)
      .eq("log_id", logId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })

    if (error) {
      if (isMissingTable(error)) {
        return { status: "unavailable" }
      }
      console.error("붙인 이미지를 불러오지 못했습니다.", error)
      return { status: "error" }
    }

    const urls = await signAiLogImageUrls(
      supabase,
      data.map((row) => String(row.path))
    )

    return {
      status: "ok",
      images: data.map((row) => ({
        id: String(row.id),
        url: urls?.get(String(row.path)) ?? null,
        sizeBytes: Number(row.size_bytes),
      })),
      loadFailed: urls === null,
    }
  }
)
