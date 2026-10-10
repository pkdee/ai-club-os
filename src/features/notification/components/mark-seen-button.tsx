"use client"

import { useState, useTransition } from "react"
import { CheckCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

import { markNotificationsSeen } from "../actions"

// 지금까지의 알림을 확인한 것으로 적는 버튼. 누르면 메뉴의 알림 수에서 새 소식이 빠진다.
export function MarkSeenButton({ clubId }: { clubId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await markNotificationsSeen(clubId)
            if (!result.ok) {
              setError(result.message)
            }
          })
        }}
      >
        <CheckCheck aria-hidden="true" strokeWidth={1.5} />
        {pending ? "적는 중" : "모두 확인함"}
      </Button>
      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
