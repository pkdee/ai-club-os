import Link from "next/link"
import { CircleAlert, RefreshCw, Users } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import type { ClubListItem } from "../queries"
import { ClubCard } from "./club-card"
import { CreateClubDialog } from "./create-club-dialog"
import { LockedClubCard } from "./locked-club-card"

function NoClubs() {
  return (
    <div className="rounded-xl border bg-card">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <Users strokeWidth={1.5} />
          </EmptyMedia>
          <EmptyTitle>아직 소속된 Club 이 없습니다</EmptyTitle>
          <EmptyDescription>
            새 Club 을 만들어 활동을 시작하세요.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateClubDialog />
        </EmptyContent>
      </Empty>
    </div>
  )
}

function ClubsUnavailable() {
  return (
    <div className="rounded-xl border bg-card">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <CircleAlert strokeWidth={1.5} />
          </EmptyMedia>
          <EmptyTitle>Club 목록을 불러오지 못했습니다</EmptyTitle>
          <EmptyDescription>
            연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해
            주세요.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            <RefreshCw aria-hidden="true" strokeWidth={1.5} />
            다시 시도
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}

const GRID_CLASS = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"

// 로그인한 뒤의 첫 화면. 등록된 Club 을 모두 보여 주되, 내 Club 과 다른 Club 을 나눈다.
// 다른 Club 은 둘러볼 수만 있고, 누르면 들어갈 권한이 없다는 안내가 열린다.
// clubs 가 null 이면 목록을 불러오지 못한 것이다.
export function MyClubsScreen({ clubs }: { clubs: ClubListItem[] | null }) {
  const mine = clubs?.filter((club) => club.role !== null) ?? []
  const others = clubs?.filter((club) => club.role === null) ?? []

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 px-4 py-12 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1">Club</h1>
          <p className="text-muted-foreground">
            소속된 Club 에 들어가거나, 등록된 다른 Club 을 둘러보거나, 새 Club
            을 만듭니다.
          </p>
        </div>
        {mine.length > 0 && <CreateClubDialog />}
      </div>
      {clubs === null ? (
        <ClubsUnavailable />
      ) : (
        <>
          <section aria-labelledby="my-clubs" className="flex flex-col gap-4">
            <h2 id="my-clubs" className="text-h2">
              내 Club
            </h2>
            {mine.length > 0 ? (
              <ul className={GRID_CLASS}>
                {mine.map((club) => (
                  <li key={club.id}>
                    <ClubCard club={club} />
                  </li>
                ))}
              </ul>
            ) : (
              <NoClubs />
            )}
          </section>
          {others.length > 0 && (
            <section
              aria-labelledby="other-clubs"
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <h2 id="other-clubs" className="text-h2">
                  다른 Club
                </h2>
                <p className="text-body-s text-muted-foreground">
                  Member 만 들어갈 수 있습니다. 참여하려면 운영자에게 초대
                  링크를 받아 주세요.
                </p>
              </div>
              <ul className={GRID_CLASS}>
                {others.map((club) => (
                  <li key={club.id}>
                    <LockedClubCard club={club} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  )
}
