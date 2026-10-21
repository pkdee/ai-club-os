"use client"

import { useId, useState, useTransition } from "react"
import { Link2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"

// 잇거나 끊는 동작이 돌려주는 값. 실패하면 화면에 보일 안내를 함께 준다.
export type LinkActionResult = { ok: true } | { ok: false; message: string }

// 목록에서 하나를 골라 잇는 칸. Session 과 Project 를 잇거나, Session 에 Docs 의 문서를 가져올 때 쓴다.
// 고를 것이 없으면 아무것도 그리지 않는다.
// label 은 무엇을 고르는지 알리는 이름이다. 예: 이을 Project
// actionLabel 은 버튼의 글이다. 정하지 않으면 "잇기" 다.
export function LinkPicker({
  label,
  actionLabel = "잇기",
  options,
  onLink,
}: {
  label: string
  actionLabel?: string
  options: { id: string; name: string }[]
  onLink: (id: string) => Promise<LinkActionResult>
}) {
  const selectId = useId()
  const [picked, setPicked] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (options.length === 0) {
    return null
  }

  return (
    <form
      className="flex flex-col gap-2 border-t pt-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!picked) {
          return
        }
        setError(null)
        startTransition(async () => {
          const result = await onLink(picked)
          if (result.ok) {
            setPicked("")
          } else {
            setError(result.message)
          }
        })
      }}
    >
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>
      <div className="flex gap-2">
        <NativeSelect
          id={selectId}
          value={picked}
          disabled={pending}
          onChange={(event) => setPicked(event.target.value)}
          className="min-w-0 flex-1"
        >
          <option value="">{label}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </NativeSelect>
        <Button
          type="submit"
          variant="outline"
          disabled={pending || !picked}
          className="shrink-0"
        >
          <Link2 aria-hidden="true" strokeWidth={1.5} />
          {actionLabel}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </form>
  )
}

// 이어 둔 것을 끊는 버튼. 줄 끝에 놓는다.
export function UnlinkButton({
  label,
  onUnlink,
}: {
  label: string
  onUnlink: () => Promise<LinkActionResult>
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={label}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await onUnlink()
            if (!result.ok) {
              setError(result.message)
            }
          })
        }}
      >
        <X aria-hidden="true" strokeWidth={1.5} />
      </Button>
      {error && (
        <span role="alert" className="sr-only">
          {error}
        </span>
      )}
    </>
  )
}
