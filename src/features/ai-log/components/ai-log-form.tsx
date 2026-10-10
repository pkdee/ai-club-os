"use client"

import {
  useActionState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Check, CircleAlert, History } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { kstTime } from "@/features/session/time"

import {
  saveAiLog,
  type AiLogFormState,
  type AiLogTarget,
} from "../actions"
import { hasDraftContent } from "../draft"
import {
  forgetOpenedDraft,
  openedDraft,
  removeDraft,
  writeDraft,
} from "../draft-storage"
import {
  AI_LOG_TEXT_MAX,
  AI_LOG_TITLE_MAX,
  readAiLogForm,
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

// 적기를 멈추고 이만큼 지나면 쓰다 만 내용을 브라우저에 맡겨 둔다.
const DRAFT_DELAY_MS = 500

const GUIDE = [
  "완성된 글이 아니어도 됩니다.",
  "잘 안 된 시도도 좋은 기록입니다.",
  "필수 항목은 제목과 시도한 내용입니다.",
  "쓰는 동안 이 브라우저에 임시로 저장됩니다.",
  "저장한 뒤에도 고칠 수 있습니다.",
  "운영자가 AI Insight 를 만들 때 기록 내용이 AI 서비스로 보내질 수 있습니다. 이름과 이메일은 보내지 않습니다.",
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
// sessions 가 null 이면 Session 목록을 불러오지 못한 것이다. knownTools 는 이 Club 에서 이미 쓰는 도구 이름이다.
// projects 는 고를 수 있는 Project 다. 내가 참여하는 것만 들어 있고, null 이면 Project 를 고르는 칸을 그리지 않는다.
// draftKey 는 쓰다 만 내용을 브라우저에 맡겨 둘 때 쓰는 이름이다.
export function AiLogForm({
  target,
  clubName,
  defaults,
  sessions,
  projects,
  knownTools,
  cancelHref,
  draftKey,
}: {
  target: AiLogTarget
  clubName: string
  defaults: AiLogInput
  sessions: SessionOption[] | null
  projects: { id: string; name: string }[] | null
  knownTools: string[]
  cancelHref: string
  draftKey: string
}) {
  const editing = Boolean(target.logId)
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 저장에 성공한 뒤에는 더 맡겨 두지 않는다.
  const savedRef = useRef(false)

  const [state, formAction, pending] = useActionState(
    async (previous: AiLogFormState, formData: FormData) => {
      const result = await saveAiLog(target, previous, formData)
      if (result.status === "success" && result.logId) {
        // 저장이 끝난 뒤에야 맡겨 둔 것을 지운다. 저장하지 못했거나 로그인이 풀렸을 때는 내용이 남는다.
        savedRef.current = true
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
        removeDraft(draftKey)
        router.push(`/clubs/${target.clubId}/logs/${result.logId}`)
      }
      return result
    },
    initialState
  )
  // 상세 화면으로 넘어갈 때까지 버튼을 잠가 둔다.
  const saving = pending || state.status === "success"

  // 화면을 열었을 때 맡겨져 있던 내용. 서버에서 그릴 때와 처음 그릴 때는 없는 것으로 본다.
  const subscribe = useCallback(
    () => () => forgetOpenedDraft(draftKey),
    [draftKey]
  )
  const opened = useSyncExternalStore(
    subscribe,
    () => openedDraft(draftKey),
    () => null
  )
  const [discarded, setDiscarded] = useState(false)
  // 이 화면에서 마지막으로 맡기거나 지운 결과. 아직 아무 일도 없었으면 null 이다.
  const [draftChange, setDraftChange] = useState<{
    savedAt: string | null
  } | null>(null)
  const restored =
    opened && !discarded && hasDraftContent(opened.values, defaults)
      ? opened
      : null
  // 맡겨 둔 Session 이나 Project 가 그사이 없어졌으면 처음 값으로 둔다.
  const base: AiLogInput = restored
    ? {
        ...restored.values,
        sessionId:
          restored.values.sessionId === "" ||
          sessions?.some((session) => session.id === restored.values.sessionId)
            ? restored.values.sessionId
            : defaults.sessionId,
        projectId:
          restored.values.projectId === "" ||
          projects?.some((project) => project.id === restored.values.projectId)
            ? restored.values.projectId
            : defaults.projectId,
      }
    : defaults

  // 고른 Session 에 따라 옆의 안내가 바뀌므로 이 값은 직접 들고 있는다. 고르기 전에는 처음 값을 따른다.
  const [pickedSession, setPickedSession] = useState<string | null>(null)
  const sessionId = pickedSession ?? base.sessionId
  const errors = state.errors ?? {}
  const values = state.values ?? base
  const selected = sessions?.find((session) => session.id === sessionId) ?? null
  const clubHref = `/clubs/${target.clubId}`
  const invalid = (name: keyof AiLogInput) => (errors[name] ? true : undefined)

  // 지금 폼에 적힌 것을 브라우저에 맡겨 둔다. 처음 값과 같아졌으면 맡겨 둔 것을 지운다.
  const persistDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const form = formRef.current
    if (!form || savedRef.current) {
      return
    }

    const current = readAiLogForm(new FormData(form))
    if (hasDraftContent(current, defaults)) {
      setDraftChange({ savedAt: writeDraft(draftKey, current) })
    } else {
      removeDraft(draftKey)
      setDraftChange({ savedAt: null })
    }
  }, [defaults, draftKey])

  // 적는 동안에는 잠시 멈췄을 때 한 번만 맡긴다.
  function scheduleDraft() {
    if (savedRef.current) {
      return
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(persistDraft, DRAFT_DELAY_MS)
  }

  function flushDraft() {
    if (timerRef.current) {
      persistDraft()
    }
  }

  // 탭을 닫거나 다른 곳으로 떠날 때 아직 맡기지 않은 것이 있으면 바로 맡긴다.
  useEffect(() => {
    function flush() {
      if (timerRef.current) {
        persistDraft()
      }
    }
    window.addEventListener("pagehide", flush)
    return () => window.removeEventListener("pagehide", flush)
  }, [persistDraft])
  // 이 화면이 사라질 때도 같다. 폼이 아직 남아 있을 때 읽어야 해서 그리기 전 단계에서 처리한다.
  useLayoutEffect(
    () => () => {
      if (timerRef.current) {
        persistDraft()
      }
    },
    [persistDraft]
  )

  function discardDraft() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    removeDraft(draftKey)
    setDiscarded(true)
    setDraftChange({ savedAt: null })
    setPickedSession(null)
  }

  // 맡겨 둔 것이 있으면 그 시각을 알려 준다. 저장하는 동안에는 감춘다.
  const draftSavedAt = saving
    ? null
    : draftChange
      ? draftChange.savedAt
      : (restored?.savedAt ?? null)
  const draftStatus = draftSavedAt && (
    <p
      role="status"
      className="flex items-center gap-1.5 text-caption text-muted-foreground"
    >
      <Check
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-4 shrink-0 text-icon-success"
      />
      임시 저장됨 · {kstTime(draftSavedAt)}
    </p>
  )

  const actions = (
    <>
      <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
        취소
      </Link>
      <Button type="submit" disabled={saving} className="flex-1 sm:flex-none">
        {saving ? "저장하는 중" : "저장"}
      </Button>
    </>
  )

  return (
    <form
      ref={formRef}
      action={formAction}
      // 글자를 적거나 도구를 넣고 뺄 때마다 잠시 뒤에 맡기고, 칸을 떠날 때는 바로 맡긴다.
      onInput={scheduleDraft}
      onClick={scheduleDraft}
      onKeyUp={scheduleDraft}
      onBlur={flushDraft}
      className="flex flex-col gap-6"
    >
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
          <div className="hidden items-center gap-3 sm:flex">
            {draftStatus}
            <div className="flex items-center gap-2">{actions}</div>
          </div>
        </div>
      </div>
      {restored && state.status === "idle" && (
        <Alert tone="info">
          <History aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>쓰다 만 내용을 불러왔습니다</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            {restored.savedLabel} 에 이 브라우저에 임시로 저장된 내용입니다.
            저장하면 임시 저장은 지워집니다.
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={discardDraft}
            >
              {editing ? "저장된 기록으로 되돌리기" : "지우고 새로 쓰기"}
            </Button>
          </AlertDescription>
        </Alert>
      )}
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
          <div
            // 맡겨 둔 내용을 불러오거나 지우면 칸을 새로 만들어 그 값으로 채운다.
            key={restored ? "restored" : "initial"}
            className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6"
          >
            <Field>
              <FieldLabel htmlFor="log-session">Session</FieldLabel>
              <NativeSelect
                id="log-session"
                name="sessionId"
                value={sessionId}
                onChange={(event) => setPickedSession(event.target.value)}
                aria-invalid={invalid("sessionId")}
                aria-describedby="log-session-help"
              >
                <option value="">Session 없이 남기기</option>
                {sessions?.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.title}
                  </option>
                ))}
              </NativeSelect>
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
            {projects && (
              <Field>
                <FieldLabel htmlFor="log-project">Project</FieldLabel>
                {/* 이 칸이 화면에 있었다는 표시. 서버는 이 표시가 있을 때만 Project 값을 저장한다. */}
                <input type="hidden" name="projectField" value="1" />
                <NativeSelect
                  id="log-project"
                  name="projectId"
                  defaultValue={values.projectId}
                  aria-invalid={invalid("projectId")}
                  aria-describedby="log-project-help"
                >
                  <option value="">Project 없이 남기기</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </NativeSelect>
                {errors.projectId ? (
                  <FieldError id="log-project-help">
                    {errors.projectId}
                  </FieldError>
                ) : (
                  <FieldDescription id="log-project-help">
                    {projects.length > 0
                      ? "내가 참여하는 Project 에 이 기록을 묶을 수 있습니다."
                      : "참여하는 Project 가 없습니다. Project 에 참여하면 여기에서 고를 수 있습니다."}
                  </FieldDescription>
                )}
              </Field>
            )}
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
                defaultValue={base.tools}
                clubTools={knownTools}
                invalid={invalid("tools")}
                describedBy="log-tools-help"
              />
              {errors.tools ? (
                <FieldError id="log-tools-help">{errors.tools}</FieldError>
              ) : (
                <FieldDescription id="log-tools-help">
                  목록에서 고르거나, 없는 도구는 적고 Enter 나 쉼표로 넣습니다.
                  한글로 적어도 같은 도구로 맞춰 저장합니다.
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
          <div className="flex flex-col gap-2 sm:hidden">
            {draftStatus}
            <div className="flex gap-2">{actions}</div>
          </div>
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
