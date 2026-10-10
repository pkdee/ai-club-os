import Link from "next/link"
import { Lock } from "lucide-react"

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
import { ClubSettingsForm } from "./club-settings-form"

// 운영자만 쓰는 화면이다. 구성원이 주소로 들어오면 이유를 알려 준다.
export function ClubSettingsScreen({ club }: { club: MyClub }) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">Club 설정</h1>
        <p className="text-muted-foreground">
          Club 의 기본 정보를 관리합니다. 운영자만 바꿀 수 있습니다.
        </p>
      </div>
      {club.role === "admin" ? (
        <section className="flex max-w-[720px] flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3">기본 정보</h2>
            <p className="text-body-s text-muted-foreground">
              Member 가 Club 을 고를 때 보는 정보입니다.
            </p>
          </div>
          <ClubSettingsForm
            clubId={club.id}
            defaults={{ name: club.name, description: club.description }}
          />
        </section>
      ) : (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Lock strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>운영자만 볼 수 있는 화면입니다</EmptyTitle>
              <EmptyDescription>
                Club 설정은 운영자만 바꿀 수 있습니다. 바꿀 것이 있으면
                운영자에게 요청해 주세요.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link
                href={`/clubs/${club.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Club 개요로
              </Link>
            </EmptyContent>
          </Empty>
        </div>
      )}
    </>
  )
}
