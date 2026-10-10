import Link from "next/link"

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-body-s text-muted-foreground">{label}</dt>
      <dd className="text-label-m">{children}</dd>
    </div>
  )
}

// Club 개요의 옆 칸에 놓는 내 활동 요약. 값이 null 이면 불러오지 못했거나 아직 없는 것이다.
export function MyRecordCard({
  monthLogCount,
  attendance,
  lastLog,
}: {
  // 이번 달에 내가 남긴 AI Log 수.
  monthLogCount: number | null
  // attended 는 출석과 지각, counted 는 거기에 결석을 더한 수다.
  attendance: { attended: number; counted: number } | null
  // 내가 마지막으로 남긴 AI Log. label 은 보여 줄 날짜다.
  lastLog: { label: string; href: string } | null
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <h2 className="text-h4">내 기록</h2>
      <dl className="flex flex-col gap-2">
        <Row label="이번 달 AI Log">
          {monthLogCount === null ? "-" : `${monthLogCount}개`}
        </Row>
        <Row label="출석">
          {attendance && attendance.counted > 0
            ? `${attendance.attended} / ${attendance.counted}회`
            : "-"}
        </Row>
        <Row label="마지막 기록">
          {lastLog ? (
            <Link
              href={lastLog.href}
              className="rounded-sm transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"
            >
              {lastLog.label}
            </Link>
          ) : (
            "-"
          )}
        </Row>
      </dl>
    </section>
  )
}
