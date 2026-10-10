"use client"

import { useState, useTransition } from "react"
import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { unblockMember } from "../actions"
import type { ClubBan } from "../bans"
import { formatJoinDate } from "../format"

// 내보내면서 다시 들어오지 못하게 막아 둔 사람의 목록. 운영자에게만 보이고, 운영자가 풀어 준다.
export function BlockedList({
  clubId,
  bans,
}: {
  clubId: string
  bans: ClubBan[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">참여를 막은 사람</h2>
        <p className="text-body-s text-muted-foreground">
          내보내면서 다시 들어오지 못하게 한 사람입니다. 풀어 주면 초대 링크로
          다시 참여할 수 있습니다.
        </p>
      </div>
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>풀어 주지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <ul className="flex flex-col divide-y">
        {bans.map((ban) => (
          <li
            key={ban.userId}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-label-m">{ban.name}</span>
              <span className="text-caption text-muted-foreground">
                {formatJoinDate(ban.bannedAt)} 에 막음
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pendingId !== null}
              onClick={() => {
                setError(null)
                setPendingId(ban.userId)
                startTransition(async () => {
                  const result = await unblockMember(clubId, ban.userId)
                  if (!result.ok) {
                    setError(result.message)
                  }
                  setPendingId(null)
                })
              }}
            >
              {pendingId === ban.userId ? "푸는 중" : "풀어 주기"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
