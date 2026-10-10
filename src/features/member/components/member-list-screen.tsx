import Link from "next/link"
import { CircleAlert, RefreshCw } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { LinkTabs } from "@/components/ui/link-tabs"
import { ROLE_LABEL, type ClubRole } from "@/features/club/roles"

import type { MemberListResult } from "../queries"
import { MemberTable } from "./member-table"

export type MemberView = "all" | ClubRole

// canManage 는 보는 사람이 운영자라는 뜻이다. inviteAction 에는 운영자에게만 보이는 초대 버튼을 넣는다.
export function MemberListScreen({
  clubId,
  view,
  result,
  currentUserId,
  canManage,
  inviteAction,
}: {
  clubId: string
  view: MemberView
  result: MemberListResult
  currentUserId: string
  canManage: boolean
  inviteAction?: React.ReactNode
}) {
  const base = `/clubs/${clubId}/members`
  const members = result.status === "ok" ? result.members : []
  const admins = members.filter((member) => member.role === "admin")
  const shown =
    view === "all" ? members : members.filter((member) => member.role === view)

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1">Member</h1>
          <p className="text-muted-foreground">
            {canManage
              ? "Club 구성원과 역할을 관리합니다."
              : "이 Club 의 구성원과 역할을 확인합니다."}
          </p>
        </div>
        {inviteAction}
      </div>
      {result.status === "error" ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <CircleAlert strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>Member 목록을 불러오지 못했습니다</EmptyTitle>
              <EmptyDescription>
                연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해
                주세요.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href={base} className={buttonVariants({ variant: "outline" })}>
                <RefreshCw aria-hidden="true" strokeWidth={1.5} />
                다시 시도
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          <LinkTabs
            label="Member 보기"
            tabs={[
              {
                href: base,
                label: "전체",
                count: members.length,
                active: view === "all",
              },
              {
                href: `${base}?role=admin`,
                label: ROLE_LABEL.admin,
                count: admins.length,
                active: view === "admin",
              },
              {
                href: `${base}?role=member`,
                label: ROLE_LABEL.member,
                count: members.length - admins.length,
                active: view === "member",
              },
            ]}
          />
          {shown.length > 0 ? (
            <MemberTable
              clubId={clubId}
              members={shown}
              currentUserId={currentUserId}
              canManage={canManage}
              adminCount={admins.length}
            />
          ) : (
            <p className="rounded-xl border bg-card p-5 text-muted-foreground">
              {view === "member"
                ? "아직 구성원이 없습니다. 운영자가 초대 링크를 공유하면 여기에 보입니다."
                : "해당하는 Member 가 없습니다."}
            </p>
          )}
        </>
      )}
    </>
  )
}
