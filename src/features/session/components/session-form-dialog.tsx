"use client"

import { useActionState, useState } from "react"
import { CircleAlert, Pencil, Plus } from "lucide-react"

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

import {
  saveSession,
  type SessionFormState,
  type SessionTarget,
} from "../actions"
import {
  SESSION_DESCRIPTION_MAX,
  SESSION_LOCATION_MAX,
  SESSION_TITLE_MAX,
  type SessionInput,
} from "../rules"

const initialState: SessionFormState = { status: "idle" }

// Dialog 가 닫히면 이 컴포넌트가 사라지므로, 다시 열 때 입력과 오류가 처음 상태로 돌아간다.
function SessionForm({
  target,
  defaults,
  onSaved,
}: {
  target: SessionTarget
  defaults: Partial<SessionInput>
  onSaved: () => void
}) {
  const editing = Boolean(target.sessionId)
  const [state, formAction, pending] = useActionState(
    async (previous: SessionFormState, formData: FormData) => {
      const next = await saveSession(target, previous, formData)
      if (next.status === "success") {
        onSaved()
      }
      return next
    },
    initialState
  )
  const errors = state.errors ?? {}
  const values = state.values ?? defaults
  const invalid = (name: keyof SessionInput) => (errors[name] ? true : undefined)
  const errorId = (name: keyof SessionInput) =>
    errors[name] ? `session-${name}-error` : undefined

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.message && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>
            {editing ? "Session 을 고치지 못했습니다" : "Session 을 만들지 못했습니다"}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <Field>
        <FieldLabel htmlFor="session-title">제목</FieldLabel>
        <Input
          id="session-title"
          name="title"
          required
          maxLength={SESSION_TITLE_MAX}
          autoComplete="off"
          placeholder="예: 3회차 · RAG 기초 실습"
          defaultValue={values.title}
          aria-invalid={invalid("title")}
          aria-describedby={errorId("title")}
        />
        {errors.title && (
          <FieldError id="session-title-error">{errors.title}</FieldError>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field className="col-span-2 sm:col-span-1">
          <FieldLabel htmlFor="session-date">날짜</FieldLabel>
          <Input
            id="session-date"
            name="date"
            type="date"
            required
            defaultValue={values.date}
            aria-invalid={invalid("date")}
            aria-describedby={errorId("date")}
          />
          {errors.date && (
            <FieldError id="session-date-error">{errors.date}</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="session-start">시작</FieldLabel>
          <Input
            id="session-start"
            name="startTime"
            type="time"
            required
            defaultValue={values.startTime}
            aria-invalid={invalid("startTime")}
            aria-describedby={errorId("startTime")}
          />
          {errors.startTime && (
            <FieldError id="session-startTime-error">
              {errors.startTime}
            </FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="session-end">종료</FieldLabel>
          <Input
            id="session-end"
            name="endTime"
            type="time"
            required
            defaultValue={values.endTime}
            aria-invalid={invalid("endTime")}
            aria-describedby={errorId("endTime")}
          />
          {errors.endTime && (
            <FieldError id="session-endTime-error">{errors.endTime}</FieldError>
          )}
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="session-location">장소</FieldLabel>
        <Input
          id="session-location"
          name="location"
          maxLength={SESSION_LOCATION_MAX}
          autoComplete="off"
          defaultValue={values.location}
          aria-invalid={invalid("location")}
          aria-describedby={errorId("location")}
        />
        {errors.location && (
          <FieldError id="session-location-error">{errors.location}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="session-description">목표와 소개</FieldLabel>
        <Textarea
          id="session-description"
          name="description"
          maxLength={SESSION_DESCRIPTION_MAX}
          placeholder="이 회차에서 무엇을 해 보는지 적습니다."
          defaultValue={values.description}
          aria-invalid={invalid("description")}
          aria-describedby="session-description-help"
        />
        {errors.description ? (
          <FieldError id="session-description-help">
            {errors.description}
          </FieldError>
        ) : (
          <FieldDescription id="session-description-help">
            Session 상세에 그대로 보입니다. 시각은 한국 시간 기준입니다.
          </FieldDescription>
        )}
      </Field>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          취소
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "저장하는 중" : editing ? "저장" : "만들기"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// sessionId 가 있으면 수정 창, 없으면 만들기 창이다.
export function SessionFormDialog({
  target,
  defaults,
}: {
  target: SessionTarget
  defaults: Partial<SessionInput>
}) {
  const [open, setOpen] = useState(false)
  const editing = Boolean(target.sessionId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {editing ? (
        <DialogTrigger render={<Button variant="outline" />}>
          <Pencil aria-hidden="true" strokeWidth={1.5} />
          수정
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus aria-hidden="true" strokeWidth={1.5} />
          Session 만들기
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Session 수정" : "Session 만들기"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "회차의 기본 정보를 고칩니다."
              : "회차의 기본 정보를 정합니다. 만든 뒤에도 고칠 수 있습니다."}
          </DialogDescription>
        </DialogHeader>
        <SessionForm
          target={target}
          defaults={defaults}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
