import { LogOut } from "lucide-react"

import { Logo } from "@/components/logo"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

import { signOut } from "../actions"
import type { CurrentUser } from "../session"

// Club 에 들어가기 전 화면의 상단 막대. Figma 의 TopBar 에 로그아웃 버튼을 더했다.
export function TopBar({ user }: { user: CurrentUser }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-8">
      <Logo />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Avatar name={user.name} src={user.avatarUrl} />
          <span className="hidden text-label-m sm:inline">{user.name}</span>
        </div>
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
