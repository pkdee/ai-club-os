"use client"

import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

// AI Insight 를 글로 복사하는 버튼. 메신저나 문서에 붙여 공유할 때 쓴다.
// text 는 서버에서 미리 만든 글이다.
export function CopyInsightButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")

  useEffect(() => {
    if (state === "idle") {
      return
    }
    const timer = setTimeout(() => setState("idle"), 2500)
    return () => clearTimeout(timer)
  }, [state])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState("copied")
    } catch {
      // 브라우저가 복사를 막는 경우가 있다. 안전하지 않은 주소이거나 권한을 거절했을 때다.
      setState("failed")
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {state === "copied" ? (
          <Check aria-hidden="true" strokeWidth={1.5} />
        ) : (
          <Copy aria-hidden="true" strokeWidth={1.5} />
        )}
        {state === "copied" ? "복사됨" : "글로 복사"}
      </Button>
      <span
        role="status"
        className="text-caption text-muted-foreground empty:hidden"
      >
        {state === "failed"
          ? "브라우저가 복사를 막았습니다. 내용을 직접 선택해 복사해 주세요."
          : ""}
      </span>
      <span role="status" className="sr-only">
        {state === "copied" ? "AI Insight 를 글로 복사했습니다." : ""}
      </span>
    </>
  )
}
