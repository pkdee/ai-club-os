import Link from "next/link"
import { ArrowLeft, Bell, ChevronsUpDown, Settings } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { UserMenu } from "@/features/auth/components/user-menu"
import type { CurrentUser } from "@/features/auth/session"

import { clubLogoUrl } from "../logo-rules"
import type { MyClub } from "../queries"
import { ROLE_LABEL } from "../roles"
import { ClubLogo } from "./club-logo"
import { ClubNav } from "./club-nav"

// Club 안쪽 화면이 함께 쓰는 틀. 넓은 화면은 Sidebar, 좁은 화면은 아래쪽 메뉴를 쓴다.
// 화면 모드 토글과 내 프로필 메뉴는 화면 크기와 관계없이 상단 막대의 오른쪽에 둔다.
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
      {/* 화면 높이에 맞춰 붙여 둔다. 긴 화면을 내려도 Club 바꾸기와 맨 아래의 알림, 설정이 함께 보인다. */}
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-app px-3 py-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:overflow-y-auto">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ClubLogo
            name={club.name}
            src={clubLogoUrl(club.id, club.logoPath)}
            className="size-8 rounded-md bg-inverse text-label-m text-inverse-foreground"
          />
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
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-1 border-b bg-card px-2 lg:h-16 lg:px-10">
          {/* 좁은 화면에는 Sidebar 가 없어 내 Club 목록으로 가는 길과 Club 이름을 여기에 둔다. */}
          <div className="flex min-w-0 flex-1 items-center lg:hidden">
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
          </div>
          <div className="flex shrink-0 items-center gap-1 lg:ml-auto">
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
                  className: "relative lg:hidden",
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
                className={buttonVariants({
                  variant: "ghost",
                  size: "icon",
                  className: "lg:hidden",
                })}
              >
                <Settings aria-hidden="true" strokeWidth={1.5} />
              </Link>
            )}
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        {/* 아주 넓은 화면에서 줄이 지나치게 길어지지 않게 폭을 막고 남은 자리의 가운데에 둔다. */}
        <main className="mx-auto flex w-full max-w-[85rem] min-w-0 flex-1 flex-col gap-6 px-4 py-8 lg:px-10 lg:pb-12">
          {children}
        </main>
      </div>
      <ClubNav
        clubId={club.id}
        canManage={club.role === "admin"}
        variant="tabbar"
        className="sticky bottom-0 lg:hidden"
      />
    </div>
  )
}
