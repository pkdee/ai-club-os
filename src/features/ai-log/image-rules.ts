// AI Log 에 붙이는 이미지의 규칙.
// 데이터베이스의 ai_log_attachments 제약, private.ai_log_image_limit, Storage 의 저장 공간 설정과 같은 값이어야 한다.

export const AI_LOG_IMAGE_BUCKET = "ai-log-images"
// 한 기록에 붙이는 수.
export const AI_LOG_IMAGE_LIMIT = 4
// 한 장의 크기. 5MB 다.
export const AI_LOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024

// 받는 형식과 저장할 때 붙이는 확장자. SVG 는 안에 스크립트를 담을 수 있어 받지 않는다.
const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
} as const

export type AiLogImageType = keyof typeof EXTENSIONS

export const AI_LOG_IMAGE_TYPES = Object.keys(EXTENSIONS) as AiLogImageType[]
// 파일을 고르는 창에 넘기는 값.
export const AI_LOG_IMAGE_ACCEPT = AI_LOG_IMAGE_TYPES.join(",")
export const AI_LOG_IMAGE_TYPE_NAMES = "PNG, JPEG, WebP, GIF"

export function isAiLogImageType(value: unknown): value is AiLogImageType {
  return typeof value === "string" && Object.hasOwn(EXTENSIONS, value)
}

// 크기를 사람이 읽는 글자로 바꾼다.
export function formatImageSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    const megabytes = bytes / (1024 * 1024)
    return `${megabytes >= 10 ? Math.round(megabytes) : Math.round(megabytes * 10) / 10}MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))}KB`
}

// 올릴 수 없는 파일이면 그 이유를 돌려준다. 올릴 수 있으면 null 이다.
export function imageFileError(file: { type: unknown; size: unknown }) {
  if (!isAiLogImageType(file.type)) {
    return `${AI_LOG_IMAGE_TYPE_NAMES} 형식의 이미지만 붙일 수 있습니다.`
  }
  if (
    typeof file.size !== "number" ||
    !Number.isInteger(file.size) ||
    file.size < 1
  ) {
    return "빈 파일은 붙일 수 없습니다."
  }
  if (file.size > AI_LOG_IMAGE_MAX_BYTES) {
    return `한 장에 ${formatImageSize(AI_LOG_IMAGE_MAX_BYTES)} 까지 붙일 수 있습니다. 이 파일은 ${formatImageSize(file.size)} 입니다.`
  }
  return null
}

// Storage 안의 경로. Club, 기록, 파일 이름의 세 마디다.
// 파일 이름은 앱이 만든 식별자와 형식에 맞는 확장자다. 사용자가 올린 파일의 이름은 쓰지 않는다.
export function aiLogImagePath(
  clubId: string,
  logId: string,
  fileId: string,
  type: AiLogImageType
) {
  return `${clubId}/${logId}/${fileId}.${EXTENSIONS[type]}`
}

const PATH_PATTERN =
  /^([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\.(?:png|jpg|webp|gif)$/

// 경로가 앱이 만든 모양이면 Club 과 기록을 돌려준다. 아니면 null 이다.
export function parseAiLogImagePath(path: unknown) {
  const match = typeof path === "string" ? PATH_PATTERN.exec(path) : null
  return match ? { clubId: match[1], logId: match[2] } : null
}

export type ImagePick<T> = {
  // 올릴 파일. 남은 자리만큼만 담는다.
  accepted: T[]
  // 올리지 않는 파일과 그 이유.
  rejected: { name: string; message: string }[]
}

// 고른 파일을 올릴 것과 올리지 않을 것으로 가른다. remaining 은 남은 자리의 수다.
export function pickImageFiles<
  T extends { name: string; type: string; size: number },
>(files: T[], remaining: number): ImagePick<T> {
  const pick: ImagePick<T> = { accepted: [], rejected: [] }

  for (const file of files) {
    const message = imageFileError(file)
    if (message) {
      pick.rejected.push({ name: file.name, message })
    } else if (pick.accepted.length >= Math.max(0, remaining)) {
      pick.rejected.push({
        name: file.name,
        message: `한 기록에 ${AI_LOG_IMAGE_LIMIT}장까지 붙일 수 있어 올리지 않았습니다.`,
      })
    } else {
      pick.accepted.push(file)
    }
  }
  return pick
}
