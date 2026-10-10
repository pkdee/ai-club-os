"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react"
import {
  Check,
  CircleAlert,
  Copy,
  ExternalLink,
  Presentation as PresentationIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { CheckboxField } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  publishPresentation,
  setPresentationNames,
  unpublishPresentation,
  type PresentationActionResult,
  type PresentationTarget,
} from "../actions"
import type { Presentation } from "../queries"
import { presentationPath } from "../token"

const noop = () => () => {}

// 링크의 앞부분은 지금 열려 있는 주소에서 가져온다. 로컬과 배포 환경에서 같은 코드가 동작한다.
function useOrigin() {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => ""
  )
}

const COPY = {
  project: {
    title: "발표",
    intro:
      "이 Project 를 Club 밖의 사람에게 보여 줄 수 있습니다. 링크를 아는 사람만 로그인 없이 봅니다.",
    names: "참여자와 기록 작성자의 이름 보이기",
  },
  club: {
    title: "Club 발표",
    intro:
      "이 Club 의 활동을 Club 밖의 사람에게 보여 줄 수 있습니다. 링크를 아는 사람만 로그인 없이 봅니다.",
    names: "Member 의 이름 보이기",
  },
}
const NAMES_HELP =
  "꺼 두면 사람 수만 보입니다. 이메일과 사진은 어느 경우에도 보이지 않습니다."

// 발표를 공개하고 거두는 영역. Project 화면의 옆 칸과 Club 설정에 놓는다.
// presentation 이 null 이면 아직 공개하지 않은 것이다. canManage 는 공개하고 거둘 수 있는 사람이라는 뜻이고,
// 실제 판단은 데이터베이스가 한다. notes 는 공개하면 무엇이 나가는지 알리는 글이다.
// 공개하지 않았고 공개할 수도 없는 사람에게는 아무것도 그리지 않는다.
export function PresentationCard({
  clubId,
  target,
  presentation,
  canManage,
  notes,
  className,
}: {
  clubId: string
  target: PresentationTarget
  presentation: Presentation | null
  canManage: boolean
  notes: string[]
  className?: string
}) {
  const origin = useOrigin()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<"publish" | "unpublish" | null>(null)
  const [showNames, setShowNames] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null
  )
  const [pending, startTransition] = useTransition()
  const copy = COPY[target.scope]

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  if (!presentation && !canManage) {
    return null
  }

  function run(
    title: string,
    action: () => Promise<PresentationActionResult>
  ) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        setError({ title, message: result.message })
      }
      setDialog(null)
    })
  }

  const path = presentation ? presentationPath(presentation.token) : ""
  const link = `${origin}${path}`

  async function copyLink() {
    setError(null)
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      // 브라우저가 복사를 막으면 링크를 선택해 두고 직접 복사하게 한다.
      inputRef.current?.select()
      setError({
        title: "링크를 복사하지 못했습니다",
        message:
          "브라우저가 자동 복사를 막았습니다. 링크를 선택해 두었으니 직접 복사해 주세요.",
      })
    }
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-h4">
          <PresentationIcon
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-5 shrink-0 text-icon-brand"
          />
          {copy.title}
        </h2>
        {presentation && <Badge tone="success">공개 중</Badge>}
      </div>
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {presentation ? (
        <>
          <p className="text-body-s text-muted-foreground">
            링크를 아는 사람은 로그인 없이 볼 수 있습니다. 검색에는 잡히지 않게
            해 두었습니다.
          </p>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              readOnly
              value={link}
              aria-label={`${copy.title} 링크`}
              onFocus={(event) => event.target.select()}
              className="min-w-0"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={copied ? "링크를 복사했습니다" : "링크 복사"}
              onClick={copyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check aria-hidden="true" strokeWidth={1.5} />
              ) : (
                <Copy aria-hidden="true" strokeWidth={1.5} />
              )}
            </Button>
          </div>
          <span role="status" className="sr-only">
            {copied ? "링크를 복사했습니다." : ""}
          </span>
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink aria-hidden="true" strokeWidth={1.5} />
            발표 열기
          </a>
          {canManage && (
            <div className="flex flex-col gap-3 border-t pt-3">
              <CheckboxField
                checked={presentation.showNames}
                disabled={pending}
                onChange={(event) => {
                  const next = event.target.checked
                  run("이름 표시를 바꾸지 못했습니다", () =>
                    setPresentationNames(clubId, presentation.id, next)
                  )
                }}
                label={copy.names}
                description={NAMES_HELP}
              />
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setDialog("unpublish")}
                className="self-start text-danger"
              >
                공개 거두기
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-body-s text-muted-foreground">{copy.intro}</p>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setShowNames(false)
              setDialog("publish")
            }}
          >
            발표 공개
          </Button>
        </>
      )}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setDialog(null)
          }
        }}
      >
        <DialogContent>
          {dialog === "publish" && (
            <>
              <DialogHeader>
                <DialogTitle>발표를 공개할까요?</DialogTitle>
                <DialogDescription
                  render={<div />}
                  className="flex flex-col gap-2"
                >
                  <p>
                    공개하면 링크가 만들어지고, 그 링크를 아는 사람은 로그인
                    없이 볼 수 있습니다. 검색에는 잡히지 않게 해 둡니다.
                  </p>
                  <ul className="flex list-disc flex-col gap-1 pl-5">
                    {notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                  <p>
                    언제든 공개를 거둘 수 있고, 거두면 링크는 바로 쓸 수
                    없습니다.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <CheckboxField
                checked={showNames}
                disabled={pending}
                onChange={(event) => setShowNames(event.target.checked)}
                label={copy.names}
                description={NAMES_HELP}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setDialog(null)}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run("발표를 공개하지 못했습니다", () =>
                      publishPresentation(clubId, target, showNames)
                    )
                  }
                >
                  {pending ? "공개하는 중" : "공개"}
                </Button>
              </DialogFooter>
            </>
          )}
          {dialog === "unpublish" && presentation && (
            <>
              <DialogHeader>
                <DialogTitle>발표의 공개를 거둘까요?</DialogTitle>
                <DialogDescription>
                  지금 링크는 바로 쓸 수 없게 됩니다. 이미 링크를 받은 사람도 더
                  볼 수 없습니다. 다시 공개하면 새 링크가 만들어집니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setDialog(null)}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={() =>
                    run("공개를 거두지 못했습니다", () =>
                      unpublishPresentation(clubId, presentation.id)
                    )
                  }
                >
                  {pending ? "거두는 중" : "공개 거두기"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
