import Link from "next/link"
import { LogOut } from "lucide-react"

import { Logo } from "@/components/logo"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

import { signOut } from "../actions"
import type { CurrentUser } from "../session"

// Club 에 들어가기 전 화면의 상단 막대. Figma 의 TopBar 에 로그아웃 버튼을 더했다.
// 사진과 이름을 누르면 내 계정 화면으로 간다.
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
      <div className="flex items-center gap-3">
        <Link
          href="/account"
          aria-label={`내 계정 (${user.name})`}
          className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Avatar name={user.name} src={user.avatarUrl} />
          <span className="hidden pr-1 text-label-m sm:inline">{user.name}</span>
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut aria-hidden="true" strokeWidth={1.5} />
            로그아웃
          </Button>
        </form>
      </div>
    </header>
  )
}
