import Link from "next/link"

import { Logo } from "@/components/logo"
import { ThemeMenu } from "@/components/theme-menu"

import type { CurrentUser } from "../session"
import { UserMenu } from "./user-menu"

// Club 에 들어가기 전 화면의 상단 막대. 오른쪽에 화면 모드와 내 프로필 메뉴를 둔다.
// 계정 설정과 로그아웃은 프로필 메뉴 안에 있다.
export function TopBar({ user }: { user: CurrentUser }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-8">
      <Link
        href="/"
        aria-label="내 Club 목록으로 이동"
        className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <Logo />
      </Link>
      <div className="flex items-center gap-1">
        <ThemeMenu />
        <UserMenu user={user} showName />
      </div>
    </header>
  )
}
