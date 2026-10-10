"use client"

import { useState, useTransition } from "react"

import { NativeSelect } from "@/components/ui/native-select"

import { setProjectStatus } from "../actions"
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  isProjectStatus,
  type ProjectStatus,
} from "../rules"

// 참여자와 운영자가 Project 의 진행 상태를 바꾸는 칸. 고르는 즉시 저장한다.
export function ProjectStatusSelect({
  clubId,
  projectId,
  status,
}: {
  clubId: string
  projectId: string
  status: ProjectStatus
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <h2 className="text-h4">진행 상태</h2>
      <NativeSelect
        // 저장한 값이 돌아오면 칸을 그 값으로 다시 맞춘다. 저장하지 못했을 때 고른 값이 남지 않게 하려는 것이다.
        key={`${status}-${error ?? ""}`}
        defaultValue={status}
        disabled={pending}
        aria-label="진행 상태"
        onChange={(event) => {
          const next = event.target.value
          if (!isProjectStatus(next)) {
            return
          }
          setError(null)
          startTransition(async () => {
            const result = await setProjectStatus(clubId, projectId, next)
            if (!result.ok) {
              setError(result.message)
            }
          })
        }}
      >
        {PROJECT_STATUSES.map((value) => (
          <option key={value} value={value}>
            {PROJECT_STATUS_LABEL[value]}
          </option>
        ))}
      </NativeSelect>
      <p role="status" className="text-caption text-danger empty:hidden">
        {error ?? ""}
      </p>
    </section>
  )
}
