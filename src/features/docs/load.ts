import "server-only"

import type { MDXContent } from "mdx/types"

import { DOC_SLUGS } from "@/content/docs/list"

import {
  isListedDoc,
  type DocEntry,
  type DocHeading,
  type DocMeta,
} from "./catalog"
import { readingMinutes, type MarkdownPart } from "./markdown"

// 빌드한 .mdx 모듈이 내보내는 것. frontmatter 는 remark-front-matter.mjs, markdown 은 remark-markdown.mjs,
// toc 는 rehype-toc.mjs 가 빌드할 때 만든다. 요청마다 다시 만들지 않는다.
type DocModule = {
  default: MDXContent
  frontmatter: DocMeta
  toc: DocHeading[]
  markdown: MarkdownPart[]
}

export type LoadedDoc = {
  entry: DocEntry
  Content: MDXContent
  toc: DocHeading[]
  markdown: MarkdownPart[]
  // 읽는 데 걸리는 시간의 어림. 분이다.
  minutes: number
}

// 목록에 있는지 확인한 slug 로만 부른다.
function importDoc(slug: string): Promise<DocModule> {
  return import(`@/content/docs/${slug}.mdx`)
}

// 목록의 순서대로 문서마다 frontmatter 의 제목, 소개, 날짜, 태그를 모은다.
export async function listDocs(): Promise<DocEntry[]> {
  return Promise.all(
    DOC_SLUGS.map(async (slug) => ({
      slug,
      ...(await importDoc(slug)).frontmatter,
    }))
  )
}

// 주소의 slug 로 문서 하나의 frontmatter 를 찾는다. 목록에 없는 slug 는 파일을 찾지 않고 null 을 돌려준다.
export async function findDoc(slug: string): Promise<DocEntry | null> {
  if (!isListedDoc(slug)) {
    return null
  }
  return { slug, ...(await importDoc(slug)).frontmatter }
}

// 목록에 있는 문서의 본문과 목차, 복사할 Markdown 을 불러온다. 목록에 없는 slug 는 null 이다.
export async function loadDoc(slug: string): Promise<LoadedDoc | null> {
  if (!isListedDoc(slug)) {
    return null
  }
  const mod = await importDoc(slug)
  return {
    entry: { slug, ...mod.frontmatter },
    Content: mod.default,
    toc: mod.toc,
    markdown: mod.markdown,
    minutes: readingMinutes(mod.markdown),
  }
}
