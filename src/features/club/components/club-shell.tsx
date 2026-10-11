import Link from "next/link"
import { ArrowLeft, Bell, ChevronsUpDown, LogOut, Settings } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { signOut } from "@/features/auth/actions"
import type { CurrentUser } from "@/features/auth/session"

import type { MyClub } from "../queries"
import { ROLE_LABEL } from "../roles"
import { ClubNav } from "./club-nav"

// Club 안쪽 화면이 함께 쓰는 틀. 넓은 화면은 Sidebar, 좁은 화면은 상단 막대와 아래쪽 메뉴를 쓴다.
// notificationCount 는 내가 챙길 알림의 수다. null 이면 알림을 아직 쓸 수 없는 것이라 메뉴에 넣지 않는다.
export function ClubShell({
  club,
  user,
  notificationCount = null,
  children,
}: {
  club: MyClub
  user: CurrentUser
  notificationCount?: number | null
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-app px-3 py-4 lg:flex">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-inverse text-label-m text-inverse-foreground"
          >
            {Array.from(club.name)[0]}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label-m">{club.name}</span>
            <span className="text-caption text-muted-foreground">
              {ROLE_LABEL[club.role]}
            </span>
          </span>
          <ChevronsUpDown
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-4 shrink-0 text-icon-subtle"
          />
          <span className="sr-only">내 Club 목록으로 이동</span>
        </Link>
        <ClubNav
          clubId={club.id}
          canManage={club.role === "admin"}
          notificationCount={notificationCount}
          className="flex-1"
        />
        <div className="flex items-center gap-1 border-t pt-3">
          {/* 사진과 이름을 누르면 내 계정 화면으로 간다. */}
          <Link
            href="/account"
            aria-label={`내 계정 (${user.name})`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Avatar name={user.name} src={user.avatarUrl} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label-m">{user.name}</span>
              {user.email && (
                <span className="truncate text-caption text-muted-foreground">
                  {user.email}
                </span>
              )}
            </span>
          </Link>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label="로그아웃"
            >
              <LogOut aria-hidden="true" strokeWidth={1.5} />
            </Button>
          </form>
        </div>
      </aside>
      <header className="flex h-14 shrink-0 items-center gap-1 border-b bg-card px-2 lg:hidden">
        <Link
          href="/"
          aria-label="내 Club 목록으로 이동"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft aria-hidden="true" strokeWidth={1.5} />
        </Link>
        <span className="min-w-0 flex-1 truncate pl-2 text-h4">
          {club.name}
        </span>
        {/* 좁은 화면에서는 아래쪽 메뉴에 자리가 모자라 알림과 설정을 여기에 둔다. */}
        {notificationCount !== null && (
          <Link
            href={`/clubs/${club.id}/notifications`}
            aria-label={
              notificationCount > 0 ? `알림 ${notificationCount}건` : "알림"
            }
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "relative",
            })}
          >
            <Bell aria-hidden="true" strokeWidth={1.5} />
            {notificationCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary"
              />
            )}
          </Link>
        )}
        {club.role === "admin" && (
          <Link
            href={`/clubs/${club.id}/settings`}
            aria-label="Club 설정"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Settings aria-hidden="true" strokeWidth={1.5} />
          </Link>
        )}
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="로그아웃"
          >
            <LogOut aria-hidden="true" strokeWidth={1.5} />
          </Button>
        </form>
      </header>
      <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-8 lg:px-10 lg:pb-12">
        {children}
      </main>
      <ClubNav
        clubId={club.id}
        canManage={club.role === "admin"}
        variant="tabbar"
        className="sticky bottom-0 lg:hidden"
      />
    </div>
  )
}
