import Markdown, { type Components, type ExtraProps } from "react-markdown"

import { CodeBlock } from "@/components/code-block"
import { isWebImage, markdownOptions, PLAIN_TEXT_OPTIONS } from "@/lib/markdown"
import { cn } from "@/lib/utils"

// 사람이 Markdown 으로 적은 글의 글 요소. AI Log 본문이 쓴다.
// 앞 요소와의 간격은 각 요소의 위쪽 여백으로 둔다. Docs 와 같은 방식이고 간격은 더 좁다.
// 글자 크기는 감싸는 쪽이 정한다.

export type MarkdownBodyProps = {
  children: string
  // 본문의 # 제목이 될 태그의 단계. 본문을 감싼 화면의 제목보다 한 단계 아래로 준다.
  headingLevel: number
  // 각주의 id 앞에 붙는다. 한 화면에 본문이 여럿이면 서로 다르게 준다.
  idPrefix: string
  className?: string
}

export const MARKDOWN_BODY_CLASS = "min-w-0 break-words"

const BLOCK = "mt-3 first:mt-0"

const LINK_CLASS =
  "rounded-sm text-brand underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"

// react-markdown 은 요소마다 원래의 노드를 node 로 함께 넘긴다. DOM 에 내려보내지 않게 뺀다.
function withoutNode<P extends ExtraProps>(props: P): Omit<P, "node"> {
  const rest = { ...props }
  delete rest.node
  return rest
}

// 바깥 주소는 새 탭으로 연다. 안전하지 않아 주소가 지워진 링크는 글만 남긴다.
function MarkdownLink(all: React.ComponentProps<"a"> & ExtraProps) {
  const { href, className, children, ...props } = withoutNode(all)
  if (!href) {
    return <span className={className}>{children}</span>
  }
  const external = /^https?:/i.test(href)

  return (
    <a
      {...props}
      href={href}
      className={cn(LINK_CLASS, className)}
      {...(external && {
        target: "_blank",
        rel: "noopener noreferrer nofollow ugc",
      })}
    >
      {children}
      {external && <span className="sr-only"> (새 탭에서 열림)</span>}
    </a>
  )
}

// 바깥 이미지는 보는 사람의 브라우저가 그 서버에서 바로 불러온다. 어느 화면에서 불렀는지는 알리지 않는다.
// http, https 가 아닌 주소는 불러오지 않고 설명 글만 남긴다.
function MarkdownImage({
  src,
  alt,
  title,
}: React.ComponentProps<"img"> & ExtraProps) {
  if (!isWebImage(src)) {
    return alt ? <span className="text-muted-foreground">{alt}</span> : null
  }

  return (
    // 사람이 적은 바깥 주소라 next/image 의 변환을 거치지 않고 그대로 불러온다.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      title={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="inline-block h-auto max-h-[32rem] max-w-full rounded-lg border align-top"
    />
  )
}

// pre 안의 code 는 language-* 가 붙어 있어 모양을 바꾸지 않는다. 글 사이의 code 만 꾸민다.
function MarkdownCode(all: React.ComponentProps<"code"> & ExtraProps) {
  const { className, ...props } = withoutNode(all)
  if (className?.includes("language-")) {
    return <code className={className} {...props} />
  }
  return (
    <code
      className={cn(
        "rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.875em]",
        className
      )}
      {...props}
    />
  )
}

type HeadingTag = "h2" | "h3" | "h4" | "h5" | "h6"

// 본문의 # 은 headingLevel 단계의 태그가 되고, ## 부터는 한 단계씩 내려간다. h6 아래로는 내려가지 않는다.
// 큰 글씨는 본문을 감싼 화면의 제목과 겨루므로, 모든 제목을 본문과 같은 크기에 굵기로만 가른다.
function heading(level: number, depth: number) {
  const Tag = `h${Math.min(Math.max(level + depth - 1, 2), 6)}` as HeadingTag

  return function MarkdownHeading(
    all: React.ComponentProps<HeadingTag> & ExtraProps
  ) {
    const { className, ...props } = withoutNode(all)
    return (
      <Tag
        className={cn(
          "mt-5 first:mt-0",
          depth <= 2 ? "text-h4" : "text-label-l",
          className
        )}
        {...props}
      />
    )
  }
}

