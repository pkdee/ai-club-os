"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CircleAlert, RefreshCw } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export type ErrorStateProps = {
  error: Error & { digest?: string }
  retry: () => void
}

// 예상하지 못한 오류가 났을 때 보여 주는 안내. Figma 의 "오류" 화면을 옮긴 것이다.
// 자세한 내용은 서버 기록에만 남는다. 화면에는 기록을 찾을 때 쓰는 번호만 보여 준다.
export function ErrorState({ error, retry }: ErrorStateProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="rounded-xl border bg-card">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <CircleAlert strokeWidth={1.5} />
          </EmptyMedia>
          <EmptyTitle>화면을 보여 주지 못했습니다</EmptyTitle>
          <EmptyDescription>
            예상하지 못한 문제가 생겼습니다. 다시 시도해 주세요. 계속되면 잠시
            뒤에 다시 열어 주세요.
            {error.digest && ` 문의할 때는 번호 ${error.digest} 를 알려 주세요.`}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => retry()}>
              <RefreshCw aria-hidden="true" strokeWidth={1.5} />
              다시 시도
            </Button>
            <Link href="/" className={buttonVariants({ variant: "ghost" })}>
              내 Club 으로
            </Link>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
