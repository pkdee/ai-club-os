export type LoginError = "auth_failed" | "not_configured"

const MESSAGES: Record<LoginError, { title: string; description: string }> = {
  auth_failed: {
    title: "로그인하지 못했습니다",
    description:
      "Google 인증이 취소되었거나 시간이 지났습니다. 아래 버튼으로 다시 시도해 주세요.",
  },
  not_configured: {
    title: "로그인이 아직 연결되지 않았습니다",
    description:
      "Google Login 은 Supabase 연결을 마친 뒤에 동작합니다. 지금은 화면만 확인할 수 있습니다.",
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
