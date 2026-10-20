"use client"

import { useId, useState, useTransition } from "react"
import { CircleAlert, NotebookPen, Pencil } from "lucide-react"

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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

import {
  createRetrospective,
  updateRetrospective,
  type RetrospectiveActionResult,
} from "../actions"
import {
  RETRO_FIELD_MAX,
  RETRO_FIELDS,
  type RetrospectiveErrors,
  type RetrospectiveInput,
  type RetrospectiveOptions,
  type RetrospectiveTarget,
} from "../rules"

const EMPTY: RetrospectiveInput = { wentWell: "", toImprove: "", toTry: "" }
const NO_OPTIONS: RetrospectiveOptions = {
  useInInsight: false,
  shareInPresentation: false,
}

// Dialog 가 닫히면 이 컴포넌트가 사라지므로, 다시 열 때 입력과 오류가 처음 상태로 돌아간다.
// scope 는 무엇을 돌아보는지다. 그 단위에 뜻이 있는 쓰임만 고르게 한다.
// defaultOptions 가 null 이면 쓰임을 정하는 열이 아직 없는 것이라 그 칸을 그리지 않는다.
// insightNotice 는 AI Insight 에 쓰는 AI 서비스가 받은 글을 어떻게 쓰는지 따로 알릴 글이다. 없으면 null 이다.
function FormBody({
  scope,
  defaults,
  defaultOptions,
  insightNotice,
  editing,
  pending,
  onSave,
}: {
  scope: RetrospectiveTarget["scope"]
  defaults: RetrospectiveInput
  defaultOptions: RetrospectiveOptions | null
  insightNotice: string | null
  editing: boolean
  pending: boolean
  onSave: (
    values: RetrospectiveInput,
    options: RetrospectiveOptions | null,
    onError: (result: { message: string; errors?: RetrospectiveErrors }) => void
  ) => void
}) {
  const baseId = useId()
  const [values, setValues] = useState(defaults)
  const [options, setOptions] = useState(defaultOptions)
  const [failure, setFailure] = useState<{
    message: string
    errors?: RetrospectiveErrors
  } | null>(null)

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (!pending) {
          setFailure(null)
          onSave(values, options, setFailure)
        }
      }}
    >
      {failure && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>
            {editing ? "회고를 고치지 못했습니다" : "회고를 저장하지 못했습니다"}
          </AlertTitle>
          <AlertDescription>{failure.message}</AlertDescription>
        </Alert>
      )}
      {RETRO_FIELDS.map(({ key, label, placeholder }) => {
        const id = `${baseId}-${key}`
        const error = failure?.errors?.[key]

        return (
          <Field key={key}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Textarea
              id={id}
              value={values[key]}
              disabled={pending}
              maxLength={RETRO_FIELD_MAX}
              placeholder={placeholder}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
          </Field>
        )
      })}
      {options &&
        (scope === "project" ? (
          <CheckboxField
            checked={options.shareInPresentation}
            disabled={pending}
            onChange={(event) =>
              setOptions({ ...options, shareInPresentation: event.target.checked })
            }
            label="발표에 넣어도 됨"
            description="켜면 이 Project 의 발표에 들어가, 링크를 받은 Club 밖의 사람도 볼 수 있습니다. 끄면 발표에서 바로 빠집니다."
          />
        ) : (
          <CheckboxField
            checked={options.useInInsight}
            disabled={pending}
            onChange={(event) =>
              setOptions({ ...options, useInInsight: event.target.checked })
            }
            label="AI Insight 에 써도 됨"
            description={[
              "켜면 운영자가 AI Insight 를 만들 때 이 회고를 AI 서비스로 보냅니다. 이름과 이메일은 보내지 않습니다.",
              insightNotice,
            ]
              .filter(Boolean)
              .join(" ")}
          />
        ))}
      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" disabled={pending} />}
        >
          취소
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "저장하는 중" : "저장"}
        </Button>
      </DialogFooter>
    </form>
  )
}

// 회고를 쓰거나 고치는 창. 여는 버튼과 창을 함께 그린다.
// existing 이 있으면 그 회고를 고치고, 없으면 target 에 새로 쓴다.
// subject 는 무엇을 돌아보는지 알리는 이름이다. 예: Project 이름, Session 제목, 2026년 10월
// optionsReady 가 false 이면 쓰임을 정하는 열이 아직 없는 것이라 그 칸을 그리지 않는다.
// insightNotice 는 FormBody 의 것과 같다.
export function RetrospectiveFormDialog({
  clubId,
  target,
  subject,
  existing,
  optionsReady = false,
  insightNotice = null,
}: {
  clubId: string
  target: RetrospectiveTarget
  subject: string
  existing?: { id: string; options: RetrospectiveOptions | null } & RetrospectiveInput
  optionsReady?: boolean
  insightNotice?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const editing = Boolean(existing)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // 저장하는 중에는 닫지 않는다.
        if (!pending) {
          setOpen(next)
        }
      }}
    >
      {editing ? (
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Pencil aria-hidden="true" strokeWidth={1.5} />
          고치기
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="outline" />}>
          <NotebookPen aria-hidden="true" strokeWidth={1.5} />
          회고 쓰기
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "회고 고치기" : "회고 쓰기"}</DialogTitle>
          <DialogDescription render={<div />} className="flex flex-col gap-1">
            <p className="break-words">돌아보는 것: {subject}</p>
            <p>
              세 칸 가운데 하나만 적어도 됩니다. 같은 Club 의 Member 가 모두 볼
              수 있습니다.
            </p>
          </DialogDescription>
        </DialogHeader>
        <FormBody
          scope={target.scope}
          defaultOptions={
            optionsReady ? (existing?.options ?? NO_OPTIONS) : null
          }
          insightNotice={insightNotice}
          defaults={
            existing
              ? {
                  wentWell: existing.wentWell,
                  toImprove: existing.toImprove,
                  toTry: existing.toTry,
                }
              : EMPTY
          }
          editing={editing}
          pending={pending}
          onSave={(values, options, onError) =>
            startTransition(async () => {
              const result: RetrospectiveActionResult = existing
                ? await updateRetrospective(
                    clubId,
                    existing.id,
                    target.scope,
                    values,
                    options
                  )
                : await createRetrospective(clubId, target, values, options)
              if (result.ok) {
                setOpen(false)
              } else {
                onError(result)
              }
            })
          }
        />
      </DialogContent>
    </Dialog>
  )
}
