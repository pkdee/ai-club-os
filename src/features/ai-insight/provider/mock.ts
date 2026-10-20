import type { InsightProvider } from "./types"

// 키 없이 화면과 흐름을 확인할 때 쓰는 시험용 Provider. 실제 AI 를 부르지 않는다.
// 받은 자료에서 줄을 그대로 옮겨 정해진 모양의 답을 만든다. 배포한 환경에서는 쓰지 않는다.
export function createMockProvider(): InsightProvider {
  return {
    name: "mock",
    label: "시험용 Provider",
    dataNotice: null,
    model: "mock",
    async generate(request) {
      const logs = [...request.user.matchAll(/<log n="(\d+)">\n([\s\S]*?)\n<\/log>/g)].map(
        (match) => ({ number: Number(match[1]), text: match[2] })
      )
      const pick = (label: string) =>
        logs
          .map((log) => ({
            text: log.text.match(new RegExp(`^${label}: (.+)$`, "m"))?.[1] ?? "",
            logs: [log.number],
          }))
          .filter((item) => item.text !== "")
          .slice(0, 3)

      return {
        status: "ok",
        model: "mock",
        output: {
          overview: `시험용 Provider 가 만든 예시입니다. 기록 ${logs.length}개를 읽었고 실제 AI 는 부르지 않았습니다.`,
          themes:
            logs.length >= 2
              ? [
                  {
                    title: "예시 주제",
                    summary: "처음 두 기록을 근거로 단 예시입니다.",
                    logs: [1, 2],
                  },
                ]
              : [],
          lessons: pick("배운 점"),
          next_actions: pick("다음 행동"),
        },
      }
    },
  }
}
