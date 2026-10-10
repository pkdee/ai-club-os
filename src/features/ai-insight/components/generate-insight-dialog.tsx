"use client"

import { useState, useTransition } from "react"
import { CircleAlert, RefreshCw, Sparkles } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import type { InsightActionResult } from "../actions"

// AI Insight 를 만들기 전에 무엇을 어디로 보내는지 알리고 한 번 더 묻는다.
// replaces 는 이미 있는 내용을 새로 만든 초안으로 바꾼다는 뜻이고, published 는 그 내용이 공개된 상태라는 뜻이다.
export function GenerateInsightDialog({
  targetLabel,
  logCount,
  providerLabel,
  replaces = false,
  published = false,
  onGenerate,
}: {
  // 예: 3회차 · RAG 기초 실습, 2026년 10월
  targetLabel: string
  logCount: number
  // 예: Anthropic 의 Claude
  providerLabel: string
  replaces?: boolean
  published?: boolean
  onGenerate: () => Promise<InsightActionResult>
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // 만드는 중에는 닫지 않는다.
        if (!pending) {
          setOpen(next)
          setError(null)
        }
      }}
    >
      {replaces ? (
        <DialogTrigger render={<Button variant="outline" />}>
          <RefreshCw aria-hidden="true" strokeWidth={1.5} />
          다시 만들기
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Sparkles aria-hidden="true" strokeWidth={1.5} />
          AI Insight 만들기
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {replaces ? "AI Insight 를 다시 만들까요?" : "AI Insight 를 만들까요?"}
          </DialogTitle>
          <DialogDescription render={<div />} className="flex flex-col gap-2">
            <p>
              {targetLabel}의 AI Log {logCount}개에서 제목, 사용한 도구, 적은
              내용을 {providerLabel} 로 보내 정리합니다. 작성자의 이름과
              이메일은 보내지 않습니다.
            </p>
            <p>
              만든 내용은 초안으로 저장됩니다. 확인해서 공개하기 전에는
              운영자에게만 보입니다.
            </p>
            {replaces && (
              <p>
                지금 있는 내용은 새로 만든 초안으로 바뀝니다.
                {published && " 공개된 상태도 초안으로 돌아갑니다."}
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert tone="danger">
            <CircleAlert aria-hidden="true" strokeWidth={1.5} />
            <AlertTitle>만들지 못했습니다</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter className="items-center">
          {pending && (
            <p
              role="status"
              className="mr-auto text-caption text-muted-foreground"
            >
              길면 1분쯤 걸립니다.
            </p>
          )}
          <DialogClose
            render={<Button type="button" variant="outline" disabled={pending} />}
          >
            취소
          </DialogClose>
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null)
              startTransition(async () => {
                const result = await onGenerate()
                if (result.ok) {
                  setOpen(false)
                } else {
                  setError(result.message)
                }
              })
            }}
          >
            {pending ? "만드는 중" : "만들기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
