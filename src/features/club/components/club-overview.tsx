import { Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import type { MyClub } from "../queries"

export function ClubOverview({ club }: { club: MyClub }) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">{club.name}</h1>
        {club.description && (
          <p className="text-muted-foreground">{club.description}</p>
        )}
      </div>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-5">
          <dt className="text-body-s text-muted-foreground">Member</dt>
          <dd className="text-h1">{club.memberCount}명</dd>
          <dd className="text-caption text-tertiary">
            운영자 {club.adminCount} · 구성원{" "}
            {club.memberCount - club.adminCount}
          </dd>
        </div>
      </dl>
      <Alert tone="info">
        <Info aria-hidden="true" strokeWidth={1.5} />
        <AlertTitle>Session 과 AI Log 는 준비 중입니다</AlertTitle>
        <AlertDescription>
          회차를 만들고 기록을 남기는 기능은 다음 단계에서 추가합니다. 추가되면
          이 화면에서 오늘의 Session 과 최근 AI Log 를 볼 수 있습니다.
        </AlertDescription>
      </Alert>
    </>
  )
}
