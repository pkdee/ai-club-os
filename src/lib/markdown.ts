import type { Options } from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

// 사람이 적은 Markdown 을 화면에 그리는 규칙. AI Log 본문이 쓴다.
// HTML 은 그리지 않고 적은 글자 그대로 보인다. 링크와 이미지 주소는 http, https, mailto 처럼 안전한 것만 남는다.
// 둘 다 react-markdown 의 기본 동작이라 따로 적지 않는다.

type HastNode = {
  type: string
  tagName?: string
  properties?: { className?: unknown }
  children?: HastNode[]
}

// 언어를 적지 않은 코드 블록에 language-text 를 붙인다.
// 코드 블록 안의 code 와 글 사이의 code 를 class 로 가르고, Shiki 가 색 없는 글로 다루게 하려는 것이다.
export function rehypeCodeLanguage() {
  return (tree: HastNode) => {
    visit(tree)
  }
}

function visit(node: HastNode) {
  if (node.type === "element" && node.tagName === "pre") {
    const code = node.children?.find((child) => child.type === "element")
    if (code?.tagName === "code") {
      const classes = Array.isArray(code.properties?.className)
        ? code.properties.className
        : []
      if (
        !classes.some(
          (name) => typeof name === "string" && name.startsWith("language-")
        )
      ) {
        code.properties = {
          ...code.properties,
          className: [...classes, "language-text"],
        }
      }
    }
    return
  }
  node.children?.forEach(visit)
}

// remark-gfm 은 기본으로 물결표 하나(~글~)도 취소선으로 읽는다.
// 한국어 글에는 "1~2시간" 처럼 물결표를 흔히 쓰므로 두 개(~~글~~)만 취소선으로 읽는다.
const GFM_OPTIONS = { singleTilde: false }

// 본문을 그릴 때. 한 줄을 바꾼 것도 줄바꿈으로 본다. Markdown 을 쓰기 전에 적은 기록도 적은 모양 그대로 보이게 하려는 것이다.
// idPrefix 는 각주의 id 앞에 붙는다. 한 화면에 본문이 여럿이면 서로 다르게 준다.
export function markdownOptions(idPrefix: string) {
  return {
    remarkPlugins: [[remarkGfm, GFM_OPTIONS], remarkBreaks],
    rehypePlugins: [rehypeCodeLanguage],
    remarkRehypeOptions: {
      clobberPrefix: idPrefix,
      footnoteLabel: "각주",
      footnoteBackLabel: (referenceIndex: number) =>
        `${referenceIndex + 1}번 각주를 단 곳으로 돌아가기`,
    },
  } satisfies Options
}

// 목록 카드처럼 몇 줄만 보이는 곳의 글. 서식을 모두 벗기고 글자만 남긴다.
// 줄바꿈을 br 로 바꾸지 않아야 벗긴 뒤에 줄 사이가 빈칸으로 남는다.
export const PLAIN_TEXT_OPTIONS = {
  remarkPlugins: [[remarkGfm, GFM_OPTIONS]],
  allowedElements: [],
  unwrapDisallowed: true,
} satisfies Options

// 바깥 이미지는 http, https 주소만 불러온다. 앱 안의 주소를 이미지로 불러 요청을 보내게 하지 않으려는 것이다.
export function isWebImage(src: unknown): src is string {
  return typeof src === "string" && /^https?:\/\//i.test(src)
}

// 이 글에 언어를 적은 코드 블록이 있는지. 없으면 색을 입히는 Shiki 를 부르지 않는다.
export function hasLanguageFence(markdown: string) {
  return /^ {0,3}(`{3,}|~{3,})[ \t]*[^\s`~]/m.test(markdown)
}
