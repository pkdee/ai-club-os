import Link from "next/link"
import {
  CircleArrowRight,
  Lightbulb,
  Repeat,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import {
  INSIGHT_SHOWN_REFS,
  type InsightContent,
  type InsightItem,
} from "../content"

// 항목의 근거가 된 기록. 앞의 몇 개는 제목으로 보여 주고 나머지는 수로 알린다.
// 지워진 기록은 제목을 알 수 없어 수에서도 뺀다.
function Sources({
  clubId,
  logIds,
  logTitles,
}: {
  clubId: string
  logIds: string[]
  logTitles: Record<string, string>
}) {
  const shown = logIds
    .slice(0, INSIGHT_SHOWN_REFS)
    .filter((id) => logTitles[id] !== undefined)
  if (shown.length === 0) {
    return null
  }
  const more = logIds.length - INSIGHT_SHOWN_REFS

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
      <span>근거 기록</span>
      {shown.map((id) => (
        <Link
          key={id}
          href={`/clubs/${clubId}/logs/${id}`}
          className="max-w-full truncate rounded-sm underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {logTitles[id]}
        </Link>
      ))}
      {more > 0 && <span>외 {more}개</span>}
    </p>
  )
}

function Heading({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <h2 className="flex items-center gap-2 text-h4">
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-5 shrink-0 text-icon-brand"
      />
      {children}
    </h2>
  )
}

function ItemList({
  icon,
  title,
  items,
  clubId,
  logTitles,
}: {
  icon: LucideIcon
  title: string
  items: InsightItem[]
  clubId: string
  logTitles: Record<string, string>
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:p-6">
      <Heading icon={icon}>{title}</Heading>
      <ul className="flex flex-col gap-4">
        {items.map((item, index) => (
          <li key={index} className="flex flex-col gap-1">
            <p className="whitespace-pre-wrap">{item.text}</p>
            <Sources clubId={clubId} logIds={item.logIds} logTitles={logTitles} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// AI Insight 의 내용을 읽기 좋게 보여 준다. 비어 있는 묶음은 그리지 않는다.
// logTitles 는 근거 기록의 식별자별 제목이다.
export function InsightView({
  clubId,
  content,
  logTitles,
}: {
  clubId: string
  content: InsightContent
  logTitles: Record<string, string>
}) {
  return (
    <div className="flex flex-col gap-6">
      {content.overview && (
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:p-6">
          <Heading icon={Sparkles}>요약</Heading>
          <p className="text-body-l whitespace-pre-wrap">{content.overview}</p>
        </section>
      )}
      {content.themes.length > 0 && (
        <section className="flex flex-col gap-3">
          <Heading icon={Repeat}>반복된 주제</Heading>
          <ul className="grid gap-4 md:grid-cols-2">
            {content.themes.map((theme, index) => (
              <li
                key={index}
                className="flex flex-col gap-2 rounded-xl border bg-card p-5"
              >
                <h3 className="text-label-l">{theme.title}</h3>
                {theme.summary && (
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {theme.summary}
                  </p>
                )}
                <Sources
                  clubId={clubId}
                  logIds={theme.logIds}
                  logTitles={logTitles}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <ItemList
          icon={Lightbulb}
          title="배운 점"
          items={content.lessons}
          clubId={clubId}
          logTitles={logTitles}
        />
        <ItemList
          icon={CircleArrowRight}
          title="다음 행동"
          items={content.nextActions}
          clubId={clubId}
          logTitles={logTitles}
        />
      </div>
    </div>
  )
}
