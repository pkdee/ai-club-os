import type { Session } from "../queries"

// children 과 aside 에는 다른 기능이 이 회차의 본문과 옆 칸에 올리는 영역을 넣는다.
// 좁은 화면에서는 옆 칸이 소개 바로 아래로 내려온다.
export function SessionOverview({
  session,
  aside,
  children,
}: {
  session: Session
  aside?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-6 xl:col-start-1">
        <h2 className="text-h4">목표와 소개</h2>
        {session.description ? (
          <p className="text-body-l whitespace-pre-wrap">
            {session.description}
          </p>
        ) : (
          <p className="text-muted-foreground">아직 적은 내용이 없습니다.</p>
        )}
      </section>
      {aside && (
        <aside className="flex min-w-0 flex-col gap-6 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          {aside}
        </aside>
      )}
      <div className="flex min-w-0 flex-col gap-6 xl:col-start-1">
        {children}
      </div>
    </div>
  )
}
