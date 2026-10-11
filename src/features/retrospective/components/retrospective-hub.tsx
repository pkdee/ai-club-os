import Link from "next/link"
import { ChevronRight, Info } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { monthLabel } from "@/features/ai-insight/period"
import { formatLogDate } from "@/features/ai-log/format"

import type {
  MonthCountsResult,
  RecentRetrospective,
  RecentRetrospectivesResult,
} from "../queries"
import { RETRO_PARTS, retrospectiveAuthorName } from "./retrospective-card"

// 회고가 어디에 달린 것인지와 누르면 갈 곳.
function place(clubId: string, item: RecentRetrospective) {
  const base = `/clubs/${clubId}`

  if (item.scope === "project" && item.projectId) {
    return {
      kind: "Project",
      name: item.targetName ?? "Project",
      href: `${base}/projects/${item.projectId}`,
    }
  }
  if (item.scope === "session" && item.sessionId) {
    return {
      kind: "Session",
      name: item.targetName ?? "Session",
      href: `${base}/sessions/${item.sessionId}/retros`,
    }
  }
  return {
    kind: "한 달",
    name: item.month ? monthLabel(item.month) : "한 달 회고",
    href: `${base}/retros/${item.month ?? ""}`,
  }
}

// 적은 칸 가운데 첫째 것을 미리 보여 준다.
function excerpt(item: RecentRetrospective) {
  const part = RETRO_PARTS.find(({ key }) => item[key])
  return part ? { label: part.label, text: item[part.key] } : null
}

// 회고를 모아 보는 화면. 한 달 회고로 가는 길과 Club 에 최근 올라온 회고를 보여 준다.
// months 는 내가 한 달 회고를 쓸 수 있는 달이고 최근 달이 앞에 온다.
export function RetrospectiveHub({
  clubId,
  months,
  counts,
  recent,
  now,
}: {
  clubId: string
  months: string[]
  counts: MonthCountsResult
  recent: RecentRetrospectivesResult
  now: Date
}) {
  const unavailable =
    counts.status === "unavailable" || recent.status === "unavailable"
  const monthCounts = counts.status === "ok" ? counts.counts : {}
  const items = recent.status === "ok" ? recent.retrospectives : []

  return (
    <>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-h1">회고</h1>
        <p className="text-muted-foreground">
          Project, Session, 한 달을 돌아본 글입니다. 좋았던 것, 아쉬운 것,
          다음에 해 볼 것을 사람마다 하나씩 남깁니다.
        </p>
      </div>
      {unavailable ? (
        <Alert tone="info">
          <Info aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>회고를 아직 쓸 수 없습니다</AlertTitle>
          <AlertDescription>
            데이터베이스에 회고의 구조가 아직 없습니다. 최신 마이그레이션을
            적용하면 쓸 수 있습니다.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="flex min-w-0 flex-col gap-3 xl:col-start-2 xl:row-start-1">
            <div className="flex flex-col gap-1">
              <h2 className="text-h3">한 달 회고</h2>
              <p className="text-body-s text-muted-foreground">
                한 달 동안 내가 남긴 기록을 보며 돌아봅니다.
              </p>
            </div>
            <ul className="flex flex-col divide-y rounded-xl border bg-card">
              {months.map((month) => {
                const count = monthCounts[month]

                return (
                  <li key={month}>
                    <Link
                      href={`/clubs/${clubId}/retros/${month}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-label-m">{monthLabel(month)}</span>
                        <span className="text-caption text-muted-foreground">
                          {count ? `${count.total}명이 썼습니다` : "아직 쓴 사람이 없습니다"}
                        </span>
                      </span>
                      {count?.mine ? (
                        <Badge tone="success">씀</Badge>
                      ) : (
                        <Badge>아직</Badge>
                      )}
                      <ChevronRight
                        aria-hidden="true"
                        strokeWidth={1.5}
                        className="size-4 shrink-0 text-icon-subtle"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
          <section className="flex min-w-0 flex-col gap-3 xl:col-start-1 xl:row-start-1">
            <div className="flex flex-col gap-1">
              <h2 className="text-h3">최근 회고</h2>
              <p className="text-body-s text-muted-foreground">
                Club 에 최근 올라온 회고입니다. Project 회고는 Project 화면에서,
                Session 회고는 Session 의 회고 탭에서 씁니다.
              </p>
            </div>
            {recent.status === "error" ? (
              <p className="rounded-xl border bg-card p-5 text-muted-foreground">
                회고를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.
              </p>
            ) : items.length === 0 ? (
              <p className="rounded-xl border bg-card p-5 text-muted-foreground">
                아직 회고가 없습니다. 옆의 한 달 회고에서 이번 달을 돌아보며
                첫 회고를 남겨 보세요.
              </p>
            ) : (
              <ul className="flex flex-col divide-y rounded-xl border bg-card">
                {items.map((item) => {
                  const { kind, name, href } = place(clubId, item)
                  const preview = excerpt(item)

                  return (
                    <li key={item.id}>
                      <Link
                        href={href}
                        className="flex flex-col gap-1.5 px-5 py-4 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                      >
                        <span className="flex min-w-0 flex-wrap items-center gap-2">
                          <Badge>{kind}</Badge>
                          <span className="min-w-0 truncate text-label-m">
                            {name}
                          </span>
                          <span className="ml-auto shrink-0 text-body-s text-muted-foreground">
                            {retrospectiveAuthorName(item)} ·{" "}
                            {formatLogDate(item.createdAt, now)}
                          </span>
                        </span>
                        {preview && (
                          <span className="line-clamp-2 text-body-s break-words text-muted-foreground">
                            {preview.label}: {preview.text}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  )
}
