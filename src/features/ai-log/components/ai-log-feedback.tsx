"use client"

import { useId, useState, useTransition } from "react"
import { CircleAlert, Lightbulb, MessageSquare, Pencil } from "lucide-react"

import { DeleteDialog } from "@/components/delete-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  addAiLogComment,
  deleteAiLogComment,
  setAiLogHelpful,
  updateAiLogComment,
  type CommentActionResult,
} from "../comment-actions"
import { AI_LOG_COMMENT_MAX } from "../comment-rules"
import type { AiLogComment } from "../comments"
import { formatLogDateTime } from "../format"

// 쓴 뒤에 고쳤는지. 저장하면서 생기는 작은 시각 차이는 고친 것으로 보지 않는다.
function wasEdited(comment: AiLogComment) {
  return (
    new Date(comment.updatedAt).getTime() -
      new Date(comment.createdAt).getTime() >
    1000
  )
}

function CommentItem({
  clubId,
  comment,
  mine,
  canDelete,
  now,
}: {
  clubId: string
  comment: AiLogComment
  mine: boolean
  canDelete: boolean
  now: Date
}) {
  const editId = useId()
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(comment.body)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const name = comment.author ? comment.author.name : "탈퇴한 Member"

  return (
    <li className="flex gap-3 py-4 first:pt-0 last:pb-0">
      <Avatar size="sm" name={name} src={comment.author?.avatarUrl ?? null} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-label-m">{name}</span>
          {mine && (
            <span className="rounded-full bg-muted px-2 text-label-s text-muted-foreground">
              나
            </span>
          )}
          <span className="text-caption text-muted-foreground">
            {formatLogDateTime(comment.createdAt, now)}
            {wasEdited(comment) && " · 수정됨"}
          </span>
        </div>
        {editing ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              setError(null)
              startTransition(async () => {
                const result = await updateAiLogComment(clubId, comment.id, body)
                if (result.ok) {
                  setEditing(false)
                } else {
                  setError(result.message)
                }
              })
            }}
          >
            <label htmlFor={editId} className="sr-only">
              댓글 고치기
            </label>
            <Textarea
              id={editId}
              value={body}
              disabled={pending}
              maxLength={AI_LOG_COMMENT_MAX}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-20"
            />
            {error && (
              <p role="alert" className="text-caption text-danger">
                {error}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "저장하는 중" : "저장"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setBody(comment.body)
                  setError(null)
                  setEditing(false)
                }}
              >
                취소
              </Button>
            </div>
          </form>
        ) : (
          <p className="break-words whitespace-pre-wrap">{comment.body}</p>
        )}
        {!editing && (mine || canDelete) && (
          <div className="flex items-center gap-2">
            {mine && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil aria-hidden="true" strokeWidth={1.5} />
                고치기
              </Button>
            )}
            <DeleteDialog
              label="삭제"
              size="sm"
              title="이 댓글을 지울까요?"
              description={
                <>
                  {!mine && <p>{name} 님이 쓴 댓글입니다.</p>}
                  <p>
                    지우면 되돌릴 수 없습니다. 지웠다는 사실은 운영자가 볼 수
                    있게 남고, 적은 내용은 남지 않습니다.
                  </p>
                </>
              }
              onDelete={deleteAiLogComment.bind(null, clubId, comment.id)}
            />
          </div>
        )}
      </div>
    </li>
  )
}

// AI Log 아래의 댓글과 "도움이 됐어요" 표시.
// ownLog 는 내가 쓴 기록이라는 뜻이다. 그때는 표시할 수 없고 누가 표시했는지만 본다.
// isAdmin 은 운영자라는 뜻이고, 남의 댓글을 지울 수 있다. 실제 판단은 데이터베이스가 한다.
export function AiLogFeedback({
  clubId,
  logId,
  comments,
  helpful,
  currentUserId,
  ownLog,
  isAdmin,
  now,
}: {
  clubId: string
  logId: string
  comments: AiLogComment[]
  helpful: { names: string[]; mine: boolean }
  currentUserId: string
  ownLog: boolean
  isAdmin: boolean
  now: Date
}) {
  const formId = useId()
  const [body, setBody] = useState("")
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null
  )
  const [pending, startTransition] = useTransition()

  function run(
    title: string,
    action: () => Promise<CommentActionResult>,
    after?: () => void
  ) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        after?.()
      } else {
        setError({ title, message: result.message })
      }
    })
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-h4">
          <MessageSquare
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-5 shrink-0 text-icon-subtle"
          />
          댓글 {comments.length}개
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {helpful.names.length > 0 && (
            <span className="text-body-s text-muted-foreground">
              {helpful.names.slice(0, 3).join(", ")}
              {helpful.names.length > 3 && ` 외 ${helpful.names.length - 3}명`}
              {ownLog ? " 님에게 도움이 됐습니다" : " 님이 표시했습니다"}
            </span>
          )}
          {!ownLog && (
            <Button
              type="button"
              variant={helpful.mine ? "default" : "outline"}
              size="sm"
              aria-pressed={helpful.mine}
              disabled={pending}
              onClick={() =>
                run("표시를 바꾸지 못했습니다", () =>
                  setAiLogHelpful(clubId, logId, !helpful.mine)
                )
              }
            >
              <Lightbulb aria-hidden="true" strokeWidth={1.5} />
              도움이 됐어요
              {helpful.names.length > 0 && (
                <span className="tabular-nums">{helpful.names.length}</span>
              )}
            </Button>
          )}
        </div>
      </div>
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {comments.length > 0 ? (
        <ul className="flex flex-col divide-y">
          {comments.map((comment) => {
            const mine = comment.author?.userId === currentUserId

            return (
              <CommentItem
                key={comment.id}
                clubId={clubId}
                comment={comment}
                mine={mine}
                canDelete={mine || isAdmin}
                now={now}
              />
            )
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground">
          아직 댓글이 없습니다. 궁금한 것이나 비슷하게 해 본 것을 남겨 보세요.
        </p>
      )}
      <form
        className={cn("flex flex-col gap-2", comments.length > 0 && "border-t pt-4")}
        onSubmit={(event) => {
          event.preventDefault()
          run(
            "댓글을 달지 못했습니다",
            () => addAiLogComment(clubId, logId, body),
            () => setBody("")
          )
        }}
      >
        <label htmlFor={formId} className="text-label-m">
          댓글 달기
        </label>
        <Textarea
          id={formId}
          value={body}
          disabled={pending}
          maxLength={AI_LOG_COMMENT_MAX}
          placeholder="같은 Club 의 Member 가 모두 봅니다."
          onChange={(event) => setBody(event.target.value)}
          className="min-h-20"
        />
        <Button
          type="submit"
          size="sm"
          disabled={pending || body.trim() === ""}
          className="self-end"
        >
          {pending ? "올리는 중" : "댓글 달기"}
        </Button>
      </form>
    </section>
  )
}