function createComponents(level: number): Components {
  return {
    h1: heading(level, 1),
    h2: heading(level, 2),
    h3: heading(level, 3),
    h4: heading(level, 4),
    h5: heading(level, 5),
    h6: heading(level, 6),
    p: ({ className, ...all }) => (
      <p className={cn(BLOCK, className)} {...withoutNode(all)} />
    ),
    a: MarkdownLink,
    img: MarkdownImage,
    ul: ({ className, ...all }) => (
      <ul
        className={cn(
          BLOCK,
          "list-disc space-y-1 pl-6 marker:text-icon-subtle",
          className
        )}
        {...withoutNode(all)}
      />
    ),
    ol: ({ className, ...all }) => (
      <ol
        className={cn(
          BLOCK,
          "list-decimal space-y-1 pl-6 marker:text-muted-foreground",
          className
        )}
        {...withoutNode(all)}
      />
    ),
    // 할 일 항목(task-list-item)은 점 대신 체크 칸을 점 자리에 둔다. 다른 항목과 글이 같은 줄에서 시작한다.
    li: ({ className, ...all }) => (
      <li
        className={cn(
          "pl-1 [&>ol]:mt-1 [&>ul]:mt-1",
          className?.includes("task-list-item") && "-ml-6 list-none",
          className
        )}
        {...withoutNode(all)}
      />
    ),
    // 할 일 목록의 체크 칸. GFM 이 disabled 로 만들어 누를 수 없다.
    input: ({ className, ...all }) => (
      <input
        className={cn("mr-2 size-4 translate-y-0.5 accent-brand", className)}
        {...withoutNode(all)}
      />
    ),
    // 각주 목록. 본문과 선으로 나누고 조금 작게 둔다.
    section: ({ className, ...all }) => (
      <section
        className={cn(
          "data-footnotes:mt-5 data-footnotes:border-t data-footnotes:pt-3 data-footnotes:text-body-s",
          className
        )}
        {...withoutNode(all)}
      />
    ),
    blockquote: ({ className, ...all }) => (
      <blockquote
        className={cn(
          BLOCK,
          "border-l-4 pl-4 text-muted-foreground",
          className
        )}
        {...withoutNode(all)}
      />
    ),
    hr: ({ className, ...all }) => (
      <hr className={cn("my-5 border-t", className)} {...withoutNode(all)} />
    ),
    table: ({ className, ...all }) => (
      <div className={cn(BLOCK, "overflow-x-auto rounded-lg border")}>
        <table
          className={cn(
            "w-full border-collapse text-body-m [&_tbody_tr:last-child_td]:border-b-0",
            className
          )}
          {...withoutNode(all)}
        />
      </div>
    ),
    thead: ({ className, ...all }) => (
      <thead className={cn("bg-muted", className)} {...withoutNode(all)} />
    ),
    th: ({ className, ...all }) => (
      <th
        className={cn("border-b px-3 py-2 text-left text-label-m", className)}
        {...withoutNode(all)}
      />
    ),
    td: ({ className, ...all }) => (
      <td
        className={cn("border-b px-3 py-2 align-top", className)}
        {...withoutNode(all)}
      />
    ),
    code: MarkdownCode,
    pre: (all) => <CodeBlock {...withoutNode(all)} frameClassName={BLOCK} />,
  }
}

// 그릴 때마다 컴포넌트를 새로 만들면 React 가 다른 컴포넌트로 보고 본문을 다시 만든다. 단계마다 한 번만 만든다.
const componentsByLevel = new Map<number, Components>()

export function markdownComponents(level: number) {
  let components = componentsByLevel.get(level)
  if (!components) {
    components = createComponents(level)
    componentsByLevel.set(level, components)
  }
  return components
}

// 본문을 그린다. 코드 블록에 색을 입히지 않는다. 쓰는 중의 미리 보기가 쓴다.
// 저장된 본문은 서버에서 색까지 입히는 HighlightedMarkdown 으로 그린다.
export function MarkdownBody({
  children,
  headingLevel,
  idPrefix,
  className,
}: MarkdownBodyProps) {
  return (
    <div className={cn(MARKDOWN_BODY_CLASS, className)}>
      <Markdown
        {...markdownOptions(idPrefix)}
        components={markdownComponents(headingLevel)}
      >
        {children}
      </Markdown>
    </div>
  )
}

// 서식을 벗기고 글자만 남긴다. 목록 카드처럼 몇 줄만 보이는 곳에서 감싸는 p 안에 둔다.
export function MarkdownText({ children }: { children: string }) {
  return <Markdown {...PLAIN_TEXT_OPTIONS}>{children}</Markdown>
}
