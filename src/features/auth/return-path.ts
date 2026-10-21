// 로그인을 마친 뒤 돌아갈 경로를 잠깐 담아 두는 쿠키 이름.
export const RETURN_PATH_COOKIE = "return-path"

const MAX_LENGTH = 512
const BASE = "http://internal.invalid"

// 로그인한 뒤 돌아갈 경로를 확인한다. 이 앱 안의 경로만 허용하고, 그 밖의 값은 null 로 버린다.
// 받은 값을 그대로 믿고 이동하면 로그인 화면이 다른 사이트로 보내는 통로가 된다.
export function safeReturnPath(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_LENGTH
  ) {
    return null
  }
  // / 하나로 시작해야 한다. // 나 /\ 로 시작하면 브라우저가 다른 사이트로 읽을 수 있다.
  if (!/^\/(?![/\\])/.test(value) || /[\\\u0000-\u001f\u007f]/.test(value)) {
    return null
  }

  let url: URL
  try {
    url = new URL(value, BASE)
  } catch {
    return null
  }
  if (url.origin !== BASE) {
    return null
  }
  // "/.//evil.example" 처럼 . 과 .. 을 정리한 뒤에야 // 로 시작하는 값이 있다. 정리한 경로를 한 번 더 본다.
  if (!/^\/(?![/\\])/.test(url.pathname)) {
    return null
  }
  // 처음 화면과 로그인 관련 경로는 돌아갈 곳으로 삼지 않는다.
  if (
    url.pathname === "/" ||
    url.pathname === "/login" ||
    url.pathname.startsWith("/auth/")
  ) {
    return null
  }

  // Next.js 가 화면 조각을 받을 때 붙이는 값은 뺀다.
  if (url.searchParams.has("_rsc")) {
    url.searchParams.delete("_rsc")
  }
  return `${url.pathname}${url.search}`
}
