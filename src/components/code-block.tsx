import { isValidElement } from "react"

import { codeLanguageLabel } from "@/lib/code-language"
import { cn } from "@/lib/utils"

import { CopyCodeButton } from "./copy-code-button"

// Docs 와 AI Log 본문의 코드 블록. macOS 창처럼 위쪽 막대에 창 단추 세 개와 언어 이름, 복사 버튼을 둔다.
// 창 단추는 꾸밈이라 누를 수 없고 읽어 주지 않는다.
// pre 와 그 안의 code 는 Shiki 가 만든 것이다. Docs 는 빌드할 때, AI Log 는 서버가 화면을 그릴 때 만든다.
// 글자 색은 Shiki 가 적은 변수에서 globals.css 가 고른다. 쓰는 중의 미리 보기처럼 Shiki 를 거치지 않으면 색 없이 보인다.
// frameClassName 은 바깥 틀의 위쪽 여백을 바꿀 때 쓴다.
export function CodeBlock({
  children,
  className,
  frameClassName,
  ...props
}: React.ComponentProps<"pre"> & { frameClassName?: string }) {
  const label = codeLanguageLabel(
    isValidElement<{ className?: string }>(children)
      ? children.props.className
      : undefined
  )

  return (
    <figure
      className={cn(
        "mt-5 overflow-hidden rounded-xl border bg-card shadow-xs first:mt-0",
        frameClassName
      )}
    >
      <div className="grid h-10 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b bg-muted pr-1 pl-4">
        <div aria-hidden="true" className="flex gap-2">
          <span className="size-3 rounded-full bg-icon-danger" />
          <span className="size-3 rounded-full bg-icon-warning" />
          <span className="size-3 rounded-full bg-icon-success" />
        </div>
        {label ? (
          <figcaption className="truncate text-label-s text-muted-foreground">
            {label}
          </figcaption>
        ) : (
          <span />
        )}
        <div className="flex justify-end">
          <CopyCodeButton className="text-muted-foreground hover:bg-secondary-hover hover:text-foreground" />
        </div>
      </div>
      <pre
        {...props}
        className={cn(
          className,
          "overflow-x-auto p-4 font-mono text-body-s focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        )}
      >
        {children}
      </pre>
    </figure>
  )
}
