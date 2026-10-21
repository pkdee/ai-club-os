"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
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
  saveProject,
  type ProjectFormState,
  type ProjectTarget,
} from "../actions"
import {
  PROJECT_GOAL_MAX,
  PROJECT_NAME_MAX,
  type ProjectInput,
} from "../rules"

const initialState: ProjectFormState = { status: "idle" }

// Dialog 가 닫히면 이 컴포넌트가 사라지므로, 다시 열 때 입력과 오류가 처음 상태로 돌아간다.
function ProjectForm({
  target,
  defaults,
  onSaved,
}: {
  target: ProjectTarget
  defaults: ProjectInput
  onSaved: (projectId: string) => void
}) {
  const editing = Boolean(target.projectId)
  const [state, formAction, pending] = useActionState(
    async (previous: ProjectFormState, formData: FormData) => {
      const next = await saveProject(target, previous, formData)
      if (next.status === "success" && next.projectId) {
        onSaved(next.projectId)
      }
      return next
    },
    initialState
  )
  const errors = state.errors ?? {}
  const values = state.values ?? defaults

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.message && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>
            {editing ? "Project 를 저장하지 못했습니다" : "Project 를 만들지 못했습니다"}
          </AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <Field>
        <FieldLabel htmlFor="project-name">Project 이름</FieldLabel>
        <Input
          // 입력 오류로 처음 값이 바뀌면 칸을 새로 그린다.
          // Base UI 의 Input 은 처음 그린 뒤에 바뀐 처음 값을 받지 않는다.
          key={values.name}
          id="project-name"
          name="name"
          required
          maxLength={PROJECT_NAME_MAX}
          autoComplete="off"
          placeholder="예: 동아리 자료를 찾아 주는 RAG 챗봇"
          defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "project-name-error" : undefined}
        />
        {errors.name && (
          <FieldError id="project-name-error">{errors.name}</FieldError>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor="project-goal">목표</FieldLabel>
        <Textarea
          id="project-goal"
          name="goal"
          maxLength={PROJECT_GOAL_MAX}
          placeholder="무엇을 만들려는지, 어디까지 하면 끝인지 적습니다."
          defaultValue={values.goal}
          aria-invalid={errors.goal ? true : undefined}
          aria-describedby="project-goal-help"
        />
        {errors.goal ? (
          <FieldError id="project-goal-help">{errors.goal}</FieldError>
        ) : (
          <FieldDescription id="project-goal-help">
            비워 두고 나중에 적어도 됩니다.
          </FieldDescription>
        )}
      </Field>
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

// projectId 가 있으면 고치는 창, 없으면 만드는 창이다. 만들면 그 Project 의 화면으로 이동한다.
export function ProjectFormDialog({
  target,
  defaults = { name: "", goal: "" },
}: {
  target: ProjectTarget
  defaults?: ProjectInput
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const editing = Boolean(target.projectId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {editing ? (
        <DialogTrigger render={<Button variant="outline" />}>
          <Pencil aria-hidden="true" strokeWidth={1.5} />
          수정
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus aria-hidden="true" strokeWidth={1.5} />
          Project 만들기
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Project 수정" : "Project 만들기"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "이름과 목표를 고칩니다."
              : "만든 사람이 첫 참여자가 됩니다. 참여자는 만든 뒤에 더할 수 있습니다."}
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          target={target}
          defaults={defaults}
          onSaved={(projectId) => {
            setOpen(false)
            if (!editing) {
              router.push(`/clubs/${target.clubId}/projects/${projectId}`)
            }
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
