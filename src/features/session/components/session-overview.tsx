import { Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import type { Session } from "../queries"

// children 에는 다른 기능이 이 회차에 올리는 영역을 넣는다.
export function SessionOverview({
  session,
  children,
}: {
  session: Session
  children?: React.ReactNode
}) {
  return (
    <>
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-6">
        <h2 className="text-h4">목표와 소개</h2>
        {session.description ? (
          <p className="text-body-l whitespace-pre-wrap">
            {session.description}
          </p>
        ) : (
          <p className="text-muted-foreground">아직 적은 내용이 없습니다.</p>
        )}
      </section>
      {children}
      <Alert tone="info">
        <Info aria-hidden="true" strokeWidth={1.5} />
        <AlertTitle>AI Log 는 준비 중입니다</AlertTitle>
        <AlertDescription>
          이 회차의 AI Log 를 남기는 기능은 다음 단계에서 이 화면에 추가합니다.
        </AlertDescription>
      </Alert>
    </>
  )
}
