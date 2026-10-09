import Link from "next/link"
import { CircleAlert, Shield } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { TopBar } from "@/features/auth/components/top-bar"
import type { CurrentUser } from "@/features/auth/session"

const MESSAGES = {
  "no-access": {
    icon: Shield,
    title: "이 Club 을 볼 수 없습니다",
    description:
      "내가 속한 Club 의 기록만 볼 수 있습니다. 주소가 맞는지 확인해 주세요.",
  },
  error: {
    icon: CircleAlert,
    title: "Club 을 불러오지 못했습니다",
    description:
      "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.",
  },
}

// 권한이 없는 경우와 불러오지 못한 경우를 나눠서 알린다.
export function ClubUnavailable({
  user,
  reason,
}: {
  user: CurrentUser
  reason: keyof typeof MESSAGES
}) {
  const { icon: Icon, title, description } = MESSAGES[reason]

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <TopBar user={user} />
      <main className="mx-auto flex w-full max-w-[1120px] flex-col px-4 py-12 sm:px-8">
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Icon strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>{title}</EmptyTitle>
              <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                내 Club 으로 돌아가기
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      </main>
    </div>
  )
}
