"use client"

import { useRef } from "react"
import Link from "next/link"
import { ChevronDown, LogOut, UserRoundCog } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLinkItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu"
import { cn } from "@/lib/utils"

import { signOut } from "../actions"
import type { CurrentUser } from "../session"

// 상단 막대의 오른쪽 끝에 두는 내 프로필 메뉴. 사진을 누르면 계정 설정과 로그아웃이 열린다.
// showName 이면 넓은 화면에서 사진 옆에 이름도 보인다.
export function UserMenu({
  user,
  showName = false,
}: {
  user: CurrentUser
  showName?: boolean
}) {
  // 메뉴는 화면 끝에 따로 그려지므로, 로그아웃을 보내는 form 은 메뉴 밖에 두고 항목에서 보낸다.
  const signOutForm = useRef<HTMLFormElement>(null)

  return (
    <>
      <Menu>
        <MenuTrigger
          aria-label={`내 프로필 메뉴 (${user.name})`}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-md p-1 transition-colors outline-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring data-popup-open:bg-accent",
            showName && "sm:pr-2"
          )}
        >
          <Avatar name={user.name} src={user.avatarUrl} />
          {showName && (
            <>
              <span className="hidden max-w-40 truncate text-label-m sm:inline">
                {user.name}
              </span>
              <ChevronDown
                aria-hidden="true"
                strokeWidth={1.5}
                className="hidden size-4 text-icon-subtle sm:block"
              />
            </>
          )}
        </MenuTrigger>
        <MenuContent className="w-64">
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar name={user.name} src={user.avatarUrl} size="lg" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-label-m">{user.name}</span>
              {user.email && (
                <span className="truncate text-caption text-muted-foreground">
                  {user.email}
                </span>
              )}
            </div>
          </div>
          <MenuSeparator />
          <MenuLinkItem render={<Link href="/account" />}>
            <UserRoundCog aria-hidden="true" strokeWidth={1.5} />
            계정 설정
          </MenuLinkItem>
          <MenuSeparator />
          <MenuItem
            tone="danger"
            onClick={() => signOutForm.current?.requestSubmit()}
          >
            <LogOut aria-hidden="true" strokeWidth={1.5} />
            로그아웃
          </MenuItem>
        </MenuContent>
      </Menu>
      <form ref={signOutForm} action={signOut} hidden />
    </>
  )
}
