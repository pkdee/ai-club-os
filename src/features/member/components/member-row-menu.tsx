"use client"

import { useState, useTransition } from "react"
import { Ellipsis, LogOut, ShieldCheck, User, UserMinus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CheckboxField } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuNote,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import type { ClubRole } from "@/features/club/roles"

import {
  changeMemberRole,
  leaveClub,
  removeMember,
  type MemberActionResult,
} from "../actions"

// 누르기 전에 한 번 더 묻는 일의 종류.
type Confirm = "demote-self" | "remove" | "leave"

export type ManagedMember = {
  id: string
  name: string
  role: ClubRole
}

// 한 Member 에게 할 수 있는 일의 목록.
// 운영자는 역할을 바꾸고 내보낼 수 있고, 본인은 스스로 나갈 수 있다.
// isLastAdmin 이면 이 Member 가 하나 남은 운영자라서 내리거나 나갈 수 없다.
// canBlock 이면 내보낼 때 다시 들어오지 못하게 막을지 고를 수 있다.
export function MemberRowMenu({
  clubId,
  member,
  isMe,
  canManage,
  canBlock,
  isLastAdmin,
  onError,
}: {
  clubId: string
  member: ManagedMember
  isMe: boolean
  canManage: boolean
  canBlock: boolean
  isLastAdmin: boolean
  onError: (message: string | null) => void
}) {
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  // 내보내면서 다시 들어오지 못하게 막을지. 창을 열 때마다 꺼진 채로 시작한다.
  const [block, setBlock] = useState(false)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<MemberActionResult>) {
    onError(null)
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        onError(result.message)
      }
      setConfirm(null)
    })
  }

  const dialogs: Record<
    Confirm,
    {
      title: string
      description: string
      action: string
      danger: boolean
      run: () => Promise<MemberActionResult>
    }
  > = {
    "demote-self": {
      title: "운영자 역할을 내려놓을까요?",
      description:
        "구성원이 되면 Session 만들기, Attendance 기록, Member 관리, Club 설정을 할 수 없습니다. 다시 운영자가 되려면 다른 운영자가 지정해 줘야 합니다.",
      action: "구성원으로 변경",
      danger: false,
      run: () => changeMemberRole(clubId, member.id, "member"),
    },
    remove: {
      title: `${member.name} 님을 내보낼까요?`,
      description: canBlock
        ? "이 사람의 Attendance 기록은 함께 삭제되고, 쓴 AI Log 는 작성자가 '탈퇴한 Member' 로 바뀐 채 Club 에 남습니다. 되돌릴 수 없습니다."
        : "이 사람의 Attendance 기록은 함께 삭제되고, 쓴 AI Log 는 작성자가 '탈퇴한 Member' 로 바뀐 채 Club 에 남습니다. 되돌릴 수 없습니다. 초대 링크로 다시 들어올 수는 있지만 지워진 기록은 돌아오지 않습니다.",
      action: "내보내기",
      danger: true,
      run: () => removeMember(clubId, member.id, canBlock && block),
    },
    leave: {
      title: "이 Club 에서 나갈까요?",
      description:
        "내 Attendance 기록은 삭제되고, 내가 쓴 AI Log 는 작성자 없이 Club 에 남습니다. 되돌릴 수 없습니다. 다시 들어오려면 초대 링크가 필요합니다.",
      action: "나가기",
      danger: true,
      run: () => leaveClub(clubId),
    },
  }
  const dialog = confirm ? dialogs[confirm] : null

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              aria-label={isMe ? "내 Member 메뉴" : `${member.name} 관리 메뉴`}
            />
          }
        >
          <Ellipsis aria-hidden="true" strokeWidth={1.5} />
        </MenuTrigger>
        <MenuContent>
          {canManage &&
            (member.role === "member" ? (
              <MenuItem
                onClick={() =>
                  run(() => changeMemberRole(clubId, member.id, "admin"))
                }
              >
                <ShieldCheck aria-hidden="true" strokeWidth={1.5} />
                운영자로 지정
              </MenuItem>
            ) : (
              <MenuItem
                disabled={isLastAdmin}
                onClick={() =>
                  isMe
                    ? setConfirm("demote-self")
                    : run(() => changeMemberRole(clubId, member.id, "member"))
                }
              >
                <User aria-hidden="true" strokeWidth={1.5} />
                구성원으로 변경
              </MenuItem>
            ))}
          {canManage && <MenuSeparator />}
          {isMe ? (
            <MenuItem
              tone="danger"
              disabled={isLastAdmin}
              onClick={() => setConfirm("leave")}
            >
              <LogOut aria-hidden="true" strokeWidth={1.5} />
              Club 나가기
            </MenuItem>
          ) : (
            <MenuItem
              tone="danger"
              onClick={() => {
                setBlock(false)
                setConfirm("remove")
              }}
            >
              <UserMinus aria-hidden="true" strokeWidth={1.5} />
              Club 에서 내보내기
            </MenuItem>
          )}
          {isLastAdmin && (
            <MenuNote>
              하나 남은 운영자입니다. 다른 Member 를 운영자로 지정하면 역할을
              내리거나 나갈 수 있습니다.
            </MenuNote>
          )}
        </MenuContent>
      </Menu>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setConfirm(null)
          }
        }}
      >
        <DialogContent>
          {dialog && (
            <>
              <DialogHeader>
                <DialogTitle>{dialog.title}</DialogTitle>
                <DialogDescription>{dialog.description}</DialogDescription>
              </DialogHeader>
              {confirm === "remove" && canBlock && (
                <CheckboxField
                  checked={block}
                  disabled={pending}
                  onChange={(event) => setBlock(event.target.checked)}
                  label="다시 들어오지 못하게 막기"
                  description="켜면 초대 링크가 있어도 참여할 수 없습니다. Member 화면에서 언제든 풀어 줄 수 있습니다. 끄면 초대 링크로 다시 들어올 수 있지만 지워진 기록은 돌아오지 않습니다."
                />
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setConfirm(null)}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  variant={dialog.danger ? "destructive" : "default"}
                  disabled={pending}
                  onClick={() => run(dialog.run)}
                >
                  {pending ? "처리하는 중" : dialog.action}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
