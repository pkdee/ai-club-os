import "server-only"

import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype"
import { MarkdownAsync } from "react-markdown"

import { hasLanguageFence, markdownOptions } from "@/lib/markdown"
import { cn } from "@/lib/utils"

import {
  MARKDOWN_BODY_CLASS,
  markdownComponents,
  type MarkdownBodyProps,
} from "./markdown"

// next.config.ts 에서 Docs 에 준 설정과 같다. 두 화면 모드의 색을 변수로만 적고 globals.css 가 지금 모드의 색을 고른다.
// 쓰인 언어만 불러오고, 모르는 언어는 색 없이 둔다.
const SHIKI_OPTIONS: RehypeShikiOptions = {
  themes: { light: "github-light-default", dark: "github-dark-default" },
  defaultColor: false,
  addLanguageClass: true,
  langs: [],
  lazy: true,
  defaultLanguage: "text",
  fallbackLanguage: "text",
  // 색을 입히지 못한 블록은 색 없이 둔다. 사람이 적은 글 때문에 화면 전체가 실패하지 않게 하려는 것이다.
  onError: () => {},
}

// 저장된 본문을 서버에서 그린다. 언어를 적은 코드 블록에는 Shiki 로 색을 입힌다.
// 그런 블록이 없으면 Shiki 를 부르지 않는다. 처음 부를 때 색 규칙을 읽느라 시간이 들기 때문이다.
export async function HighlightedMarkdown({
  children,
  headingLevel,
  idPrefix,
  className,
}: MarkdownBodyProps) {
  const options = markdownOptions(idPrefix)
  const content = await MarkdownAsync({
    ...options,
    rehypePlugins: hasLanguageFence(children)
      ? [...options.rehypePlugins, [rehypeShiki, SHIKI_OPTIONS]]
      : options.rehypePlugins,
    components: markdownComponents(headingLevel),
    children,
  })

  return <div className={cn(MARKDOWN_BODY_CLASS, className)}>{content}</div>
}
