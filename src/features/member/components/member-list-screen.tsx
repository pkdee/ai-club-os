import Form from "next/form"
import Link from "next/link"
import { CircleAlert, RefreshCw, Search } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { LinkTabs } from "@/components/ui/link-tabs"
import { ROLE_LABEL } from "@/features/club/roles"

import type { MemberListResult } from "../queries"
import {
  MEMBER_SEARCH_MAX,
  matchesMember,
  membersHref,
  type MemberView,
} from "../search"
import { MemberTable } from "./member-table"

export type { MemberView }

// canManage 는 보는 사람이 운영자라는 뜻이다. inviteAction 에는 운영자에게만 보이는 초대 버튼을 넣는다.
// query 는 이름이나 이메일에서 찾을 글자다. logCounts 는 사용자 식별자별 AI Log 수이고, null 이면 세지 못한 것이다.
export function MemberListScreen({
  clubId,
  view,
  query,
  result,
  logCounts,
  currentUserId,
  canManage,
  inviteAction,
}: {
  clubId: string
  view: MemberView
  query: string
  result: MemberListResult
  logCounts: Record<string, number> | null
  currentUserId: string
  canManage: boolean
  inviteAction?: React.ReactNode
}) {
  const base = `/clubs/${clubId}/members`
  const members = result.status === "ok" ? result.members : []
  const admins = members.filter((member) => member.role === "admin")
  const shown = members.filter(
    (member) =>
      (view === "all" || member.role === view) && matchesMember(member, query)
  )

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
          {/* 탭의 수는 찾는 글자와 상관없이 전체 수다. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <LinkTabs
              label="Member 보기"
              className="sm:border-b-0"
              tabs={[
                {
                  href: membersHref(clubId, "all", query),
                  label: "전체",
                  count: members.length,
                  active: view === "all",
                },
                {
                  href: membersHref(clubId, "admin", query),
                  label: ROLE_LABEL.admin,
                  count: admins.length,
                  active: view === "admin",
                },
                {
                  href: membersHref(clubId, "member", query),
                  label: ROLE_LABEL.member,
                  count: members.length - admins.length,
                  active: view === "member",
                },
              ]}
            />
            <Form
              action={base}
              role="search"
              className="relative w-full sm:w-72"
            >
              {view !== "all" && <input type="hidden" name="role" value={view} />}
              <Search
                aria-hidden="true"
                strokeWidth={1.5}
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon-subtle"
              />
              <Input
                // 주소의 찾는 글자가 바뀌면 칸의 값도 그에 맞게 다시 채운다.
                key={query}
                type="search"
                name="q"
                defaultValue={query}
                maxLength={MEMBER_SEARCH_MAX}
                placeholder="이름이나 이메일로 검색"
                aria-label="Member 검색"
                enterKeyHint="search"
                autoComplete="off"
                className="pl-9"
              />
              <button type="submit" className="sr-only">
                검색
              </button>
            </Form>
          </div>
          {query && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p role="status" className="text-body-s text-muted-foreground">
                찾는 글자에 맞는 Member {shown.length}명
              </p>
              <Link
                href={membersHref(clubId, view, "")}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                검색 지우기
              </Link>
            </div>
          )}
          {shown.length > 0 ? (
            <MemberTable
              clubId={clubId}
              members={shown}
              logCounts={logCounts}
              currentUserId={currentUserId}
              canManage={canManage}
              adminCount={admins.length}
            />
          ) : (
            <p className="rounded-xl border bg-card p-5 text-muted-foreground">
              {query
                ? "찾는 Member 가 없습니다. 이름이나 이메일을 다시 확인해 주세요."
                : view === "member"
                  ? "아직 구성원이 없습니다. 운영자가 초대 링크를 공유하면 여기에 보입니다."
                  : "해당하는 Member 가 없습니다."}
            </p>
          )}
        </>
      )}
    </>
  )
}
