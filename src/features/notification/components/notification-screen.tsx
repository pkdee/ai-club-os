import Link from "next/link"
import {
  Bell,
  CircleAlert,
  ListTodo,
  RefreshCw,
  Shield,
  Sparkles,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatLogDate } from "@/features/ai-log/format"
import { formatDueDate } from "@/features/project/rules"
import { cn } from "@/lib/utils"

import type { Notification } from "../items"
import type { NotificationsResult } from "../queries"
import { MarkSeenButton } from "./mark-seen-button"

const ICONS: Record<Notification["kind"], LucideIcon> = {
  "join-request": UserPlus,
  task: ListTodo,
  accepted: UserCheck,
  admin: Shield,
  insight: Sparkles,
}

// 알림 한 줄에 보여 줄 글과 누르면 갈 곳.
function describe(clubId: string, item: Notification, today: string) {
  const base = `/clubs/${clubId}`

  switch (item.kind) {
    case "join-request":
      return {
        href: `${base}/projects/${item.projectId}`,
        title: `${item.requesterName} 님이 참여를 요청했습니다`,
        detail: item.ownerless
          ? `${item.projectName} · 참여자가 없어 운영자가 받아 줍니다`
          : item.projectName,
      }
    case "task":
      return {
        href: `${base}/projects/${item.projectId}`,
        title: item.title,
        detail: [
          item.projectName,
          item.dueOn && `${formatDueDate(item.dueOn, today)}까지`,
        ]
          .filter(Boolean)
          .join(" · "),
      }
    case "accepted":
      return {
        href: `${base}/projects/${item.projectId}`,
        // 요청이 받아들여진 것과 참여자가 나를 직접 넣은 것을 가르지 않는다. 둘 다 참여자가 된 것이다.
        title: "Project 의 참여자가 됐습니다",
        detail: item.projectName,
      }
    case "admin":
      return {
        href: `${base}/members`,
        title: "이 Club 의 운영자가 됐습니다",
        detail:
          "Member 를 초대하고 Session 을 만들 수 있습니다. 맡기 어려우면 다른 사람을 운영자로 지정한 뒤 구성원으로 내려올 수 있습니다.",
      }
    case "insight":
      return {
        href: item.sessionId
          ? `${base}/sessions/${item.sessionId}/insight`
          : `${base}/insights/${item.month ?? ""}`,
        title: "AI Insight 가 공개됐습니다",
        detail: item.title,
      }
  }
}

function Group({
  title,
  description,
  clubId,
  items,
  today,
  now,
}: {
  title: string
  description: string
  clubId: string
  items: Notification[]
  today: string
  now: Date
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">{title}</h2>
        <p className="text-body-s text-muted-foreground">{description}</p>
      </div>
      <ul className="flex flex-col divide-y rounded-xl border bg-card">
        {items.map((item) => {
          const Icon = ICONS[item.kind]
          const { href, title: text, detail } = describe(clubId, item, today)

          return (
            <li key={`${item.kind}:${item.id}`}>
              <Link
                href={href}
                className="flex items-start gap-3 p-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="mt-0.5 size-5 shrink-0 text-icon-subtle"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 break-words text-label-m">
                      {text}
                    </span>
                    {item.isNew && <Badge tone="brand">새 알림</Badge>}
                    {item.due && (
                      <Badge tone={item.due === "overdue" ? "danger" : "warning"}>
                        {item.due === "overdue" ? "기한 지남" : "기한 임박"}
                      </Badge>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-body-s break-words text-muted-foreground"
                    )}
                  >
                    {detail}
                  </span>
                </span>
                {item.at && (
                  <span className="shrink-0 text-caption text-muted-foreground">
                    {formatLogDate(item.at, now)}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// 내가 이 Club 에서 봐야 할 것을 모아 보여 주는 화면.
// today 는 한국 시간의 오늘 날짜다.
export function NotificationScreen({
  clubId,
  result,
  today,
  now,
}: {
  clubId: string
  result: NotificationsResult
  today: string
  now: Date
}) {
  const items = result.status === "ok" ? result.items : []
  const attention = items.filter((item) => item.needsAttention)
  const news = items.filter((item) => !item.needsAttention)

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h1">알림</h1>
          <p className="text-muted-foreground">
            이 Club 에서 내가 챙길 것과 새 소식을 모아 보여 줍니다.
          </p>
        </div>
        {items.some((item) => item.isNew) && <MarkSeenButton clubId={clubId} />}
      </div>
      {result.status !== "ok" ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <CircleAlert strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>
                {result.status === "unavailable"
                  ? "알림을 아직 쓸 수 없습니다"
                  : "알림을 불러오지 못했습니다"}
              </EmptyTitle>
              <EmptyDescription>
                {result.status === "unavailable"
                  ? "데이터베이스에 알림의 구조가 아직 없습니다. 최신 마이그레이션을 적용하면 여기에 보입니다."
                  : "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요."}
              </EmptyDescription>
            </EmptyHeader>
            {result.status === "error" && (
              <EmptyContent>
                <Link
                  href={`/clubs/${clubId}/notifications`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <RefreshCw aria-hidden="true" strokeWidth={1.5} />
                  다시 시도
                </Link>
              </EmptyContent>
            )}
          </Empty>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Bell strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>지금은 알림이 없습니다</EmptyTitle>
              <EmptyDescription>
                참여 요청이 들어오거나, 할 일을 맡거나, AI Insight 가 공개되면
                여기에 보입니다.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <>
          <Group
            title="챙길 것"
            description="들어온 참여 요청과, 기한이 오늘이나 내일까지이거나 지난 할 일입니다. 처리할 때까지 남습니다."
            clubId={clubId}
            items={attention}
            today={today}
            now={now}
          />
          <Group
            title="소식"
            description="내가 맡은 할 일과, 최근 2주 사이에 참여자가 된 Project, 운영자가 된 것, 공개된 AI Insight 입니다."
            clubId={clubId}
            items={news}
            today={today}
            now={now}
          />
        </>
      )}
    </>
  )
}
