"use client"

import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

// 코드 블록의 코드를 복사하는 버튼. 같은 코드 블록(figure) 안의 pre 에서 글을 읽는다.
// 코드를 props 로 받지 않는 까닭은 Shiki 가 줄과 토큰을 span 으로 나눠 두어 서버에서 다시 모으기 번거롭기 때문이다.
export function CopyCodeButton({ className }: { className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")

  useEffect(() => {
    if (state === "idle") {
      return
    }
    const timer = setTimeout(() => setState("idle"), 2500)
    return () => clearTimeout(timer)
  }, [state])

  async function copy(event: React.MouseEvent<HTMLButtonElement>) {
    const code =
      event.currentTarget.closest("figure")?.querySelector("pre")
        ?.textContent ?? ""
    try {
      await navigator.clipboard.writeText(code)
      setState("copied")
    } catch {
      // 브라우저가 복사를 막는 경우가 있다. 안전하지 않은 주소이거나 권한을 거절했을 때다.
      setState("failed")
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={copy}
        className={className}
      >
        {state === "copied" ? (
          <Check
            aria-hidden="true"
            strokeWidth={1.5}
            className="text-icon-success"
          />
        ) : (
          <Copy aria-hidden="true" strokeWidth={1.5} />
        )}
        {state === "copied"
          ? "복사됨"
          : state === "failed"
            ? "복사 실패"
            : "복사"}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied"
          ? "코드를 복사했습니다."
          : state === "failed"
            ? "브라우저가 복사를 막았습니다. 코드를 직접 선택해 복사해 주세요."
            : ""}
      </span>
    </>
  )
}
