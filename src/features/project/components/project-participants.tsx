"use client"

import { useState, useTransition } from "react"
import { CircleAlert, UserPlus, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"

import {
  acceptJoinRequest,
  addProjectParticipant,
  cancelJoinRequest,
  declineJoinRequest,
  removeProjectParticipant,
  requestToJoinProject,
  type ProjectActionResult,
} from "../actions"
import type { ProjectJoinRequest, ProjectParticipant } from "../queries"

// Project 의 참여자. 참여자는 그 Project 를 고칠 수 있다.
// 참여자와 운영자가 다른 Member 를 넣고 빼며, 누구나 스스로 빠질 수 있다.
// candidates 는 아직 참여하지 않은 Club 의 Member 다. null 이면 Member 목록을 불러오지 못한 것이다.
// requests 는 들어온 참여 요청이고 고칠 수 있는 사람에게만 넘긴다.
// myRequest 는 참여자가 아닌 내가 요청해 둔 상태다. null 이면 요청할 수 없거나 아직 쓸 수 없는 것이다.
export function ProjectParticipants({
  clubId,
  projectId,
  participants,
  candidates,
  requests = [],
  myRequest = null,
  currentUserId,
  canEdit,
}: {
  clubId: string
  projectId: string
  participants: ProjectParticipant[]
  candidates: { memberId: string; name: string }[] | null
  requests?: ProjectJoinRequest[]
  myRequest?: "none" | "pending" | null
  currentUserId: string
  canEdit: boolean
}) {
  const [picked, setPicked] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<ProjectActionResult>, after?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        after?.()
      } else {
        setError(result.message)
      }
    })
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <h2 className="text-h4">참여자</h2>
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>바꾸지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {participants.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {participants.map((participant) => {
            const isMe = participant.userId === currentUserId

            return (
              <li key={participant.memberId} className="flex items-center gap-2">
                <Avatar
                  size="sm"
                  name={participant.name}
                  src={participant.avatarUrl}
                />
                <span className="min-w-0 flex-1 truncate text-label-m">
                  {participant.name}
                </span>
                {isMe && <Badge>나</Badge>}
                {(canEdit || isMe) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    aria-label={
                      isMe ? "이 Project 에서 빠지기" : `${participant.name} 빼기`
                    }
                    onClick={() =>
                      run(() =>
                        removeProjectParticipant(
                          clubId,
                          projectId,
                          participant.memberId
                        )
                      )
                    }
                  >
                    <X aria-hidden="true" strokeWidth={1.5} />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-body-s text-muted-foreground">
          참여자가 없습니다. 지금은 운영자만 고칠 수 있습니다. 참여 요청은
          운영자가 받아 줍니다.
        </p>
      )}
      {canEdit && requests.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <h3 className="text-label-m">참여 요청 {requests.length}건</h3>
          <ul className="flex flex-col gap-2">
            {requests.map((request) => (
              <li key={request.memberId} className="flex items-center gap-2">
                <Avatar
                  size="sm"
                  name={request.name}
                  src={request.avatarUrl}
                />
                <span className="min-w-0 flex-1 truncate text-label-m">
                  {request.name}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  aria-label={`${request.name} 의 참여 요청 받아 주기`}
                  onClick={() =>
                    run(() =>
                      acceptJoinRequest(clubId, projectId, request.memberId)
                    )
                  }
                >
                  받기
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  aria-label={`${request.name} 의 참여 요청 거절하기`}
                  onClick={() =>
                    run(() =>
                      declineJoinRequest(clubId, projectId, request.memberId)
                    )
                  }
                >
                  거절
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {myRequest && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <p className="text-body-s text-muted-foreground">
            {myRequest === "pending"
              ? "참여를 요청해 두었습니다. 참여자나 운영자가 받아 주면 이 Project 를 고칠 수 있습니다."
              : "함께하고 싶으면 참여를 요청해 보세요. 참여자나 운영자가 받아 주면 이 Project 를 고칠 수 있습니다."}
          </p>
          {myRequest === "pending" ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => cancelJoinRequest(clubId, projectId))}
            >
              요청 거두기
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => requestToJoinProject(clubId, projectId))}
            >
              <UserPlus aria-hidden="true" strokeWidth={1.5} />
              참여 요청
            </Button>
          )}
        </div>
      )}
      {canEdit &&
        (candidates === null ? (
          <p className="text-body-s text-muted-foreground">
            Member 목록을 불러오지 못해 참여자를 넣을 수 없습니다. 잠시 뒤 다시
            열어 주세요.
          </p>
        ) : (
          candidates.length > 0 && (
            <form
              className="flex gap-2 border-t pt-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (picked) {
                  run(
                    () => addProjectParticipant(clubId, projectId, picked),
                    () => setPicked("")
                  )
                }
              }}
            >
              <NativeSelect
                value={picked}
                onChange={(event) => setPicked(event.target.value)}
                aria-label="참여자로 넣을 Member"
                className="min-w-0 flex-1"
              >
                <option value="">Member 고르기</option>
                {candidates.map((candidate) => (
                  <option key={candidate.memberId} value={candidate.memberId}>
                    {candidate.name}
                  </option>
                ))}
              </NativeSelect>
              <Button
                type="submit"
                variant="outline"
                disabled={pending || picked === ""}
                className="shrink-0"
              >
                <UserPlus aria-hidden="true" strokeWidth={1.5} />
                넣기
              </Button>
            </form>
          )
        ))}
    </section>
  )
}
