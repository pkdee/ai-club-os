"use client"

import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { DocEntry } from "../catalog"
import { docMarkdown, type MarkdownPart } from "../markdown"

// 문서 한 편을 Markdown 으로 복사하는 버튼. AI 도구나 다른 문서에 붙여 쓸 때 쓴다.
// 본문은 빌드할 때 만든 조각으로 받고, 상대 경로 링크는 누를 때 지금 주소를 기준으로 전체 주소로 바꾼다.
export function CopyMarkdownButton({
  entry,
  parts,
}: {
  entry: DocEntry
  parts: MarkdownPart[]
}) {
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
      await navigator.clipboard.writeText(
        docMarkdown(entry, parts, window.location.href)
      )
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
            : "페이지 복사"}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied"
          ? "문서를 복사했습니다."
          : state === "failed"
            ? "브라우저가 복사를 막았습니다. 주소창의 권한을 확인한 뒤 다시 시도해 주세요."
            : ""}
      </span>
    </>
  )
}
