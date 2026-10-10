import Link from "next/link"
import {
  Calendar,
  CircleAlert,
  CircleArrowRight,
  FlaskConical,
  FolderKanban,
  Lightbulb,
  Pencil,
  Target,
  type LucideIcon,
} from "lucide-react"

import { DeleteDialog } from "@/components/delete-dialog"
import { Avatar } from "@/components/ui/avatar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { deleteAiLog } from "../actions"
import { authorName, formatLogDate, formatLogDateTime } from "../format"
import type { AiLog, AiLogSummary } from "../queries"
import { ToolChips } from "./tool-chips"

const MESSAGES = {
  "not-found": {
    title: "AI Log 를 찾을 수 없습니다",
    description: "주소가 맞는지 확인하거나 AI Log 목록에서 다시 골라 주세요.",
  },
  error: {
    title: "AI Log 를 불러오지 못했습니다",
    description:
      "연결이 끊겼거나 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.",
  },
  "not-author": {
    title: "이 기록은 고칠 수 없습니다",
    description:
      "작성자 본인만 고칠 수 있습니다. 내용은 기록 상세에서 볼 수 있습니다.",
  },
}

export function AiLogUnavailable({
  clubId,
  reason,
}: {
  clubId: string
  reason: keyof typeof MESSAGES
}) {
  const { title, description } = MESSAGES[reason]

  return (
    <div className="rounded-xl border bg-card">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <CircleAlert strokeWidth={1.5} />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            href={`/clubs/${clubId}/logs`}
            className={buttonVariants({ variant: "outline" })}
          >
            AI Log 목록으로
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}

function Part({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon
  title: string
  text: string
}) {
  // 비워 둔 항목은 보여 주지 않는다.
  if (!text) {
    return null
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-h4">
        <Icon
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-5 shrink-0 text-icon-brand"
        />
        {title}
      </h2>
      <p className="text-body-l whitespace-pre-wrap">{text}</p>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-body-s text-muted-foreground">{label}</dt>
      <dd className="text-label-m">{value}</dd>
    </div>
  )
}

// related 에는 같은 Session 의 다른 기록을 넣는다.
// canEdit 는 작성자 본인, canDelete 는 작성자 본인이거나 운영자라는 뜻이다. 실제 판단은 데이터베이스가 한다.
export function AiLogDetail({
  clubName,
  log,
  canEdit,
  canDelete,
  related,
  now,
}: {
  clubName: string
  log: AiLog
  canEdit: boolean
  canDelete: boolean
  related: AiLogSummary[]
  now: Date
}) {
  const clubHref = `/clubs/${log.clubId}`
  const name = authorName(log.author)
  const edited = log.updatedAt !== log.createdAt

  return (
    <>
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: clubName, href: clubHref },
            { label: "AI Log", href: `${clubHref}/logs` },
            { label: "기록 상세" },
          ]}
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-col gap-3">
            <h1 className="text-h1">{log.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Avatar size="sm" name={name} src={log.author?.avatarUrl} />
              <span className="text-label-m">{name}</span>
              <span className="text-caption text-muted-foreground">
                {formatLogDate(log.createdAt, now)} 작성
                {edited && ` · ${formatLogDate(log.updatedAt, now)} 수정`}
              </span>
            </div>
            {(log.session || log.project || log.tools.length > 0) && (
              <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                {log.project && (
                  <Link
                    href={`${clubHref}/projects/${log.project.id}`}
                    className="flex items-center gap-1.5 rounded-sm text-body-s text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <FolderKanban
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="size-4 shrink-0 text-icon-subtle"
                    />
                    {log.project.name}
                  </Link>
                )}
                {log.session && (
                  <Link
                    href={`${clubHref}/sessions/${log.session.id}`}
                    className="flex items-center gap-1.5 rounded-sm text-body-s text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Calendar
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="size-4 shrink-0 text-icon-subtle"
                    />
                    {log.session.title}
                  </Link>
                )}
                <ToolChips tools={log.tools} />
              </div>
            )}
          </div>
          {(canEdit || canDelete) && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {canDelete && (
                <DeleteDialog
                  label="삭제"
                  title="이 AI Log 를 지울까요?"
                  description={
                    <>
                      <p>
                        {canEdit
                          ? `내가 쓴 "${log.title}" 기록이 지워집니다.`
                          : `${name} 님이 쓴 "${log.title}" 기록이 지워집니다.`}
                      </p>
                      <p>
                        지우면 되돌릴 수 없습니다. 지웠다는 사실과 제목은
                        운영자가 볼 수 있게 남습니다.
                      </p>
                    </>
                  }
                  onDelete={deleteAiLog.bind(null, log.clubId, log.id)}
                />
              )}
              {canEdit && (
                <Link
                  href={`${clubHref}/logs/${log.id}/edit`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Pencil aria-hidden="true" strokeWidth={1.5} />
                  수정
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="flex flex-col gap-8 rounded-xl border bg-card p-6 sm:p-8">
          <Part icon={FlaskConical} title="시도한 내용" text={log.attempt} />
          <Part icon={Target} title="결과" text={log.result} />
          <Part icon={Lightbulb} title="배운 점" text={log.learned} />
          <Part icon={CircleArrowRight} title="다음 행동" text={log.nextAction} />
        </article>
        <aside className="flex flex-col gap-6">
          {related.length > 0 && (
            <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
              <h2 className="text-h4">같은 Session 의 AI Log</h2>
              <ul className="flex flex-col gap-3">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`${clubHref}/logs/${item.id}`}
                      className="flex flex-col gap-0.5 rounded-sm transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span className="text-label-m">{item.title}</span>
                      <span className="text-caption text-muted-foreground">
                        {authorName(item.author)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
            <h2 className="text-h4">기록 정보</h2>
            <dl className="flex flex-col gap-2">
              <Info label="작성" value={formatLogDateTime(log.createdAt, now)} />
              {edited && (
                <Info
                  label="마지막 수정"
                  value={formatLogDateTime(log.updatedAt, now)}
                />
              )}
              <Info label="볼 수 있는 사람" value="Club 의 Member" />
              {log.options && (
                <>
                  <Info
                    label="AI Insight"
                    value={
                      log.options.excludeFromInsight
                        ? "정리에 쓰지 않음"
                        : "정리에 쓸 수 있음"
                    }
                  />
                  <Info
                    label="발표"
                    value={
                      log.options.shareInPresentation
                        ? "넣어도 됨"
                        : "넣지 않음"
                    }
                  />
                </>
              )}
            </dl>
          </section>
        </aside>
      </div>
    </>
  )
}
