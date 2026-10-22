// Docs 에 보이는 문서의 순서. 왼쪽 목록과 이전 문서, 다음 문서가 이 순서를 따른다.
// 문서를 더하려면 이 폴더에 <slug>.mdx 를 만들고 여기에 slug 를 더한다. 목록에 없는 파일은 화면에 나오지 않는다.
// slug 는 주소에 쓰이므로 영어 소문자, 숫자, 하이픈만 쓴다.
// 제목, 소개, 날짜, 태그는 각 문서 맨 앞의 frontmatter 에 적는다. 쓰는 법은 같은 폴더의 README.md 에 있다.
export const DOC_SLUGS: readonly string[] = [
  "getting-started",
  "prompt-engineering",
  "context-engineering",
  "ai-agent",
]
