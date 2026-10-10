import Link from "next/link"
import { Lock } from "lucide-react"

import { DeleteDialog } from "@/components/delete-dialog"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { deleteClub } from "../actions"
import type { MyClub } from "../queries"
import { ClubSettingsForm } from "./club-settings-form"

// 운영자만 쓰는 화면이다. 구성원이 주소로 들어오면 이유를 알려 준다.
// children 에는 운영자에게만 보이는 다른 영역을 넣는다. 기본 정보와 Club 삭제 사이에 놓인다.
export function ClubSettingsScreen({
  club,
  children,
}: {
  club: MyClub
  children?: React.ReactNode
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-h1">Club 설정</h1>
        <p className="text-muted-foreground">
          Club 의 기본 정보를 관리합니다. 운영자만 바꿀 수 있습니다.
        </p>
      </div>
      {club.role === "admin" ? (
        <>
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
          {children}
          <section className="flex max-w-[720px] flex-col gap-4 rounded-xl border border-danger-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-h3">Club 삭제</h2>
              <p className="text-body-s text-muted-foreground">
                Club 과 그 안의 모든 기록을 지웁니다. 되돌릴 수 없습니다.
              </p>
            </div>
            <DeleteDialog
              label="Club 삭제"
              title={`${club.name} Club 을 지울까요?`}
              description={
                <>
                  <p>
                    Member {club.memberCount}명의 소속과 Session, Attendance,
                    AI Log, AI Insight, Project, 초대 링크가 모두 함께
                    지워집니다. 지운 기록도 남지 않습니다.
                  </p>
                  <p>지우면 되돌릴 수 없습니다.</p>
                </>
              }
              confirm={{
                value: club.name,
                label: "확인을 위해 Club 이름을 그대로 입력해 주세요",
              }}
              onDelete={deleteClub.bind(null, club.id)}
            />
          </section>
        </>
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
