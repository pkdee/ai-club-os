import "server-only"

import type { MDXContent } from "mdx/types"

import { findDoc, type DocEntry, type DocHeading } from "./catalog"

export type LoadedDoc = {
  entry: DocEntry
  Content: MDXContent
  toc: DocHeading[]
}

// 목록에 있는 문서의 본문과 목차를 불러온다. 목록에 없는 slug 는 파일을 찾지 않고 null 을 돌려준다.
// 본문은 빌드할 때 화면으로 바뀌어 있으므로 요청마다 다시 만들지 않는다.
export async function loadDoc(slug: string): Promise<LoadedDoc | null> {
  const entry = findDoc(slug)
  if (!entry) {
    return null
  }

  const mod: { default: MDXContent; toc: DocHeading[] } = await import(
    `@/content/docs/${entry.slug}.mdx`
  )
  return { entry, Content: mod.default, toc: mod.toc }
}
