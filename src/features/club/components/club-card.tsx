import Link from "next/link"
import { Lock, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { clubLogoUrl } from "../logo-rules"
import type { ClubListItem } from "../queries"
import { ROLE_LABEL } from "../roles"
import { ClubLogo } from "./club-logo"

export const CLUB_CARD_CLASS =
  "flex h-full flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-input"

// 카드의 안쪽. 내 Club 과 다른 Club 이 같은 모양을 쓴다.
// 다른 Club 에는 역할 대신 Member 가 아니라는 표시를 둔다.
export function ClubCardBody({ club }: { club: ClubListItem }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <ClubLogo
          name={club.name}
          src={clubLogoUrl(club.id, club.logoPath)}
          className="size-11 rounded-lg bg-primary-subtle text-h3 text-brand"
        />
        {club.role ? (
          <Badge tone={club.role === "admin" ? "brand" : "neutral"}>
            {ROLE_LABEL[club.role]}
          </Badge>
        ) : (
          <Badge tone="neutral">
            <Lock aria-hidden="true" strokeWidth={1.5} />
            Member 아님
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-h3">{club.name}</h3>
        {club.description && (
          <p className="text-body-s text-muted-foreground">
            {club.description}
          </p>
        )}
      </div>
      <p className="mt-auto flex items-center gap-1.5 border-t pt-3 text-caption text-muted-foreground">
        <Users
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-3.5 text-icon-subtle"
        />
        Member {club.memberCount}명
      </p>
    </>
  )
}

// 내가 Member 인 Club. 누르면 Club 개요로 간다.
export function ClubCard({ club }: { club: ClubListItem }) {
  return (
    <Link
      href={`/clubs/${club.id}`}
      className={`${CLUB_CARD_CLASS} focus-visible:outline-2 focus-visible:outline-ring`}
    >
      <ClubCardBody club={club} />
    </Link>
  )
}
