import { Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import type { MyClub } from "../queries"

function Stat({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-5">
      <dt className="text-body-s text-muted-foreground">{label}</dt>
      <dd className="text-h1">{value}</dd>
      <dd className="text-caption text-tertiary">{caption}</dd>
    </div>
  )
}

// sessions 가 null 이면 Session 수를 불러오지 못한 것이다.
// children 에는 다른 기능이 개요에 올리는 영역을 넣는다.
export function ClubOverview({
  club,
  sessions,
  children,
}: {
  club: MyClub
  sessions: { done: number; upcoming: number } | null
  children?: React.ReactNode
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">{club.name}</h1>
        {club.description && (
          <p className="text-muted-foreground">{club.description}</p>
        )}
      </div>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Member"
          value={`${club.memberCount}명`}
          caption={`운영자 ${club.adminCount} · 구성원 ${club.memberCount - club.adminCount}`}
        />
        {sessions && (
          <Stat
            label="진행한 Session"
            value={`${sessions.done}회`}
            caption={`예정 ${sessions.upcoming}회`}
          />
        )}
      </dl>
      {children}
      <Alert tone="info">
        <Info aria-hidden="true" strokeWidth={1.5} />
        <AlertTitle>AI Log 는 준비 중입니다</AlertTitle>
        <AlertDescription>
          기록을 남기는 기능은 다음 단계에서 추가합니다. 추가되면 이 화면에서
          최근 AI Log 를 볼 수 있습니다.
        </AlertDescription>
      </Alert>
    </>
  )
}
