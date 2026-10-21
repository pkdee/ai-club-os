import { parseAgenda } from "../agenda"
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
  const agenda = parseAgenda(session.agenda ?? "")

  return (
    // 옆 칸이 더 길 때 남는 높이를 둘째 줄이 받게 한다. 그러지 않으면 소개와 그 아래 사이가 벌어진다.
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:grid-rows-[auto_1fr]">
      <section className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-6 xl:col-start-1">
        <h2 className="text-h4">목표와 소개</h2>
        {session.description ? (
          <p className="text-body-l whitespace-pre-wrap">
            {session.description}
          </p>
        ) : (
          <p className="text-muted-foreground">아직 적은 내용이 없습니다.</p>
        )}
        {agenda.length > 0 && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <h3 className="sr-only">시간표</h3>
            <ol className="flex flex-col gap-2">
              {agenda.map((item, index) => (
                <li key={index} className="flex gap-4">
                  <span className="w-12 shrink-0 text-muted-foreground tabular-nums">
                    {item.time ?? ""}
                  </span>
                  <span className="min-w-0 break-words">{item.title}</span>
                </li>
              ))}
            </ol>
          </div>
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
