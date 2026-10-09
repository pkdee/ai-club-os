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

import type { MyClub } from "../queries"
import { ClubCard } from "./club-card"
import { CreateClubDialog } from "./create-club-dialog"

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

// clubs 가 null 이면 목록을 불러오지 못한 것이다.
export function MyClubsScreen({ clubs }: { clubs: MyClub[] | null }) {
  const hasClubs = clubs !== null && clubs.length > 0

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 py-12 sm:px-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1">내 Club</h1>
          <p className="text-muted-foreground">
            소속된 Club 을 확인하거나 새 Club 을 만듭니다.
          </p>
        </div>
        {hasClubs && <CreateClubDialog />}
      </div>
      {clubs === null ? (
        <ClubsUnavailable />
      ) : hasClubs ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <li key={club.id}>
              <ClubCard club={club} />
            </li>
          ))}
        </ul>
      ) : (
        <NoClubs />
      )}
    </main>
  )
}
