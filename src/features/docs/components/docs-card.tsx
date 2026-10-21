import Link from "next/link"
import { BookOpen } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

import { docsHref } from "../catalog"

// Club 개요의 옆 칸에 놓는 Docs 로 가는 길. 좁은 화면의 아래쪽 메뉴에는 Docs 를 둘 자리가 없어서 둔다.
// 넓은 화면에서는 왼쪽 메뉴에 Docs 가 있으므로 그리지 않는다.
export function DocsCard({ clubId }: { clubId: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 lg:hidden">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">Docs</h2>
        <p className="text-body-s text-muted-foreground">
          AI Club OS 를 쓰는 법을 정리한 안내 문서입니다.
        </p>
      </div>
      <Link
        href={docsHref(clubId)}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <BookOpen aria-hidden="true" strokeWidth={1.5} />
        Docs 보기
      </Link>
    </section>
  )
}
