import { CLUB_LOGO_MAX_BYTES, CLUB_LOGO_SIZE, type ClubLogoType } from "./logo-rules"

// 브라우저에서 고른 이미지를 로고로 쓸 정사각형으로 줄인다.
// 가운데를 기준으로 정사각형만큼 잘라 CLUB_LOGO_SIZE 크기로 그린다. 서버로 보내는 양과 화면이 받는 양을 줄이려는 것이다.
// 읽을 수 없는 이미지거나 줄여도 크면 그 이유를 담은 오류를 던진다.
export async function resizeLogo(
  file: File
): Promise<{ blob: Blob; type: ClubLogoType }> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error("이미지를 읽지 못했습니다. 다른 이미지를 골라 주세요.")
  }

  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = CLUB_LOGO_SIZE
  canvas.height = CLUB_LOGO_SIZE
  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new Error("이 브라우저에서는 이미지를 줄일 수 없습니다.")
  }
  context.imageSmoothingQuality = "high"
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    CLUB_LOGO_SIZE,
    CLUB_LOGO_SIZE
  )
  bitmap.close()

  // WebP 로 만들지 못하는 브라우저는 PNG 를 돌려준다. 그때는 돌려받은 형식을 그대로 쓴다.
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9)
  )
  if (!blob || (blob.type !== "image/webp" && blob.type !== "image/png")) {
    throw new Error("이미지를 줄이지 못했습니다. 다른 이미지를 골라 주세요.")
  }
  if (blob.size > CLUB_LOGO_MAX_BYTES) {
    throw new Error("줄인 이미지가 너무 큽니다. 더 단순한 이미지를 골라 주세요.")
  }
  return { blob, type: blob.type }
}
