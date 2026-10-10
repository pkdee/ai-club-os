import Link from "next/link"
import { FileText, SquarePen } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

// Session 개요의 옆 칸에 놓는 내 AI Log 안내.
// logIds 는 이 회차에 내가 남긴 기록의 식별자이고 최신 것이 앞에 온다.
export function MySessionLogCard({
  clubId,
  sessionId,
  logIds,
}: {
  clubId: string
  sessionId: string
  logIds: string[]
}) {
  const written = logIds.length > 0

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <h2 className="text-h4">내 AI Log</h2>
      <p className="text-body-s text-muted-foreground">
        {written
          ? logIds.length > 1
            ? `이 회차의 AI Log 를 ${logIds.length}개 남겼습니다. 가장 최근 기록을 다시 열어 고칠 수 있습니다.`
            : "이 회차의 AI Log 를 이미 남겼습니다. 다시 열어 고칠 수 있습니다."
          : "아직 이 회차의 AI Log 를 남기지 않았습니다. 해 본 것을 짧게 남겨 보세요."}
      </p>
      {written ? (
        <Link
          href={`/clubs/${clubId}/logs/${logIds[0]}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <FileText aria-hidden="true" strokeWidth={1.5} />
          내 기록 열기
        </Link>
      ) : (
        <Link
          href={`/clubs/${clubId}/logs/new?session=${sessionId}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <SquarePen aria-hidden="true" strokeWidth={1.5} />
          AI Log 쓰기
        </Link>
      )}
    </section>
  )
}
