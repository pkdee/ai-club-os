"use client"

import { useActionState, useState } from "react"
import { CircleAlert, Plus } from "lucide-react"

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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { createClub, type CreateClubState } from "../actions"
import { CLUB_DESCRIPTION_MAX, CLUB_NAME_MAX } from "../rules"

const initialState: CreateClubState = { status: "idle" }

// Dialog 가 닫히면 이 컴포넌트가 사라지므로, 다시 열 때 입력과 오류가 처음 상태로 돌아간다.
function CreateClubForm({ onCreated }: { onCreated: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (previous: CreateClubState, formData: FormData) => {
      const next = await createClub(previous, formData)
      if (next.status === "success") {
        onCreated()
      }
      return next
    },
    initialState
  )
  const errors = state.errors ?? {}

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.message && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>Club 을 만들지 못했습니다</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <Field>
        <FieldLabel htmlFor="club-name">Club 이름</FieldLabel>
        <Input
          id="club-name"
          name="name"
          required
          maxLength={CLUB_NAME_MAX}
          autoComplete="off"
          defaultValue={state.values?.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "club-name-error" : undefined}
        />
        {errors.name && (
          <FieldError id="club-name-error">{errors.name}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="club-description">소개</FieldLabel>
        <Textarea
          id="club-description"
          name="description"
          maxLength={CLUB_DESCRIPTION_MAX}
          defaultValue={state.values?.description}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby="club-description-help"
        />
        {errors.description ? (
          <FieldError id="club-description-help">
            {errors.description}
          </FieldError>
        ) : (
          <FieldDescription id="club-description-help">
            Member 가 Club 을 고를 때 보는 설명입니다.
          </FieldDescription>
        )}
      </Field>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          취소
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "만드는 중" : "만들기"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CreateClubDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus aria-hidden="true" strokeWidth={1.5} />
        Club 만들기
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Club 만들기</DialogTitle>
          <DialogDescription>
            활동 공간의 기본 정보를 정합니다.
          </DialogDescription>
        </DialogHeader>
        <CreateClubForm onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
