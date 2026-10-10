// 한 Club 이 하루에 AI Insight 를 만들 수 있는 횟수. 하루는 한국 시간의 날짜로 나눈다.
// 실제로 막는 것은 데이터베이스이고, private.ai_insight_daily_limit 과 같은 값이어야 한다.
export const INSIGHT_DAILY_LIMIT = 10

// 오늘 쓴 횟수에서 남은 횟수를 구한다.
export function insightRunsLeft(used: number) {
  return Math.max(0, INSIGHT_DAILY_LIMIT - Math.max(0, Math.floor(used)))
}
