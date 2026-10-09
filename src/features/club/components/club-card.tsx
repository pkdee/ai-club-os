import Link from "next/link"
import { Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import type { MyClub } from "../queries"
import { ROLE_LABEL } from "../roles"

export function ClubCard({ club }: { club: MyClub }) {
  return (
    <Link
      href={`/clubs/${club.id}`}
      className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-input focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between">
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-lg bg-primary-subtle text-h3 text-brand"
        >
          {Array.from(club.name)[0]}
        </span>
        <Badge tone={club.role === "admin" ? "brand" : "neutral"}>
          {ROLE_LABEL[club.role]}
        </Badge>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">{club.name}</h2>
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
    </Link>
  )
}
