"use client"

import { useId, useState, useTransition } from "react"
import { CircleAlert, Trash2 } from "lucide-react"

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
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

// 지우는 동작이 돌려주는 값. 성공하면서 다른 화면으로 이동하는 동작은 값을 돌려주지 않고 떠난다.
export type DeleteResult = { ok: true } | { ok: false; message: string }

type Confirm = {
  // 이 글자를 그대로 입력해야 지울 수 있다.
  value: string
  label: string
}

// Dialog 가 닫히면 이 컴포넌트가 사라지므로, 다시 열 때 입력과 오류가 처음 상태로 돌아간다.
function DeleteBody({
  confirm,
  pending,
  onDelete,
}: {
  confirm?: Confirm
  pending: boolean
  onDelete: (typed: string, onError: (message: string) => void) => void
}) {
  const inputId = useId()
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)
  const ready = !confirm || typed.trim() === confirm.value

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (ready && !pending) {
          setError(null)
          onDelete(typed.trim(), setError)
        }
      }}
    >
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>지우지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {confirm && (
        <Field>
          <FieldLabel htmlFor={inputId}>{confirm.label}</FieldLabel>
          <Input
            id={inputId}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            placeholder={confirm.value}
          />
        </Field>
      )}
      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" disabled={pending} />}
        >
          취소
        </DialogClose>
        <Button type="submit" variant="destructive" disabled={!ready || pending}>
          {pending ? "지우는 중" : "삭제"}
        </Button>
      </DialogFooter>
    </form>
  )
}

type DeleteDialogProps = {
  // 여는 버튼의 글자.
  label: string
  // 여는 버튼의 크기. 목록의 줄마다 놓을 때는 sm 을 쓴다.
  size?: "default" | "sm"
  title: string
  description: React.ReactNode
} & (
  | { confirm?: undefined; onDelete: () => Promise<DeleteResult> }
  | { confirm: Confirm; onDelete: (typed: string) => Promise<DeleteResult> }
)

// 되돌릴 수 없는 삭제 앞에서 한 번 더 묻는다. 여는 버튼과 확인 창을 함께 그린다.
// confirm 을 주면 그 글자를 입력해야 삭제 버튼이 눌린다. 입력한 글자는 onDelete 로 넘어가 서버에서 다시 확인한다.
export function DeleteDialog(props: DeleteDialogProps) {
  const { label, size = "default", title, description, confirm } = props
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
      <DialogTrigger render={<Button variant="outline" size={size} />}>
        <Trash2 aria-hidden="true" strokeWidth={1.5} />
        {label}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription render={<div />} className="flex flex-col gap-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DeleteBody
          confirm={confirm}
          pending={pending}
          onDelete={(typed, onError) =>
            startTransition(async () => {
              const result = await (props.confirm
                ? props.onDelete(typed)
                : props.onDelete())
              if (result.ok) {
                // 지운 뒤 다른 화면으로 가지 않는 곳에서는 창만 닫는다.
                setOpen(false)
              } else {
                onError(result.message)
              }
            })
          }
        />
      </DialogContent>
    </Dialog>
  )
}
