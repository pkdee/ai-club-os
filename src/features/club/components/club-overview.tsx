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

// sessions 나 logCount 가 null 이면 그 수를 불러오지 못한 것이다.
// actions 와 children 에는 다른 기능이 개요에 올리는 버튼과 영역을 넣는다.
export function ClubOverview({
  club,
  sessions,
  logCount,
  actions,
  children,
}: {
  club: MyClub
  sessions: { done: number; upcoming: number } | null
  logCount: number | null
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1">{club.name}</h1>
          {club.description && (
            <p className="text-muted-foreground">{club.description}</p>
          )}
        </div>
        {actions}
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
        {logCount !== null && (
          <Stat label="AI Log" value={`${logCount}개`} caption="Club 전체 기록" />
        )}
      </dl>
      {children}
    </>
  )
}
