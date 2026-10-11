"use client"

import { useId, useState, useTransition } from "react"
import { CircleAlert, UserX } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckboxField } from "@/components/ui/checkbox"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { deleteMyAccount } from "../actions"
import { isAccountDeleteConfirmed } from "../plan"

// Dialog 가 닫히면 이 컴포넌트가 사라지므로, 다시 열 때 고른 것과 입력이 처음 상태로 돌아간다.
function DeleteAccountBody({
  email,
  confirmValue,
  contentText,
  pending,
  onDelete,
}: {
  email: string | null
  confirmValue: string
  contentText: string
  pending: boolean
  onDelete: (
    deleteContent: boolean,
    typed: string,
    onError: (message: string) => void
  ) => void
}) {
  const inputId = useId()
  const [deleteContent, setDeleteContent] = useState(false)
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)
  const ready = isAccountDeleteConfirmed(typed, email)

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (ready && !pending) {
          setError(null)
          onDelete(deleteContent, typed, setError)
        }
      }}
    >
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>계정을 지우지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <CheckboxField
        checked={deleteContent}
        disabled={pending}
        onChange={(event) => setDeleteContent(event.target.checked)}
        label="내가 쓴 AI Log, 회고, 댓글도 함께 지우기"
        description={`${contentText} 끄면 작성자 이름 없이 Club 에 남고, 켜면 모두 지워집니다. 내 AI Log 에 다른 사람이 단 댓글도 함께 지워집니다.`}
      />
      <Field>
        <FieldLabel htmlFor={inputId}>
          {email
            ? "확인을 위해 내 이메일을 입력해 주세요"
            : `확인을 위해 "${confirmValue}" 를 입력해 주세요`}
        </FieldLabel>
        <Input
          id={inputId}
          value={typed}
          disabled={pending}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          placeholder={confirmValue}
        />
      </Field>
      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" disabled={pending} />}
        >
          취소
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={!ready || pending}>
          {pending ? "지우는 중" : "계정 지우기"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// 계정을 지우기 전에 한 번 더 묻는 창. 쓴 것을 함께 지울지 고르고, 확인 글자를 입력해야 지워진다.
// contentText 는 내가 남긴 것이 얼마나 되는지 알리는 문장이다.
export function DeleteAccountDialog({
  email,
  confirmValue,
  contentText,
}: {
  email: string | null
  confirmValue: string
  contentText: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // 지우는 중에는 닫지 않는다.
        if (!pending) {
          setOpen(next)
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <UserX aria-hidden="true" strokeWidth={1.5} />
        계정 지우기
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>계정을 지울까요?</DialogTitle>
          <DialogDescription render={<div />} className="flex flex-col gap-2">
            <p>
              지우면 되돌릴 수 없습니다. 같은 Google 계정으로 다시 로그인하면 새
              계정으로 시작합니다.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DeleteAccountBody
          email={email}
          confirmValue={confirmValue}
          contentText={contentText}
          pending={pending}
          onDelete={(deleteContent, typed, onError) =>
            startTransition(async () => {
              // 성공하면 로그인 화면으로 떠나므로 값이 돌아오는 것은 실패했을 때뿐이다.
              const result = await deleteMyAccount(deleteContent, typed)
              if (result && !result.ok) {
                onError(result.message)
              }
            })
          }
        />
      </DialogContent>
    </Dialog>
  )
}
