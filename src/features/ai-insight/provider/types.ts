// AI Provider 와 제품 기능 사이의 경계. 제품 쪽은 이 모양만 알고, 어느 회사의 AI 를 쓰는지는 모른다.
// Provider 를 바꾸거나 더할 때는 이 폴더에 구현을 하나 더하고 index.ts 에서 고르게 한다.

export type InsightProviderRequest = {
  // 지킬 것을 적은 글.
  system: string
  // 정리할 자료.
  user: string
  // 답할 JSON 의 모양. 모양을 정해 줄 수 있는 Provider 는 이것을 쓴다.
  schema: Record<string, unknown>
}

// 만들지 못한 까닭. 화면이 이 값으로 안내를 고른다.
export type InsightProviderFailure =
  // 키가 틀렸거나 권한이 없다.
  | "auth"
  // 설정한 모델을 쓸 수 없다.
  | "model"
  // 요청이 몰렸거나 응답이 늦다. 잠시 뒤에 다시 하면 된다.
  | "busy"
  // AI 서비스에서 오늘 쓸 수 있는 횟수를 다 썼다. 한도가 다시 채워질 때까지 기다려야 한다.
  | "quota"
  // AI 가 정리하기를 거절했다.
  | "refused"
  // 보낸 글이 너무 길다.
  | "too-long"
  // 답이 왔지만 정해진 모양이 아니다.
  | "invalid-output"
  | "failed"

export type InsightProviderResult =
  | { status: "ok"; output: unknown; model: string }
  | { status: "error"; reason: InsightProviderFailure }

export type InsightProvider = {
  // 데이터베이스에 적는 이름.
  name: string
  // 화면에 보여 주는 이름.
  label: string
  // 받은 글을 그 회사가 어떻게 쓰는지 사용자에게 따로 알려야 할 때의 글. 따로 알릴 것이 없으면 null 이다.
  dataNotice: string | null
  model: string
  generate(request: InsightProviderRequest): Promise<InsightProviderResult>
}
