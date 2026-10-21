// Docs 에 보이는 문서의 목록. 왼쪽 목록과 이전 문서, 다음 문서가 이 순서를 따른다.
// 문서를 더하려면 이 폴더에 <slug>.mdx 를 만들고 여기에 한 줄을 더한다. 목록에 없는 파일은 화면에 나오지 않는다.
// slug 는 주소에 쓰이므로 영어 소문자, 숫자, 하이픈만 쓴다.
export type DocEntry = {
  slug: string
  title: string
  // 문서 제목 아래와 브라우저 미리 보기에 쓰는 한 줄 소개.
  description: string
}

export const DOCS: readonly DocEntry[] = [
  {
    slug: "getting-started",
    title: "시작하기",
    description:
      "AI Club OS 에서 활동을 기록하고 정리하는 흐름을 처음부터 따라가 봅니다.",
  },
]
