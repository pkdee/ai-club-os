import Link from "next/link"
import { Ban, CircleAlert, LinkIcon, Users } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { CurrentUser } from "@/features/auth/session"

import type { InvitePreviewResult } from "../invite"
import { JoinForm } from "./join-form"

// 초대 링크를 열었을 때 보이는 화면. 참여는 버튼을 눌러야 이루어진다.
export function JoinScreen({
  token,
  result,
  user,
}: {
  token: string
  result: InvitePreviewResult
  user: CurrentUser
}) {
  return (
    <main className="mx-auto flex w-full max-w-[520px] flex-col gap-6 px-4 py-12 sm:px-8">
      {result.status === "ok" && result.preview.blocked ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Ban strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>이 Club 에는 다시 참여할 수 없습니다</EmptyTitle>
              <EmptyDescription>
                {result.preview.clubName} 의 운영자가 다시 들어오지 못하게 해
                두었습니다. 참여하려면 그 Club 의 운영자에게 풀어 달라고 요청해
                주세요.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                내 Club 으로
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      ) : result.status === "ok" ? (
        <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <p className="text-overline text-brand">CLUB 초대</p>
            <h1 className="text-h1">{result.preview.clubName}</h1>
            {result.preview.clubDescription && (
              <p className="text-muted-foreground">
                {result.preview.clubDescription}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-body-s text-muted-foreground">
              <Users
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-4 shrink-0 text-icon-subtle"
              />
              Member {result.preview.memberCount}명
            </p>
          </div>
          <div className="flex flex-col gap-2 border-t pt-5 text-body-s text-muted-foreground">
            <p>
              <span className="text-label-m text-foreground">{user.name}</span>
              {user.email && ` (${user.email})`} 계정으로 참여합니다.
            </p>
            <p>
              참여하면 구성원이 되어 이 Club 의 Session 과 AI Log 를 볼 수
              있습니다. 내 이름과 이메일은 이 Club 의 Member 에게 보입니다.
            </p>
          </div>
          <JoinForm token={token} />
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                {result.status === "invalid" ? (
                  <LinkIcon strokeWidth={1.5} />
                ) : (
                  <CircleAlert strokeWidth={1.5} />
                )}
              </EmptyMedia>
              <EmptyTitle>
                {result.status === "invalid"
                  ? "쓸 수 없는 초대 링크입니다"
                  : "초대 정보를 불러오지 못했습니다"}
              </EmptyTitle>
              <EmptyDescription>
                {result.status === "invalid"
                  ? "링크가 만료됐거나 운영자가 새 링크를 만들었습니다. 초대한 사람에게 새 링크를 받아 주세요."
                  : "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 이 링크를 다시 열어 주세요."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/" className={buttonVariants({ variant: "outline" })}>
                내 Club 으로
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      )}
    </main>
  )
}
