import { DOC_SLUGS } from "@/content/docs/list"

// 문서 맨 앞의 frontmatter 에 적는 값. 빌드할 때 front-matter.mjs 가 검사하고 모듈의 frontmatter 로 내보낸다.
export type DocMeta = {
  // 문서 머리말, 왼쪽 문서 목록, 이전 문서와 다음 문서, Session 의 참고 자료에 보이는 제목.
  title: string
  // 문서 제목 아래와 브라우저 미리 보기에 쓰는 한 줄 소개.
  description: string
  // 처음 올린 날. 예: 2026-10-21. 적지 않으면 머리말에 날짜가 보이지 않는다.
  published?: string
  // 내용을 크게 고친 날. 고친 적이 없으면 적지 않는다. published 와 함께 적는다.
  updated?: string
  // 머리말에 보이는 태그. # 은 붙이지 않는다.
  tags: readonly string[]
}

export type DocEntry = DocMeta & { slug: string }

// 문서 목차의 한 줄. 빌드할 때 rehype-toc.mjs 가 h2, h3 에서 만든다.
export type DocHeading = {
  id: string
  text: string
  depth: 2 | 3
}

// slug 에 쓸 수 있는 모양. 영어 소문자와 숫자를 하이픈으로 잇는다.
export const DOC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// 예: 2026년 10월 21일. frontmatter 의 날짜는 시각이 없어 시간대를 따지지 않는다.
export function formatDocDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return `${year}년 ${month}월 ${day}일`
}

// 주소의 slug 가 목록에 있는지 본다. 파일은 이 검사를 거친 slug 로만 불러온다.
export function isListedDoc(
  slug: string,
  slugs: readonly string[] = DOC_SLUGS
): boolean {
  return slugs.includes(slug)
}

// Docs 로 들어가는 주소. 메뉴와 카드는 Docs 의 첫 화면 대신 목록의 첫 문서를 가리킨다.
// 첫 화면은 첫 문서로 다시 보내는데, 그 사이에 문서 목록만 그려지고 본문 자리가 비어 보이기 때문이다.
// 문서가 하나도 없으면 빈 안내를 그리는 첫 화면이다.
export function docsHref(
  clubId: string,
  slugs: readonly string[] = DOC_SLUGS
): string {
  const [first] = slugs
  return first ? `/clubs/${clubId}/docs/${first}` : `/clubs/${clubId}/docs`
}

// 목록에서 앞뒤 문서. 처음과 끝, 목록에 없는 slug 에서는 null 이다.
export function docNeighbors(
  slug: string,
  docs: readonly DocEntry[]
): { prev: DocEntry | null; next: DocEntry | null } {
  const index = docs.findIndex((doc) => doc.slug === slug)
  if (index === -1) {
    return { prev: null, next: null }
  }
  return { prev: docs[index - 1] ?? null, next: docs[index + 1] ?? null }
}
