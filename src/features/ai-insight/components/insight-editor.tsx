"use client"

import { useState, useTransition } from "react"
import { CircleAlert, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { saveInsightContent } from "../actions"
import {
  INSIGHT_OVERVIEW_MAX,
  INSIGHT_TEXT_MAX,
  INSIGHT_THEME_TITLE_MAX,
  type InsightContent,
  type InsightItem,
} from "../content"

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={onClick}
    >
      <X aria-hidden="true" strokeWidth={1.5} />
    </Button>
  )
}

function ItemsEditor({
  title,
  items,
  onChange,
}: {
  title: string
  items: InsightItem[]
  onChange: (items: InsightItem[]) => void
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:p-6">
      <legend className="float-left text-h4">{title}</legend>
      <ul className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <Textarea
              aria-label={`${title} ${index + 1}`}
              value={item.text}
              maxLength={INSIGHT_TEXT_MAX}
              onChange={(event) =>
                onChange(
                  items.map((other, position) =>
                    position === index
                      ? { ...other, text: event.target.value }
                      : other
                  )
                )
              }
              className="min-h-20"
            />
            <RemoveButton
              label={`${title} ${index + 1} 빼기`}
              onClick={() =>
                onChange(items.filter((_, position) => position !== index))
              }
            />
          </li>
        ))}
      </ul>
    </fieldset>
  )
}

// 운영자가 공개하기 전에 AI 가 정리한 내용을 고친다. 틀린 항목은 빼고, 글은 직접 고친다.
// 항목을 새로 더하지는 않는다. 저장하면 onDone 을 부른다.
export function InsightEditor({
  clubId,
  insightId,
  content,
  onDone,
}: {
  clubId: string
  insightId: string
  content: InsightContent
  onDone: () => void
}) {
  const [draft, setDraft] = useState(content)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        startTransition(async () => {
          const result = await saveInsightContent(clubId, insightId, draft)
          if (result.ok) {
            onDone()
          } else {
            setError(result.message)
          }
        })
      }}
    >
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>저장하지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:p-6">
        <Field>
          <FieldLabel htmlFor="insight-overview" className="text-h4">
            요약
          </FieldLabel>
          <Textarea
            id="insight-overview"
            value={draft.overview}
            maxLength={INSIGHT_OVERVIEW_MAX}
            onChange={(event) =>
              setDraft({ ...draft, overview: event.target.value })
            }
            className="min-h-28"
          />
        </Field>
      </div>
      {draft.themes.length > 0 && (
        <fieldset className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:p-6">
          <legend className="float-left text-h4">반복된 주제</legend>
          <ul className="flex flex-col gap-4">
            {draft.themes.map((theme, index) => {
              const change = (fields: Partial<typeof theme>) =>
                setDraft({
                  ...draft,
                  themes: draft.themes.map((other, position) =>
                    position === index ? { ...other, ...fields } : other
                  ),
                })

              return (
                <li key={index} className="flex items-start gap-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Input
                      aria-label={`주제 ${index + 1} 이름`}
                      value={theme.title}
                      maxLength={INSIGHT_THEME_TITLE_MAX}
                      onChange={(event) => change({ title: event.target.value })}
                    />
                    <Textarea
                      aria-label={`주제 ${index + 1} 설명`}
                      value={theme.summary}
                      maxLength={INSIGHT_TEXT_MAX}
                      onChange={(event) =>
                        change({ summary: event.target.value })
                      }
                      className="min-h-20"
                    />
                  </div>
                  <RemoveButton
                    label={`주제 ${index + 1} 빼기`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        themes: draft.themes.filter(
                          (_, position) => position !== index
                        ),
                      })
                    }
                  />
                </li>
              )
            })}
          </ul>
        </fieldset>
      )}
      <ItemsEditor
        title="배운 점"
        items={draft.lessons}
        onChange={(lessons) => setDraft({ ...draft, lessons })}
      />
      <ItemsEditor
        title="다음 행동"
        items={draft.nextActions}
        onChange={(nextActions) => setDraft({ ...draft, nextActions })}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onDone}
        >
          취소
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "저장하는 중" : "고친 내용 저장"}
        </Button>
      </div>
    </form>
  )
}
