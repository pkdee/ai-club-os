import Link from "next/link"
import { Calendar, FolderKanban } from "lucide-react"

import { Avatar } from "@/components/ui/avatar"

import { authorName, formatLogDate } from "../format"
import type { AiLogSummary } from "../queries"
import { ToolChips } from "./tool-chips"

export function AiLogCard({ log, now }: { log: AiLogSummary; now: Date }) {
  const name = authorName(log.author)

  return (
    <Link
      href={`/clubs/${log.clubId}/logs/${log.id}`}
      className="flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-input focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <Avatar size="sm" name={name} src={log.author?.avatarUrl} />
          <span className="text-label-m">{name}</span>
          <span className="text-caption text-muted-foreground">
            {formatLogDate(log.createdAt, now)}
          </span>
        </div>
        {(log.session || log.project) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
            {log.project && (
              <span className="flex items-center gap-1.5">
                <FolderKanban
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-3.5 shrink-0 text-icon-subtle"
                />
                {log.project.name}
              </span>
            )}
            {log.session && (
              <span className="flex items-center gap-1.5">
                <Calendar
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-3.5 shrink-0 text-icon-subtle"
                />
                {log.session.title}
              </span>
            )}
          </div>
        )}
      </div>
      <h3 className="text-h4">{log.title}</h3>
      <p className="line-clamp-2 text-muted-foreground">{log.attempt}</p>
      <ToolChips tools={log.tools} />
    </Link>
  )
}

export function AiLogCardList({
  logs,
  now,
}: {
  logs: AiLogSummary[]
  now: Date
}) {
  return (
    <ul className="flex flex-col gap-3">
      {logs.map((log) => (
        <li key={log.id}>
          <AiLogCard log={log} now={now} />
        </li>
      ))}
    </ul>
  )
}
