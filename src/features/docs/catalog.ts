import { DOCS, type DocEntry } from "@/content/docs/list"

export type { DocEntry }

// 문서 목차의 한 줄. 빌드할 때 rehype-toc.mjs 가 h2, h3 에서 만든다.
export type DocHeading = {
  id: string
  text: string
  depth: 2 | 3
}

// slug 에 쓸 수 있는 모양. 영어 소문자와 숫자를 하이픈으로 잇는다.
export const DOC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// 주소의 slug 로 문서를 찾는다. 목록에 없으면 null 이다.
// 파일은 이 검사를 거친 slug 로만 불러온다.
export function findDoc(
  slug: string,
  docs: readonly DocEntry[] = DOCS
): DocEntry | null {
  return docs.find((doc) => doc.slug === slug) ?? null
}

// 목록에서 앞뒤 문서. 처음과 끝, 목록에 없는 slug 에서는 null 이다.
export function docNeighbors(
  slug: string,
  docs: readonly DocEntry[] = DOCS
): { prev: DocEntry | null; next: DocEntry | null } {
  const index = docs.findIndex((doc) => doc.slug === slug)
  if (index === -1) {
    return { prev: null, next: null }
  }
  return { prev: docs[index - 1] ?? null, next: docs[index + 1] ?? null }
}
