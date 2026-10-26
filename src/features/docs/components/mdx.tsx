import Link from "next/link"
import type { MDXComponents } from "mdx/types"
import {
  CircleAlert,
  Info,
  Lightbulb,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { CodeBlock } from "@/components/code-block"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

import { Diagram } from "./diagram"

// Docs 본문의 글 요소. 앞 요소와의 간격은 각 요소의 위쪽 여백으로 둔다.
// 본문을 담는 article 은 flex 가 아니어서 위아래 여백이 겹치고, 큰 쪽만 남는다.

const LINK_CLASS =
  "rounded-sm text-brand underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"

// 같은 문서 안은 그대로, 앱 안의 주소는 Link 로, 바깥 주소는 새 탭으로 연다.
function DocLink({
  href = "",
  children,
}: Pick<React.ComponentProps<"a">, "href" | "children">) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={LINK_CLASS}>
        {children}
      </a>
    )
  }
  if (/^\.{0,2}\//.test(href)) {
    return (
      <Link href={href} className={LINK_CLASS}>
        {children}
      </Link>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
    >
      {children}
      <span className="sr-only"> (새 탭에서 열림)</span>
    </a>
  )
}

// pre 안의 code 는 Shiki 가 language-* 를 붙여 두었으므로 모양을 바꾸지 않는다.
// 글 사이의 code 는 둘러싼 글자 크기를 따라가도록 em 으로 줄인다. 제목 안에서도 어울리게 하려는 것이다.
function InlineCode({ className, ...props }: React.ComponentProps<"code">) {
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

const CALLOUT_ICON: Record<CalloutTone, LucideIcon> = {
  info: Info,
  success: Lightbulb,
  warning: TriangleAlert,
  danger: CircleAlert,
}

type CalloutTone = "info" | "success" | "warning" | "danger"

// 본문 중간에 눈에 띄게 두는 안내. MDX 에서 import 없이 <Callout tone="warning" title="...">...</Callout> 로 쓴다.
// tone 은 Alert 와 같다. info 는 알아 둘 것, success 는 잘 되는 방법, warning 은 조심할 것, danger 는 되돌릴 수 없는 일이다.
// 화면을 열 때마다 읽어 주지 않도록 알림 대신 note 역할을 둔다.
export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: CalloutTone
  title?: string
  children: React.ReactNode
}) {
  const Icon = CALLOUT_ICON[tone]

  return (
    <Alert tone={tone} role="note" className="mt-5 first:mt-0">
      <Icon aria-hidden="true" strokeWidth={1.5} />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className="text-body-m [&_p]:mt-2 [&_p]:text-body-m [&_p:first-child]:mt-0">
        {children}
      </AlertDescription>
    </Alert>
  )
}

export const docsComponents: MDXComponents = {
  h1: ({ className, ...props }) => (
    <h1 className={cn("mt-12 text-h1 first:mt-0", className)} {...props} />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("mt-12 scroll-mt-6 text-h2 first:mt-0", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("mt-8 scroll-mt-6 text-h3 first:mt-0", className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={cn("mt-6 text-h4 first:mt-0", className)} {...props} />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("mt-4 text-body-l first:mt-0", className)} {...props} />
  ),
  a: DocLink,
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "mt-4 list-disc space-y-2 pl-6 text-body-l marker:text-icon-subtle first:mt-0",
        className
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "mt-4 list-decimal space-y-2 pl-6 text-body-l marker:text-muted-foreground first:mt-0",
        className
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li
      className={cn("pl-1 [&>ol]:mt-2 [&>ul]:mt-2", className)}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "mt-4 border-l-4 pl-4 text-muted-foreground first:mt-0",
        className
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-10 border-t", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="mt-5 overflow-x-auto rounded-lg border first:mt-0">
      <table
        className={cn(
          "w-full border-collapse text-body-m [&_tbody_tr:last-child_td]:border-b-0",
          className
        )}
        {...props}
      />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn("bg-muted", className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn("border-b px-3 py-2 text-left text-label-m", className)}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn("border-b px-3 py-2 align-top", className)}
      {...props}
    />
  ),
  code: InlineCode,
  pre: CodeBlock,
  Callout,
  // ```mermaid 코드 블록을 빌드할 때 remark-diagram.mjs 가 이 컴포넌트로 바꾼다. 문서에 직접 쓰지 않는다.
  Diagram,
}
