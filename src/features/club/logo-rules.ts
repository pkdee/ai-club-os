// Club 로고의 규칙.
// Storage 의 club-logos 저장 공간 설정, 데이터베이스의 clubs_logo_path_format 제약과 같은 값이어야 한다.

export const CLUB_LOGO_BUCKET = "club-logos"
// 브라우저가 이 크기의 정사각형으로 줄여서 올린다. 화면에서 가장 크게 보이는 자리의 두 배쯤이다.
export const CLUB_LOGO_SIZE = 256
// 줄인 뒤의 한 장 크기. 512KB 다. 서버 동작이 받는 요청의 크기 한도(1MB)보다 작게 둔다.
export const CLUB_LOGO_MAX_BYTES = 512 * 1024
// 줄이기 전에 고를 수 있는 원본의 크기. 10MB 다.
export const CLUB_LOGO_SOURCE_MAX_BYTES = 10 * 1024 * 1024

// 올리는 형식과 저장할 때 붙이는 확장자. SVG 는 안에 스크립트를 담을 수 있어 받지 않는다.
const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const

export type ClubLogoType = keyof typeof EXTENSIONS

// 원본으로 고를 수 있는 형식. GIF 는 첫 장면만 쓴다.
export const CLUB_LOGO_SOURCE_ACCEPT = "image/png,image/jpeg,image/webp,image/gif"
export const CLUB_LOGO_SOURCE_TYPE_NAMES = "PNG, JPEG, WebP, GIF"

export function isClubLogoType(value: unknown): value is ClubLogoType {
  return typeof value === "string" && Object.hasOwn(EXTENSIONS, value)
}

// Storage 안의 경로. Club 과 파일 이름의 두 마디다. 파일 이름은 앱이 만든 식별자와 형식에 맞는 확장자다.
export function clubLogoPath(clubId: string, fileId: string, type: ClubLogoType) {
  return `${clubId}/${fileId}.${EXTENSIONS[type]}`
}

// 주소에 오는 파일 이름의 모양. 데이터베이스의 제약과 같다.
const LOGO_FILE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/

const TYPE_BY_EXTENSION: Record<string, ClubLogoType> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
}

// 주소의 파일 이름이 앱이 만든 모양이면 그 형식을, 아니면 null 을 돌려준다.
export function clubLogoFileType(file: string): ClubLogoType | null {
  if (!LOGO_FILE.test(file)) {
    return null
  }
  return TYPE_BY_EXTENSION[file.slice(file.lastIndexOf(".") + 1)] ?? null
}

// 화면이 로고를 불러오는 주소. 앱의 /clubs/<Club>/logo/<파일 이름> 이 로그인을 확인하고 파일을 보내 준다.
// 파일 이름은 올릴 때마다 새로 만들어지므로 브라우저가 오래 기억해도 된다.
export function clubLogoUrl(clubId: string, logoPath: string | null) {
  if (!logoPath?.startsWith(`${clubId}/`)) {
    return null
  }
  const file = logoPath.slice(clubId.length + 1)
  return clubLogoFileType(file) ? `/clubs/${clubId}/logo/${file}` : null
}

// 줄이기 전의 원본을 받을 수 없으면 그 이유를 돌려준다. 받을 수 있으면 null 이다.
export function logoSourceError(file: { type: string; size: number }) {
  if (!CLUB_LOGO_SOURCE_ACCEPT.split(",").includes(file.type)) {
    return `${CLUB_LOGO_SOURCE_TYPE_NAMES} 형식의 이미지만 올릴 수 있습니다.`
  }
  if (file.size < 1) {
    return "빈 파일은 올릴 수 없습니다."
  }
  if (file.size > CLUB_LOGO_SOURCE_MAX_BYTES) {
    return "10MB 까지의 이미지만 올릴 수 있습니다."
  }
  return null
}
