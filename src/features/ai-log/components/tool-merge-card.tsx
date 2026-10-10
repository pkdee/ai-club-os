"use client"

import { useState, useTransition } from "react"
import { CircleAlert, CircleCheck, Combine } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

import { mergeToolSpelling } from "../actions"
import { AI_LOG_TOOL_NAME_MAX } from "../rules"
import type { ToolMergeGroup, ToolSpelling } from "../tool-merge"

// 같은 도구가 다른 표기로 남아 있는 것을 운영자가 하나로 합치는 영역. Club 설정에 놓는다.
// groups 는 합치면 좋은 묶음이고, spellings 는 직접 골라 바꿀 때 쓰는 모든 표기다.
export function ToolMergeCard({
  clubId,
  groups,
  spellings,
}: {
  clubId: string
  groups: ToolMergeGroup[]
  spellings: ToolSpelling[]
}) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [notice, setNotice] = useState<
    { tone: "success" | "danger"; title: string; message: string } | null
  >(null)
  const [pending, startTransition] = useTransition()

  // 한 묶음을 합친다. 바꿀 표기를 하나씩 차례로 바꾸고, 중간에 실패하면 거기서 멈춘다.
  function merge(target: string, sources: string[], after?: () => void) {
    setNotice(null)
    startTransition(async () => {
      let changed = 0
      for (const source of sources) {
        const result = await mergeToolSpelling(clubId, source, target)
        if (!result.ok) {
          setNotice({
            tone: "danger",
            title: "합치지 못했습니다",
            message: result.message,
          })
          return
        }
        changed += result.changed
      }
      setNotice({
        tone: "success",
        title: `${target} 로 합쳤습니다`,
        message:
          changed > 0
            ? `기록 ${changed}개의 도구 이름을 바꿨습니다.`
            : "바뀐 기록이 없습니다. 다른 운영자가 먼저 합쳤을 수 있습니다.",
      })
      after?.()
    })
  }

  return (
    <section className="flex max-w-[720px] flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">도구 표기 정리</h2>
        <p className="text-body-s text-muted-foreground">
          같은 도구가 다른 표기로 남아 있으면 하나로 합칩니다. 다른 Member 가
          쓴 기록의 도구 이름도 함께 바뀝니다. 내용을 고친 것이 아니어서 그
          기록의 고친 시각은 바뀌지 않습니다.
        </p>
      </div>
      {notice && (
        <Alert tone={notice.tone}>
          {notice.tone === "success" ? (
            <CircleCheck aria-hidden="true" strokeWidth={1.5} />
          ) : (
            <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          )}
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      )}
      {groups.length > 0 ? (
        <ul className="flex flex-col divide-y">
          {groups.map((group) => (
            <li
              key={group.target}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-label-m">{group.target}</span>
                <span className="text-body-s break-words text-muted-foreground">
                  {group.sources
                    .map((item) => `${item.tool} ${item.logCount}개`)
                    .join(", ")}
                  {" 를 이 표기로"}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() =>
                  merge(
                    group.target,
                    group.sources.map((item) => item.tool)
                  )
                }
                className="shrink-0"
              >
                <Combine aria-hidden="true" strokeWidth={1.5} />
                합치기
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">
          표기가 갈린 도구가 없습니다.
        </p>
      )}
      {spellings.length > 0 && (
        <details className="border-t pt-4">
          <summary className="cursor-pointer rounded-sm text-label-m focus-visible:outline-2 focus-visible:outline-ring">
            표기를 직접 골라 바꾸기
          </summary>
          <form
            className="flex flex-col gap-2 pt-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              if (from && to.trim()) {
                merge(to.trim(), [from], () => {
                  setFrom("")
                  setTo("")
                })
              }
            }}
          >
            <NativeSelect
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              aria-label="바꿀 표기"
              className="min-w-0 sm:flex-1"
            >
              <option value="">바꿀 표기 고르기</option>
              {spellings.map((item) => (
                <option key={item.tool} value={item.tool}>
                  {item.tool} ({item.logCount}개)
                </option>
              ))}
            </NativeSelect>
            <Input
              value={to}
              onChange={(event) => setTo(event.target.value)}
              maxLength={AI_LOG_TOOL_NAME_MAX}
              placeholder="새 표기"
              aria-label="새 표기"
              autoComplete="off"
              className="min-w-0 sm:flex-1"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={pending || from === "" || to.trim() === ""}
              className="shrink-0"
            >
              바꾸기
            </Button>
          </form>
        </details>
      )}
    </section>
  )
}
