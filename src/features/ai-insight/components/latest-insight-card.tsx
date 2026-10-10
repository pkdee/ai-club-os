import Link from "next/link"
import { Sparkles } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

// Club 개요의 옆 칸에 놓는, 가장 최근에 공개된 AI Insight 의 요약.
// title 은 회차의 제목이나 기간의 이름이고 href 는 전체 내용으로 가는 주소다.
export function LatestInsightCard({
  title,
  overview,
  href,
}: {
  title: string
  overview: string
  href: string
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <h2 className="flex items-center gap-2 text-h4">
        <Sparkles
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-5 shrink-0 text-icon-brand"
        />
        최근 AI Insight
      </h2>
      <div className="flex flex-col gap-1">
        <p className="text-label-m">{title}</p>
        <p className="line-clamp-4 text-body-s whitespace-pre-wrap text-muted-foreground">
          {overview || "요약이 없습니다. 열어서 항목을 확인해 주세요."}
        </p>
      </div>
      <Link href={href} className={buttonVariants({ variant: "outline" })}>
        전체 보기
      </Link>
    </section>
  )
}
