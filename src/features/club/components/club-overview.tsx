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

export type ClubOverviewStats = {
  // 값이 null 이면 그 수를 불러오지 못한 것이라 칸을 보여 주지 않는다.
  sessions: { done: number; upcoming: number } | null
  // 최근 회차의 평균 출석. 불러오지 못했으면 null, 아직 셀 기록이 없으면 "none" 이다.
  attendance: { percent: number; sessionCount: number } | "none" | null
  // thisWeek 는 이번 주에 남긴 수다. 세지 못했으면 null 이다.
  logs: { total: number; thisWeek: number | null } | null
}

// actions 에는 다른 기능이 개요에 올리는 버튼을, children 과 aside 에는 본문과 옆 칸에 올리는 영역을 넣는다.
// 좁은 화면에서는 옆 칸이 본문의 첫 영역 바로 아래로 내려온다.
export function ClubOverview({
  club,
  stats,
  actions,
  lead,
  aside,
  children,
}: {
  club: MyClub
  stats: ClubOverviewStats
  actions?: React.ReactNode
  // 본문 맨 위에 놓는 영역. 오늘 Session 안내가 들어간다.
  lead?: React.ReactNode
  aside?: React.ReactNode
  children?: React.ReactNode
}) {
  const { sessions, attendance, logs } = stats

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
        {attendance &&
          (attendance === "none" ? (
            <Stat
              label="평균 출석"
              value="-"
              caption="기록된 Attendance 가 없습니다"
            />
          ) : (
            <Stat
              label="평균 출석"
              value={`${attendance.percent}%`}
              caption={`지난 ${attendance.sessionCount}회 기준`}
            />
          ))}
        {logs && (
          <Stat
            label="AI Log"
            value={`${logs.total}개`}
            caption={
              logs.thisWeek === null
                ? "Club 전체 기록"
                : `이번 주 ${logs.thisWeek}개`
            }
          />
        )}
      </dl>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {lead && <div className="min-w-0 xl:col-start-1">{lead}</div>}
        {aside && (
          <aside className="flex min-w-0 flex-col gap-6 xl:col-start-2 xl:row-span-2 xl:row-start-1">
            {aside}
          </aside>
        )}
        <div className="flex min-w-0 flex-col gap-6 xl:col-start-1">
          {children}
        </div>
      </div>
    </>
  )
}
