import Link from "next/link"
import { SquarePen } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

// AI Log 쓰기 화면으로 가는 버튼. sessionId 나 projectId 를 주면 그 회차나 Project 가 미리 골라진다.
export function WriteLogLink({
  clubId,
  sessionId,
  projectId,
}: {
  clubId: string
  sessionId?: string
  projectId?: string
}) {
  const href = sessionId
    ? `/clubs/${clubId}/logs/new?session=${sessionId}`
    : projectId
      ? `/clubs/${clubId}/logs/new?project=${projectId}`
      : `/clubs/${clubId}/logs/new`

  return (
    <Link href={href} className={buttonVariants({ className: "self-start" })}>
      <SquarePen aria-hidden="true" strokeWidth={1.5} />
      AI Log 쓰기
    </Link>
  )
}
