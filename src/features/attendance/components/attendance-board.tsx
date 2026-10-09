"use client"

import { useOptimistic, useState, useTransition } from "react"
import { Check, CircleAlert, LoaderCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

import {
  markUnrecordedPresent,
  setAttendance,
  type AttendanceSaveResult,
  type AttendanceTarget,
} from "../actions"
import type { AttendanceRecords } from "../queries"
import { countAttendance, type AttendanceStatus } from "../status"
import { AttendanceSelector } from "./attendance-selector"
import { AttendanceStatusBadge } from "./attendance-status-badge"
import { AttendanceSummary } from "./attendance-summary"

export type AttendanceMember = {
  id: string
  name: string
  roleLabel: string
}

type Change = { memberIds: string[]; status: AttendanceStatus | null }

// 운영자는 상태를 고르고, 구성원은 기록을 보기만 한다.
// 고르면 화면을 먼저 바꾸고 저장한다. 저장에 실패하면 저장된 값으로 되돌아가고 이유를 알린다.
export function AttendanceBoard({
  target,
  members,
  records,
  canManage,
}: {
  target: AttendanceTarget
  members: AttendanceMember[]
  records: AttendanceRecords
  canManage: boolean
}) {
  const [shown, applyChange] = useOptimistic(
    records,
    (current: AttendanceRecords, change: Change) => {
      const next = { ...current }
      for (const memberId of change.memberIds) {
        next[memberId] = change.status ?? undefined
      }
      return next
    }
  )
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const memberIds = members.map((member) => member.id)
  const counts = countAttendance(memberIds, shown)
  const unrecorded = memberIds.filter((memberId) => !shown[memberId])

  function save(change: Change, request: () => Promise<AttendanceSaveResult>) {
    startTransition(async () => {
      applyChange(change)
      const result = await request()
      setError(result.ok ? null : result.message)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>Attendance 를 저장하지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-4 rounded-xl border bg-card px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <AttendanceSummary counts={counts} />
        {canManage && (
          <div className="flex flex-wrap items-center gap-4">
            <p
              aria-live="polite"
              className="flex items-center gap-1.5 text-caption text-muted-foreground"
            >
              {pending ? (
                <LoaderCircle
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 animate-spin text-icon-subtle"
                />
              ) : (
                <Check
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 text-icon-success"
                />
              )}
              {pending ? "저장하는 중" : "고르는 즉시 저장됩니다"}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={unrecorded.length === 0}
              onClick={() =>
                save({ memberIds: unrecorded, status: "present" }, () =>
                  markUnrecordedPresent(target, unrecorded)
                )
              }
            >
              미기록을 모두 출석으로
            </Button>
          </div>
        )}
      </div>
      <ul className="overflow-hidden rounded-xl border bg-card">
        {members.map((member) => {
          const status = shown[member.id] ?? null

          return (
            <li
              key={member.id}
              className="flex flex-col gap-3 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={member.name} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-label-m">{member.name}</span>
                  <span className="text-caption text-muted-foreground">
                    {member.roleLabel}
                  </span>
                </div>
              </div>
              {canManage ? (
                <AttendanceSelector
                  label={`${member.name} 의 Attendance`}
                  value={status}
                  onChange={(next) =>
                    save({ memberIds: [member.id], status: next }, () =>
                      setAttendance(target, member.id, next)
                    )
                  }
                />
              ) : (
                <AttendanceStatusBadge mark={status ?? "unrecorded"} />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
