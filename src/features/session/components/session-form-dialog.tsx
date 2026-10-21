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
  SESSION_AGENDA_MAX,
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
  // 처음 값에 시간표가 있을 때만 시간표 칸을 그린다. 없으면 데이터베이스에 그 열이 아직 없는 것이다.
  const showAgenda = defaults.agenda !== undefined
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
          // 입력 오류로 처음 값이 바뀌면 칸을 새로 그린다. 아래의 다른 Input 도 같다.
          // Base UI 의 Input 은 처음 그린 뒤에 바뀐 처음 값을 받지 않는다.
          key={values.title}
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
            key={values.date}
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
            key={values.startTime}
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
            key={values.endTime}
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
          key={values.location}
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
      {showAgenda && (
        <Field>
          <FieldLabel htmlFor="session-agenda">시간표</FieldLabel>
          {/* 이 칸이 화면에 있었다는 표시. 서버는 이 표시가 있을 때만 시간표를 저장한다. */}
          <input type="hidden" name="agendaField" value="1" />
          <Textarea
            id="session-agenda"
            name="agenda"
            maxLength={SESSION_AGENDA_MAX}
            placeholder={"19:00 지난 회차 돌아보기\n19:20 실습\n20:40 AI Log 작성"}
            defaultValue={values.agenda}
            aria-invalid={invalid("agenda")}
            aria-describedby="session-agenda-help"
          />
          {errors.agenda ? (
            <FieldError id="session-agenda-help">{errors.agenda}</FieldError>
          ) : (
            <FieldDescription id="session-agenda-help">
              한 줄에 하나씩 적습니다. 줄 앞에 시각을 적으면 따로 보여 줍니다.
              비워 둬도 됩니다.
            </FieldDescription>
          )}
        </Field>
      )}
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
// 만들기 버튼은 기본이 강조 버튼이다. 옆에 더 중요한 버튼이 있는 곳에서는 quiet 로 한 단계 낮춘다.
export function SessionFormDialog({
  target,
  defaults,
  quiet = false,
}: {
  target: SessionTarget
  defaults: Partial<SessionInput>
  quiet?: boolean
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
        <DialogTrigger
          render={<Button variant={quiet ? "outline" : "default"} />}
        >
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
