import Link from "next/link"
import { ArrowRight, CircleAlert, CircleCheck, MailOpen } from "lucide-react"

import { Logo } from "@/components/logo"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

import { signInWithGoogle } from "../actions"
import {
  loginErrorMessage,
  type LoginError,
  type LoginNotice,
} from "../login-error"
import { GoogleButton } from "./google-button"

// 제품 흐름 Activity -> Knowledge -> Intelligence -> Action. AI Log 가 핵심이라 지식 단계를 강조한다.
const STAGES = [
  { name: "ACTIVITY", label: "활동", detail: "Session, Attendance" },
  { name: "KNOWLEDGE", label: "지식", detail: "AI Log", core: true },
  { name: "INTELLIGENCE", label: "이해", detail: "AI Insight" },
  { name: "ACTION", label: "행동", detail: "Project, 발표" },
]

function BrandPanel() {
  return (
    <aside className="hidden w-[760px] shrink-0 flex-col justify-between border-r bg-app p-16 xl:flex">
      <Logo />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <p className="text-display-l">Record. Understand. Build.</p>
          <p className="text-body-l text-muted-foreground">
            AI 동아리의 학습, 실험, 기록을 한 흐름으로 이어 주는 작업
            공간입니다. 활동을 쉽게 남기고, 기록에서 의미를 찾고, 다음 행동으로
            이어 갑니다.
          </p>
        </div>
        <ol className="flex items-stretch gap-2">
          {STAGES.map((stage, index) => (
            <li key={stage.name} className="flex items-center gap-2">
              {index > 0 && (
                <ArrowRight
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 text-icon-subtle"
                />
              )}
              <div className="flex w-32 flex-col gap-1 self-stretch rounded-lg border bg-card p-4">
                <span
                  className={cn(
                    "text-overline",
                    stage.core ? "text-brand" : "text-tertiary"
                  )}
                >
                  {stage.name}
                </span>
                <span className="text-h4">{stage.label}</span>
                <span className="text-caption text-muted-foreground">
                  {stage.detail}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <p className="text-caption text-tertiary">
        기록에서 AI Insight, Project, 발표까지 한 흐름으로 이어집니다.
      </p>
    </aside>
  )
}

// returnPath 는 로그인한 뒤 돌아갈 경로다. 없으면 처음 화면으로 간다.
// notice 는 계정을 지운 뒤에 돌아왔을 때처럼 한 번 알려 줄 것이 있을 때 온다.
export function LoginScreen({
  error,
  notice = null,
  returnPath,
}: {
  error: LoginError | null
  notice?: LoginNotice | null
  returnPath: string | null
}) {
  const message = error ? loginErrorMessage(error) : null
  const invited = returnPath?.startsWith("/join/") ?? false

  return (
    <div className="flex min-h-dvh flex-1">
      <BrandPanel />
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[360px] flex-col gap-6">
          <Logo className="xl:hidden" />
          <div className="flex flex-col gap-2">
            <h1 className="text-h1">로그인</h1>
            <p className="text-muted-foreground">
              Google 계정으로 바로 시작합니다. 따로 가입할 필요가 없습니다.
            </p>
          </div>
          {message && (
            <Alert tone="danger">
              <CircleAlert aria-hidden="true" strokeWidth={1.5} />
              <AlertTitle>{message.title}</AlertTitle>
              <AlertDescription>{message.description}</AlertDescription>
            </Alert>
          )}
          {notice === "account_deleted" && !message && (
            <Alert tone="success">
              <CircleCheck aria-hidden="true" strokeWidth={1.5} />
              <AlertTitle>계정을 지웠습니다</AlertTitle>
              <AlertDescription>
                같은 Google 계정으로 다시 로그인하면 새 계정으로 시작합니다.
              </AlertDescription>
            </Alert>
          )}
          {invited && !message && (
            <Alert tone="info">
              <MailOpen aria-hidden="true" strokeWidth={1.5} />
              <AlertTitle>Club 초대를 받았습니다</AlertTitle>
              <AlertDescription>
                로그인하면 초대받은 Club 을 확인하고 참여할 수 있습니다.
              </AlertDescription>
            </Alert>
          )}
          <form action={signInWithGoogle}>
            {returnPath && <input type="hidden" name="next" value={returnPath} />}
            <GoogleButton />
          </form>
          <p className="text-caption text-tertiary">
            로그인하면 내가 속한 Club 의 기록만 볼 수 있습니다. 다른 Club 의
            데이터에는 접근할 수 없습니다. 무엇을 모으고 누가 보는지는{" "}
            <Link
              href="/privacy"
              className="rounded-sm text-muted-foreground underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              개인 정보 안내
            </Link>
            에 적어 두었습니다.
          </p>
        </div>
      </main>
    </div>
  )
}
