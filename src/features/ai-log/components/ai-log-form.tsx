"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Calendar, Check, ChevronDown, CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input, controlClassName } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  saveAiLog,
  type AiLogFormState,
  type AiLogTarget,
} from "../actions"
import {
  AI_LOG_TEXT_MAX,
  AI_LOG_TITLE_MAX,
  type AiLogInput,
} from "../rules"
import { ToolsInput } from "./tools-input"

export type SessionOption = {
  id: string
  title: string
  // 예: 10월 8일 목요일 19:00 ~ 21:00
  when: string
  description: string
}

const initialState: AiLogFormState = { status: "idle" }

const GUIDE = [
  "완성된 글이 아니어도 됩니다.",
  "잘 안 된 시도도 좋은 기록입니다.",
  "필수 항목은 제목과 시도한 내용입니다.",
  "저장한 뒤에도 고칠 수 있습니다.",
]

const TEXT_FIELDS = [
  {
    name: "attempt",
    label: "시도한 내용 (필수)",
    placeholder: "무엇을 어떻게 해 봤는지 적습니다.",
    required: true,
  },
  {
    name: "result",
    label: "결과",
    placeholder: "어떤 결과가 나왔는지 적습니다.",
    required: false,
  },
  {
    name: "learned",
    label: "배운 점",
    placeholder: "해 보고 알게 된 것을 적습니다.",
    required: false,
  },
  {
    name: "nextAction",
    label: "다음 행동",
    placeholder: "다음에 해 볼 일을 적습니다. 비워 둬도 됩니다.",
    required: false,
  },
] as const

// logId 가 있으면 고치는 화면, 없으면 새로 쓰는 화면이다.
// sessions 가 null 이면 Session 목록을 불러오지 못한 것이다.
export function AiLogForm({
  target,
  clubName,
  defaults,
  sessions,
  cancelHref,
}: {
  target: AiLogTarget
  clubName: string
  defaults: AiLogInput
  sessions: SessionOption[] | null
  cancelHref: string
}) {
  const editing = Boolean(target.logId)
  const [state, formAction, pending] = useActionState(
    (previous: AiLogFormState, formData: FormData) =>
      saveAiLog(target, previous, formData),
    initialState
  )
  // 고른 Session 에 따라 옆의 안내가 바뀌므로 이 값은 직접 들고 있는다.
  const [sessionId, setSessionId] = useState(defaults.sessionId)
  const errors = state.errors ?? {}
  const values = state.values ?? defaults
  const selected = sessions?.find((session) => session.id === sessionId) ?? null
  const clubHref = `/clubs/${target.clubId}`
  const invalid = (name: keyof AiLogInput) => (errors[name] ? true : undefined)

  const actions = (
    <>
      <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
        취소
      </Link>
      <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
        {pending ? "저장하는 중" : "저장"}
      </Button>
    </>
  )

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: clubName, href: clubHref },
            { label: "AI Log", href: `${clubHref}/logs` },
            { label: editing ? "기록 수정" : "새 기록" },
          ]}
        />
        <div className="flex items-start justify-between gap-6">
          <h1 className="text-h1">{editing ? "AI Log 수정" : "AI Log 쓰기"}</h1>
          <div className="hidden items-center gap-2 sm:flex">{actions}</div>
        </div>
      </div>
      {state.message ? (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>AI Log 를 저장하지 못했습니다</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : (
        state.errors && (
          <Alert tone="danger">
            <CircleAlert aria-hidden="true" strokeWidth={1.5} />
            <AlertTitle>아직 저장하지 않았습니다</AlertTitle>
            <AlertDescription>
              아래에 표시된 항목을 고친 뒤 다시 저장해 주세요. 입력한 내용은
              그대로 남아 있습니다.
            </AlertDescription>
          </Alert>
        )
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6">
            <Field>
              <FieldLabel htmlFor="log-session">Session</FieldLabel>
              <div className="relative">
                <select
                  id="log-session"
                  name="sessionId"
                  value={sessionId}
                  onChange={(event) => setSessionId(event.target.value)}
                  aria-invalid={invalid("sessionId")}
                  aria-describedby="log-session-help"
                  className={cn(controlClassName, "h-10 appearance-none pr-9")}
                >
                  <option value="">Session 없이 남기기</option>
                  {sessions?.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-icon-subtle"
                />
              </div>
              {errors.sessionId ? (
                <FieldError id="log-session-help">{errors.sessionId}</FieldError>
              ) : (
                <FieldDescription id="log-session-help">
                  {sessions
                    ? "Session 을 고르지 않고 Club 의 기록으로만 남길 수도 있습니다."
                    : "Session 목록을 불러오지 못했습니다. 지금은 Club 의 기록으로만 남길 수 있고, 저장한 뒤에 Session 을 고를 수 있습니다."}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="log-title">제목 (필수)</FieldLabel>
              <Input
                id="log-title"
                name="title"
                required
                maxLength={AI_LOG_TITLE_MAX}
                autoComplete="off"
                placeholder="예: RAG 검색 품질을 청크 크기로 비교해 봤다"
                defaultValue={values.title}
                aria-invalid={invalid("title")}
                aria-describedby={errors.title ? "log-title-error" : undefined}
              />
              {errors.title && (
                <FieldError id="log-title-error">{errors.title}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="log-tools">사용한 도구</FieldLabel>
              <ToolsInput
                id="log-tools"
                name="tools"
                defaultValue={defaults.tools}
                invalid={invalid("tools")}
                describedBy="log-tools-help"
              />
              {errors.tools ? (
                <FieldError id="log-tools-help">{errors.tools}</FieldError>
              ) : (
                <FieldDescription id="log-tools-help">
                  Enter 나 쉼표로 여러 개를 넣습니다.
                </FieldDescription>
              )}
            </Field>
            {TEXT_FIELDS.map((field) => (
              <Field key={field.name}>
                <FieldLabel htmlFor={`log-${field.name}`}>
                  {field.label}
                </FieldLabel>
                <Textarea
                  id={`log-${field.name}`}
                  name={field.name}
                  required={field.required}
                  maxLength={AI_LOG_TEXT_MAX}
                  placeholder={field.placeholder}
                  defaultValue={values[field.name]}
                  aria-invalid={invalid(field.name)}
                  aria-describedby={
                    errors[field.name] ? `log-${field.name}-error` : undefined
                  }
                />
                {errors[field.name] && (
                  <FieldError id={`log-${field.name}-error`}>
                    {errors[field.name]}
                  </FieldError>
                )}
              </Field>
            ))}
          </div>
          <div className="flex gap-2 sm:hidden">{actions}</div>
        </div>
        <aside className="flex flex-col gap-6">
          {selected && (
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
              <h2 className="text-h4">Session 맥락</h2>
              <p className="text-label-m">{selected.title}</p>
              <p className="flex items-center gap-1.5 text-body-s text-muted-foreground">
                <Calendar
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-icon-subtle"
                />
                {selected.when}
              </p>
              {selected.description && (
                <p className="line-clamp-4 text-body-s whitespace-pre-wrap text-muted-foreground">
                  {selected.description}
                </p>
              )}
            </section>
          )}
          <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
            <h2 className="text-h4">기록 안내</h2>
            <ul className="flex flex-col gap-2 text-body-s">
              {GUIDE.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check
                    aria-hidden="true"
                    strokeWidth={1.5}
                    className="mt-0.5 size-4 shrink-0 text-icon-brand"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </form>
  )
}
