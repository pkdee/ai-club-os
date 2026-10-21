import type { DocEntry } from "./catalog"

// 빌드할 때 remark-markdown.mjs 가 만든 Markdown 의 조각. 상대 경로 링크만 { href } 로 따로 둔다.
export type MarkdownPart = string | { href: string }

// "마크다운으로 복사" 로 넘길 글을 만든다. 상대 경로 링크는 base(지금 문서의 주소)를 기준으로 전체 주소로 바꾼다.
// 화면처럼 frontmatter 의 제목과 소개를 맨 앞에 둔다. 본문에는 # 제목이 없고 frontmatter 는 빠져 있다.
export function docMarkdown(
  entry: Pick<DocEntry, "title" | "description">,
  parts: readonly MarkdownPart[],
  base: string
): string {
  const body = parts
    .map((part) =>
      typeof part === "string" ? part : new URL(part.href, base).href
    )
    .join("")
  return `# ${entry.title}\n\n${entry.description}\n\n${body}\n`
}

const HANGUL = /[가-힣]/g
const WORD = /[A-Za-z0-9]+/g

// 문서를 읽는 데 걸리는 시간을 분으로 어림한다. 머리말에 "약 N분" 으로 보인다.
// 한글은 1분에 500자, 영어와 숫자는 1분에 200낱말로 셈한다. 코드와 링크의 글자도 함께 센다.
export function readingMinutes(parts: readonly MarkdownPart[]) {
  const text = parts.filter((part) => typeof part === "string").join("")
  const hangul = text.match(HANGUL)?.length ?? 0
  const words = text.match(WORD)?.length ?? 0
  return Math.max(1, Math.round(hangul / 500 + words / 200))
}
