import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

import type { AiLogListResult } from "../queries"
import { AiLogCardList } from "./ai-log-card"

// 다른 화면에 올리는 AI Log 묶음. Club 개요의 최근 기록과 Session 개요의 이 회차 기록이 쓴다.
// 최신순으로 limit 개까지 보여 준다.
export function AiLogSection({
  title,
  href,
  result,
  limit,
  emptyText,
  now,
}: {
  title: string
  href: string
  result: AiLogListResult
  limit: number
  emptyText: string
  now: Date
}) {
  const logs = result.status === "ok" ? result.logs.slice(0, limit) : []

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-h3">{title}</h2>
        <Link
          href={href}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          모두 보기
        </Link>
      </div>
      {logs.length > 0 ? (
        <AiLogCardList logs={logs} now={now} />
      ) : (
        <p className="rounded-xl border bg-card p-5 text-muted-foreground">
          {result.status === "error"
            ? "AI Log 를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요."
            : emptyText}
        </p>
      )}
    </section>
  )
}
