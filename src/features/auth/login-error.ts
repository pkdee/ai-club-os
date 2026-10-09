export type LoginError = "auth_failed" | "not_configured"

const MESSAGES: Record<LoginError, { title: string; description: string }> = {
  auth_failed: {
    title: "로그인하지 못했습니다",
    description:
      "Google 인증이 취소되었거나 시간이 지났습니다. 아래 버튼으로 다시 시도해 주세요.",
  },
  not_configured: {
    title: "로그인 설정이 비어 있습니다",
    description:
      "Supabase 연결 값이 없어 로그인을 시작할 수 없습니다. .env.local 의 값을 채운 뒤 서버를 다시 시작해 주세요.",
  },
}

export function parseLoginError(
  value: string | string[] | undefined
): LoginError | null {
  return typeof value === "string" && value in MESSAGES
    ? (value as LoginError)
    : null
}

export function loginErrorMessage(error: LoginError) {
  return MESSAGES[error]
}
