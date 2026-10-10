"use client"

import { useOptimistic, useState, useTransition } from "react"
import { CircleAlert, Plus, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  addProjectTask,
  removeProjectTask,
  setProjectTaskDone,
  type ProjectActionResult,
} from "../actions"
import type { ProjectTask } from "../queries"
import { PROJECT_TASK_TITLE_MAX } from "../rules"

// Project 의 할 일. 참여자와 운영자는 더하고, 끝냈다고 표시하고, 지운다. 다른 Member 는 읽기만 한다.
export function ProjectTasks({
  clubId,
  projectId,
  tasks,
  canEdit,
}: {
  clubId: string
  projectId: string
  tasks: ProjectTask[]
  canEdit: boolean
}) {
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // 누르자마자 표시가 바뀌어 보이게 한다. 저장이 끝나면 실제 값으로 맞춰진다.
  const [shown, toggle] = useOptimistic(
    tasks,
    (current, change: { id: string; done: boolean }) =>
      current.map((task) =>
        task.id === change.id ? { ...task, done: change.done } : task
      )
  )
  const done = shown.filter((task) => task.done).length

  function run(action: () => Promise<ProjectActionResult>, after?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        after?.()
      } else {
        setError(result.message)
      }
    })
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-h4">할 일</h2>
        {shown.length > 0 && (
          <p className="text-body-s text-muted-foreground">
            {done} / {shown.length} 완료
          </p>
        )}
      </div>
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>바꾸지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {shown.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {shown.map((task) => (
            <li key={task.id} className="flex items-center gap-2">
              <label className="flex min-w-0 flex-1 items-start gap-3 rounded-md py-1.5">
                <input
                  type="checkbox"
                  checked={task.done}
                  disabled={!canEdit}
                  onChange={(event) => {
                    const next = event.target.checked
                    setError(null)
                    startTransition(async () => {
                      toggle({ id: task.id, done: next })
                      const result = await setProjectTaskDone(
                        clubId,
                        task.id,
                        next
                      )
                      if (!result.ok) {
                        setError(result.message)
                      }
                    })
                  }}
                  className="mt-1 size-4 shrink-0 accent-primary"
                />
                <span
                  className={cn(
                    "min-w-0 break-words",
                    task.done && "text-muted-foreground line-through"
                  )}
                >
                  {task.title}
                </span>
              </label>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  aria-label={`${task.title} 지우기`}
                  onClick={() => run(() => removeProjectTask(clubId, task.id))}
                >
                  <X aria-hidden="true" strokeWidth={1.5} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">
          {canEdit
            ? "아직 할 일이 없습니다. 다음에 할 일을 하나 적어 보세요."
            : "아직 할 일이 없습니다."}
        </p>
      )}
      {canEdit && (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (title.trim() === "") {
              return
            }
            run(
              () => addProjectTask(clubId, projectId, title),
              () => setTitle("")
            )
          }}
        >
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={PROJECT_TASK_TITLE_MAX}
            placeholder="할 일을 적고 Enter"
            aria-label="새 할 일"
            enterKeyHint="done"
            autoComplete="off"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={pending || title.trim() === ""}
            className="shrink-0"
          >
            <Plus aria-hidden="true" strokeWidth={1.5} />
            더하기
          </Button>
        </form>
      )}
    </section>
  )
}
