// 목록에서 한 번에 더 읽는 기록 수와, 한 화면에 보여 주는 최대 수.
export const AI_LOG_PAGE_SIZE = 20
export const AI_LOG_LIMIT_MAX = 200

// 주소의 n 값을 읽을 기록 수로 바꾼다. 값이 없거나 이상하면 첫 묶음만 읽는다.
export function logLimit(value: string | string[] | undefined) {
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10)
  if (!Number.isFinite(parsed)) {
    return AI_LOG_PAGE_SIZE
  }
  return Math.min(Math.max(parsed, AI_LOG_PAGE_SIZE), AI_LOG_LIMIT_MAX)
}
