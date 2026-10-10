"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react"
import { Check, CircleAlert, Copy, RefreshCw, UserPlus } from "lucide-react"

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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { renewClubInvite } from "../actions"

export type InviteView = {
  token: string
  // 예: 10월 17일 14:30
  expiresLabel: string
  expired: boolean
}

const noop = () => () => {}

// 링크의 앞부분은 지금 열려 있는 주소에서 가져온다. 로컬과 배포 환경에서 같은 코드가 동작한다.
function useOrigin() {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => ""
  )
}

// Dialog 가 닫히면 이 컴포넌트가 사라지므로, 다시 열 때 복사 표시와 오류가 처음 상태로 돌아간다.
function InviteBody({
  clubId,
  invite,
  unavailable,
}: {
  clubId: string
  invite: InviteView | null
  unavailable: boolean
}) {
  const origin = useOrigin()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<{
    title: string
    message: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const usable = invite !== null && !invite.expired
  const link = usable ? `${origin}/join/${invite.token}` : ""

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  function renew() {
    setError(null)
    setCopied(false)
    startTransition(async () => {
      const result = await renewClubInvite(clubId)
      if (!result.ok) {
        setError({
          title: "초대 링크를 만들지 못했습니다",
          message: result.message,
        })
      }
    })
  }

  async function copy() {
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
    <>
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>{error.title}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {unavailable ? (
        <p className="text-muted-foreground">
          초대 링크를 불러오지 못했습니다. 창을 닫고 잠시 뒤 다시 열어 주세요.
        </p>
      ) : usable ? (
        <>
          <Field>
            <FieldLabel htmlFor="invite-link">초대 링크</FieldLabel>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                id="invite-link"
                readOnly
                value={link}
                aria-describedby="invite-link-help"
                onFocus={(event) => event.target.select()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={copy}
                className="shrink-0"
              >
                {copied ? (
                  <Check aria-hidden="true" strokeWidth={1.5} />
                ) : (
                  <Copy aria-hidden="true" strokeWidth={1.5} />
                )}
                {copied ? "복사됨" : "복사"}
              </Button>
            </div>
            <FieldDescription id="invite-link-help">
              {invite.expiresLabel} 까지 쓸 수 있습니다. 참여한 사람은 구성원이
              됩니다.
            </FieldDescription>
            <span role="status" className="sr-only">
              {copied ? "초대 링크를 복사했습니다." : ""}
            </span>
          </Field>
          <div className="flex flex-col gap-2 border-t pt-4">
            <p className="text-body-s text-muted-foreground">
              링크가 엉뚱한 곳에 퍼졌다면 새로 만드세요. 새로 만들면 지금
              링크는 바로 쓸 수 없게 됩니다.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={renew}
              className="self-start"
            >
              <RefreshCw aria-hidden="true" strokeWidth={1.5} />
              {pending ? "만드는 중" : "새 링크 만들기"}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground">
            {invite
              ? `초대 링크가 ${invite.expiresLabel} 에 만료됐습니다. 새로 만들어 주세요.`
              : "아직 초대 링크가 없습니다."}{" "}
            링크는 만든 때부터 7일 동안 쓸 수 있습니다.
          </p>
          <Button
            type="button"
            disabled={pending}
            onClick={renew}
            className="self-start"
          >
            {pending ? "만드는 중" : "초대 링크 만들기"}
          </Button>
        </div>
      )}
    </>
  )
}

// invite 가 null 이면 아직 만든 적이 없는 것이고, unavailable 이면 불러오지 못한 것이다.
export function InviteDialog({
  clubId,
  invite,
  unavailable,
}: {
  clubId: string
  invite: InviteView | null
  unavailable: boolean
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button className="self-start" />}>
        <UserPlus aria-hidden="true" strokeWidth={1.5} />
        Member 초대
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Member 초대</DialogTitle>
          <DialogDescription>
            링크를 받은 사람이 Google 계정으로 로그인하면 이 Club 에 참여합니다.
          </DialogDescription>
        </DialogHeader>
        <InviteBody clubId={clubId} invite={invite} unavailable={unavailable} />
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            닫기
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
