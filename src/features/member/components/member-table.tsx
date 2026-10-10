"use client"

import { useState } from "react"
import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ROLE_LABEL } from "@/features/club/roles"

import { formatJoinDate } from "../format"
import type { Member } from "../queries"
import { MemberRowMenu } from "./member-row-menu"

// adminCount 는 걸러 보기와 상관없이 Club 전체의 운영자 수다. 마지막 운영자를 가려내는 데 쓴다.
// logCounts 는 사용자 식별자별 AI Log 수다. null 이면 세지 못한 것이라 그 열을 보여 주지 않는다.
export function MemberTable({
  clubId,
  members,
  logCounts,
  currentUserId,
  canManage,
  adminCount,
}: {
  clubId: string
  members: Member[]
  logCounts: Record<string, number> | null
  currentUserId: string
  canManage: boolean
  adminCount: number
}) {
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>바꾸지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b text-left text-label-s text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 font-medium">
                Member
              </th>
              <th scope="col" className="w-24 px-4 py-2.5 font-medium">
                역할
              </th>
              <th
                scope="col"
                className="hidden w-36 px-4 py-2.5 font-medium sm:table-cell"
              >
                합류일
              </th>
              {logCounts && (
                <th
                  scope="col"
                  className="hidden w-20 px-4 py-2.5 font-medium md:table-cell"
                >
                  AI Log
                </th>
              )}
              <th scope="col" className="w-12 py-2.5">
                <span className="sr-only">관리</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isMe = member.userId === currentUserId

              return (
                <tr key={member.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={member.name} src={member.avatarUrl} />
                      <div className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-label-m">
                            {member.name}
                          </span>
                          {isMe && <Badge>나</Badge>}
                        </span>
                        {member.email && (
                          <span className="truncate text-caption text-muted-foreground">
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={member.role === "admin" ? "brand" : "neutral"}>
                      {ROLE_LABEL[member.role]}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-body-s text-muted-foreground sm:table-cell">
                    {formatJoinDate(member.joinedAt)}
                  </td>
                  {logCounts && (
                    <td className="hidden px-4 py-3 text-body-s text-muted-foreground md:table-cell">
                      {logCounts[member.userId] ?? 0}개
                    </td>
                  )}
                  <td className="py-3 pr-2 text-right">
                    {(canManage || isMe) && (
                      <MemberRowMenu
                        clubId={clubId}
                        member={{
                          id: member.id,
                          name: member.name,
                          role: member.role,
                        }}
                        isMe={isMe}
                        canManage={canManage}
                        isLastAdmin={member.role === "admin" && adminCount === 1}
                        onError={setError}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
