"use client"

import { useState, useTransition } from "react"
import { CircleAlert, EyeOff, Pencil, Send } from "lucide-react"

import { DeleteDialog } from "@/components/delete-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { deleteInsight, setInsightStatus } from "../actions"
import type { InsightContent } from "../content"
import type { InsightStatus } from "../queries"
import { InsightEditor } from "./insight-editor"
import { InsightView } from "./insight-view"

// 운영자가 AI Insight 를 다루는 영역. 읽고, 고치고, 공개하거나 초안으로 되돌리고, 지운다.
// regenerate 에는 다시 만드는 버튼을 넣는다. 지우면 같은 화면이 빈 상태로 돌아간다.
export function InsightManager({
  clubId,
  insight,
  logTitles,
  regenerate,
}: {
  clubId: string
  // content 가 null 이면 저장된 값을 읽을 수 없는 것이다.
  insight: { id: string; status: InsightStatus; content: InsightContent | null }
  logTitles: Record<string, string>
  regenerate?: React.ReactNode
}) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const published = insight.status === "published"

  function changeStatus(status: InsightStatus) {
    setError(null)
    startTransition(async () => {
      const result = await setInsightStatus(clubId, insight.id, status)
      if (!result.ok) {
        setError(result.message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {!editing && (
        <div className="flex flex-wrap items-center gap-2">
          {insight.content &&
            (published ? (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => changeStatus("draft")}
              >
                <EyeOff aria-hidden="true" strokeWidth={1.5} />
                {pending ? "바꾸는 중" : "초안으로 되돌리기"}
              </Button>
            ) : (
              <Button disabled={pending} onClick={() => changeStatus("published")}>
                <Send aria-hidden="true" strokeWidth={1.5} />
                {pending ? "공개하는 중" : "공개하기"}
              </Button>
            ))}
          {insight.content && (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                setError(null)
                setEditing(true)
              }}
            >
              <Pencil aria-hidden="true" strokeWidth={1.5} />
              고치기
            </Button>
          )}
          {regenerate}
          <DeleteDialog
            label="삭제"
            title="이 AI Insight 를 지울까요?"
            description={
              <>
                <p>
                  AI 가 정리한 내용과 운영자가 고친 내용이 함께 지워집니다.
                  {published && " 공개된 상태라서 Member 에게도 보이지 않게 됩니다."}
                </p>
                <p>
                  지우면 되돌릴 수 없습니다. 원본 AI Log 는 그대로 남아 있어 다시
                  만들 수 있습니다. 지웠다는 사실은 Club 설정의 지운 기록에
                  남습니다.
                </p>
              </>
            }
            onDelete={() => deleteInsight(clubId, insight.id)}
          />
        </div>
      )}
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>바꾸지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!insight.content ? (
        <p className="rounded-xl border bg-card p-5 text-muted-foreground">
          저장된 내용을 읽을 수 없습니다. 다시 만들거나 지워 주세요.
        </p>
      ) : editing ? (
        <InsightEditor
          clubId={clubId}
          insightId={insight.id}
          content={insight.content}
          onDone={() => setEditing(false)}
        />
      ) : (
        <InsightView
          clubId={clubId}
          content={insight.content}
          logTitles={logTitles}
        />
      )}
    </div>
  )
}
