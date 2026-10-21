import Link from "next/link"
import { ArrowLeft, ChevronRight, TriangleAlert } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import type { CurrentUser } from "@/features/auth/session"
import { cn } from "@/lib/utils"

import { accountDeleteConfirmValue, type AccountClub, type AccountDeletionPlan } from "../plan"
import type { AccountContentCounts } from "../queries"
import { DeleteAccountDialog } from "./delete-account-dialog"

// tone 이 danger 이면 되돌릴 수 없는 일을 다루는 칸이라 테두리, 아이콘, 제목을 붉게 둔다.
function Card({
  title,
  description,
  tone = "default",
  children,
}: {
  title: string
  description?: string
  tone?: "default" | "danger"
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-6",
        tone === "danger" && "border-danger-border"
      )}
    >
      <div className="flex flex-col gap-1">
        <h2
          className={cn(
            "flex items-center gap-2 text-h4",
            tone === "danger" && "text-danger"
          )}
        >
          {tone === "danger" && (
            <TriangleAlert
              aria-hidden="true"
              strokeWidth={1.5}
              className="size-5 shrink-0 text-icon-danger"
            />
          )}
          {title}
        </h2>
        {description && (
          <p className="text-body-s text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

// 내가 남긴 것이 얼마나 되는지 한 문장으로 적는다. 세지 못한 것은 빼고 적는다.
export function accountContentText(counts: AccountContentCounts) {
  const parts = [
    counts.logs === null ? null : `AI Log ${counts.logs}개`,
    counts.retrospectives === null ? null : `회고 ${counts.retrospectives}개`,
    counts.comments === null ? null : `댓글 ${counts.comments}개`,
  ].filter(Boolean)

  return parts.length > 0
    ? `지금 내가 쓴 것은 ${parts.join(", ")}입니다.`
    : "내가 쓴 것의 수를 세지 못했습니다."
}

function ClubNames({ clubs }: { clubs: AccountClub[] }) {
  return <>{clubs.map((club) => `"${club.name}"`).join(", ")}</>
}

// 내 계정 화면. 내 정보, 개인 정보 안내, 계정 지우기를 차례로 둔다.
// 화면 모드는 상단 막대의 오른쪽에서 고른다.
// plan 이 null 이면 내 Club 을 읽지 못한 것이다.
export function AccountScreen({
  user,
  counts,
  plan,
}: {
  user: CurrentUser
  counts: AccountContentCounts
  plan: AccountDeletionPlan<AccountClub> | null
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="flex w-fit items-center gap-1.5 rounded-sm text-body-s text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden="true" strokeWidth={1.5} className="size-4" />
          내 Club 으로
        </Link>
        <h1 className="text-h1">내 계정</h1>
      </div>
      <Card
        title="내 정보"
        description="이름, 이메일, 사진은 Google 계정에서 가져옵니다. Club 안에서 보이는 이름은 그 Club 의 Member 화면에서 따로 고칩니다."
      >
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatarUrl} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label-m">{user.name}</span>
            {user.email && (
              <span className="truncate text-body-s text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
        </div>
      </Card>
      <Card
        title="개인 정보"
        description="무엇을 모으고, 누가 보고, 얼마나 두는지 적어 두었습니다."
      >
        <Link
          href="/privacy"
          className="flex w-fit items-center gap-1 rounded-sm text-label-m text-brand transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          개인 정보 안내 보기
          <ChevronRight aria-hidden="true" strokeWidth={1.5} className="size-4" />
        </Link>
      </Card>
      <Card
        tone="danger"
        title="계정 지우기"
        description="계정과 모든 Club 의 소속이 지워집니다. 되돌릴 수 없습니다."
      >
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-body-s text-muted-foreground">
          <li>
            내 출석 기록, Project 참여, 참여 요청, 도움이 됐어요 표시가 함께
            지워집니다. 내가 맡은 할 일은 담당자 없이 남습니다.
          </li>
          <li>
            내가 쓴 AI Log, 회고, 댓글은 남길지 지울지 고릅니다. 남기면 작성자
            이름 없이 Club 에 남습니다. {accountContentText(counts)}
          </li>
          <li>
            내가 AI Log 에 붙인 이미지는 어느 쪽을 골라도 지워집니다.
            {counts.images !== null && ` 지금 ${counts.images}장입니다.`}
          </li>
          <li>
            내가 만든 Session, Project, 발표, AI Insight 는 Club 의 것이라 그대로
            남습니다.
          </li>
          {plan === null && (
            <li>
              내 Club 을 불러오지 못했습니다. Club 마다 생기는 일은 화면을 새로
              고친 뒤 확인해 주세요.
            </li>
          )}
          {plan && plan.removed.length > 0 && (
            <li className="text-danger">
              나만 있는 Club 은 기록과 함께 지워집니다:{" "}
              <ClubNames clubs={plan.removed} />
            </li>
          )}
          {plan && plan.handedOver.length > 0 && (
            <li>
              내가 마지막 운영자인 Club 은 가장 먼저 참여한 구성원이 운영자를
              이어받습니다: <ClubNames clubs={plan.handedOver} />
            </li>
          )}
          {plan && plan.left.length > 0 && (
            <li>
              그 밖의 Club 에서는 나만 빠집니다:{" "}
              <ClubNames clubs={plan.left} />
            </li>
          )}
        </ul>
        <div>
          <DeleteAccountDialog
            email={user.email}
            confirmValue={accountDeleteConfirmValue(user.email)}
            contentText={accountContentText(counts)}
          />
        </div>
      </Card>
    </main>
  )
}
