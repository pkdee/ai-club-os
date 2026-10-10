import Link from "next/link"
import { CircleAlert, ClipboardCheck } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import type { AttendanceMark } from "../status"
import { AttendanceSummary } from "./attendance-summary"

// Session 개요의 옆 칸에 올리는 Attendance 요약. counts 가 null 이면 불러오지 못한 것이다.
export function AttendanceOverviewCard({
  href,
  canManage,
  counts,
}: {
  href: string
  canManage: boolean
  counts: Record<AttendanceMark, number> | null
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <h2 className="text-h4">Attendance</h2>
      {counts ? (
        <AttendanceSummary counts={counts} stacked />
      ) : (
        <p className="text-body-s text-muted-foreground">
          Attendance 를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.
        </p>
      )}
      <Link href={href} className={buttonVariants({ variant: "outline" })}>
        <ClipboardCheck aria-hidden="true" strokeWidth={1.5} />
        {canManage ? "Attendance 기록" : "Attendance 보기"}
      </Link>
    </section>
  )
}

export function AttendanceUnavailable({ href }: { href: string }) {
  return (
    <div className="rounded-xl border bg-card">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <CircleAlert strokeWidth={1.5} />
          </EmptyMedia>
          <EmptyTitle>Attendance 를 불러오지 못했습니다</EmptyTitle>
          <EmptyDescription>
            연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해
            주세요.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href={href} className={buttonVariants({ variant: "outline" })}>
            다시 시도
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}
