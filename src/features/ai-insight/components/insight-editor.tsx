"use client"

import { useState, useTransition } from "react"
import { CircleAlert, Plus, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { saveInsightContent } from "../actions"
import {
  INSIGHT_ITEM_MAX,
  INSIGHT_OVERVIEW_MAX,
  INSIGHT_TEXT_MAX,
  INSIGHT_THEME_MAX,
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

// 묶음 아래에 놓는 더하기 버튼. 정해진 수를 채우면 누를 수 없다.
function AddButton({
  label,
  full,
  onClick,
}: {
  label: string
  full: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={full}
      onClick={onClick}
      className="self-start"
    >
      <Plus aria-hidden="true" strokeWidth={1.5} />
      {label}
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
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:p-6">
      <legend className="float-left text-h4">{title}</legend>
      <ul className="flex flex-col gap-3 empty:hidden">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <Textarea
              aria-label={`${title} ${index + 1}`}
              placeholder="한두 문장으로 적습니다. 비워 두면 저장할 때 빠집니다."
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
      <AddButton
        label={`${title} 더하기`}
        full={items.length >= INSIGHT_ITEM_MAX}
        onClick={() => onChange([...items, { text: "", logIds: [] }])}
      />
    </fieldset>
  )
}

// 운영자가 공개하기 전에 AI 가 정리한 내용을 고친다. 틀린 항목은 빼고, 글은 직접 고치고, 빠진 것은 더한다.
// 직접 더한 항목에는 근거 기록이 없다. 비워 둔 항목은 저장할 때 빠진다. 저장하면 onDone 을 부른다.
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
      <fieldset className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:p-6">
        <legend className="float-left text-h4">반복된 주제</legend>
        <ul className="flex flex-col gap-4 empty:hidden">
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
                    placeholder="주제의 짧은 이름"
                    value={theme.title}
                    maxLength={INSIGHT_THEME_TITLE_MAX}
                    onChange={(event) => change({ title: event.target.value })}
                  />
                  <Textarea
                    aria-label={`주제 ${index + 1} 설명`}
                    placeholder="그 주제를 한두 문장으로 설명합니다."
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
        <AddButton
          label="주제 더하기"
          full={draft.themes.length >= INSIGHT_THEME_MAX}
          onClick={() =>
            setDraft({
              ...draft,
              themes: [...draft.themes, { title: "", summary: "", logIds: [] }],
            })
          }
        />
      </fieldset>
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
