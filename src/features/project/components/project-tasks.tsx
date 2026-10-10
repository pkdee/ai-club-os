"use client"

import { useOptimistic, useState, useTransition } from "react"
import { CircleAlert, Pencil, Plus, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"

import {
  addProjectTask,
  removeProjectTask,
  setProjectTaskDone,
  updateProjectTask,
  type ProjectActionResult,
} from "../actions"
import type { ProjectTask, ProjectTaskDetail } from "../queries"
import { PROJECT_TASK_TITLE_MAX, formatDueDate, isOverdue } from "../rules"

type Editing = {
  id: string
  title: string
  assigneeMemberId: string
  dueOn: string
}

// Project 의 할 일. 참여자와 운영자는 더하고, 끝냈다고 표시하고, 고치고, 지운다. 다른 Member 는 읽기만 한다.
// details 는 할 일마다의 담당자와 기한이다. null 이면 아직 쓸 수 없는 것이라 보여 주지도 고치지도 않는다.
// participants 는 맡길 수 있는 사람이고, today 는 한국 시간의 오늘 날짜(YYYY-MM-DD)다.
export function ProjectTasks({
  clubId,
  projectId,
  tasks,
  details,
  participants,
  today,
  canEdit,
}: {
  clubId: string
  projectId: string
  tasks: ProjectTask[]
  details: Record<string, ProjectTaskDetail> | null
  participants: { memberId: string; name: string }[]
  today: string
  canEdit: boolean
}) {
  const [title, setTitle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
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

  // 고치는 창에서 고를 수 있는 담당자. 참여를 그만둔 사람이 맡고 있으면 그 사람도 그대로 둘 수 있게 넣는다.
  const editingAssignee = editing ? details?.[editing.id]?.assignee : null
  const assigneeOptions =
    editingAssignee &&
    !participants.some((item) => item.memberId === editingAssignee.memberId)
      ? [
          ...participants,
          {
            memberId: editingAssignee.memberId,
            name: `${editingAssignee.name} (참여자 아님)`,
          },
        ]
      : participants

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
          {shown.map((task) => {
            const detail = details?.[task.id]
            const overdue = isOverdue(detail?.dueOn ?? null, task.done, today)

            return (
              <li key={task.id} className="flex items-start gap-2">
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
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className={cn(
                        "min-w-0 break-words",
                        task.done && "text-muted-foreground line-through"
                      )}
                    >
                      {task.title}
                    </span>
                    {detail && (detail.assignee || detail.dueOn) && (
                      <span className="flex flex-wrap gap-x-2 text-caption text-muted-foreground">
                        {detail.assignee && (
                          <span>담당 {detail.assignee.name}</span>
                        )}
                        {detail.dueOn && (
                          <span className={cn(overdue && "text-danger")}>
                            {formatDueDate(detail.dueOn, today)}까지
                            {overdue && " · 기한 지남"}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </label>
                {canEdit && (
                  <div className="flex shrink-0 items-center">
                    {details && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending}
                        aria-label={`${task.title} 고치기`}
                        onClick={() => {
                          setEditError(null)
                          setEditing({
                            id: task.id,
                            title: task.title,
                            assigneeMemberId: detail?.assignee?.memberId ?? "",
                            dueOn: detail?.dueOn ?? "",
                          })
                        }}
                      >
                        <Pencil aria-hidden="true" strokeWidth={1.5} />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending}
                      aria-label={`${task.title} 지우기`}
                      onClick={() =>
                        run(() => removeProjectTask(clubId, task.id))
                      }
                    >
                      <X aria-hidden="true" strokeWidth={1.5} />
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
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
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setEditing(null)
          }
        }}
      >
        <DialogContent>
          {editing && (
            <form
              className="flex flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault()
                setEditError(null)
                startTransition(async () => {
                  const result = await updateProjectTask(clubId, editing.id, {
                    title: editing.title,
                    assigneeMemberId: editing.assigneeMemberId,
                    dueOn: editing.dueOn,
                  })
                  if (result.ok) {
                    setEditing(null)
                  } else {
                    setEditError(result.message)
                  }
                })
              }}
            >
              <DialogHeader>
                <DialogTitle>할 일 고치기</DialogTitle>
                <DialogDescription>
                  할 일의 글과 담당자, 기한을 고칩니다.
                </DialogDescription>
              </DialogHeader>
              {editError && (
                <Alert tone="danger">
                  <CircleAlert aria-hidden="true" strokeWidth={1.5} />
                  <AlertTitle>고치지 못했습니다</AlertTitle>
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel htmlFor="task-title">할 일</FieldLabel>
                <Input
                  id="task-title"
                  value={editing.title}
                  onChange={(event) =>
                    setEditing({ ...editing, title: event.target.value })
                  }
                  maxLength={PROJECT_TASK_TITLE_MAX}
                  autoComplete="off"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="task-assignee">담당자</FieldLabel>
                <NativeSelect
                  id="task-assignee"
                  value={editing.assigneeMemberId}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      assigneeMemberId: event.target.value,
                    })
                  }
                  aria-describedby="task-assignee-help"
                >
                  <option value="">맡은 사람 없음</option>
                  {assigneeOptions.map((item) => (
                    <option key={item.memberId} value={item.memberId}>
                      {item.name}
                    </option>
                  ))}
                </NativeSelect>
                <FieldDescription id="task-assignee-help">
                  이 Project 의 참여자에게만 맡길 수 있습니다.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="task-due">기한</FieldLabel>
                <Input
                  id="task-due"
                  type="date"
                  value={editing.dueOn}
                  onChange={(event) =>
                    setEditing({ ...editing, dueOn: event.target.value })
                  }
                  aria-describedby="task-due-help"
                />
                <FieldDescription id="task-due-help">
                  비워 두면 기한 없이 둡니다. 기한이 지나도록 끝내지 않은 일은
                  눈에 띄게 보입니다.
                </FieldDescription>
              </Field>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setEditing(null)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={pending || editing.title.trim() === ""}
                >
                  {pending ? "저장하는 중" : "저장"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
