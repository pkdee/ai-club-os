// 데이터베이스가 만드는 발표 링크 값의 모양. 이 모양이 아니면 조회하지 않는다.
const TOKEN_PATTERN = /^[0-9a-f]{32}$/

export function isPresentationToken(value: unknown): value is string {
  return typeof value === "string" && TOKEN_PATTERN.test(value)
}

// 발표를 여는 주소. 로그인 없이 열 수 있다.
export function presentationPath(token: string) {
  return `/p/${token}`
}

// 같은 발표를 한 장씩 넘겨 보는 주소.
export function presentationSlidesPath(token: string) {
  return `${presentationPath(token)}/slides`
}
