import {
  CircleArrowRight,
  CircleCheck,
  CircleMinus,
  type LucideIcon,
} from "lucide-react"

import { Avatar } from "@/components/ui/avatar"
import { formatLogDate } from "@/features/ai-log/format"
import { cn } from "@/lib/utils"

import type { Retrospective } from "../queries"
import type { RetrospectiveInput } from "../rules"

// 세 칸을 보여 줄 때의 이름과 아이콘. 색만으로 가르지 않도록 이름을 함께 적는다.
export const RETRO_PARTS: {
  key: keyof RetrospectiveInput
  label: string
  icon: LucideIcon
  tone: string
}[] = [
  { key: "wentWell", label: "좋았던 것", icon: CircleCheck, tone: "text-icon-success" },
  { key: "toImprove", label: "아쉬운 것", icon: CircleMinus, tone: "text-icon-warning" },
  { key: "toTry", label: "다음에 해 볼 것", icon: CircleArrowRight, tone: "text-icon-brand" },
]

// 작성자가 Club 에서 빠진 회고에 보여 주는 이름.
export function retrospectiveAuthorName(retrospective: Retrospective) {
  return retrospective.author ? retrospective.author.name : "탈퇴한 Member"
}

// 쓴 뒤에 고쳤는지. 저장하면서 생기는 작은 시각 차이는 고친 것으로 보지 않는다.
function wasEdited(retrospective: Retrospective) {
  return (
    new Date(retrospective.updatedAt).getTime() -
      new Date(retrospective.createdAt).getTime() >
    1000
  )
}

// 회고 하나. 적은 칸만 보여 준다. mine 이면 내가 쓴 것임을 알린다.
// actions 에는 고치기와 지우기 버튼을 넣는다.
export function RetrospectiveCard({
  retrospective,
  mine = false,
  now,
  actions,
}: {
  retrospective: Retrospective
  mine?: boolean
  now: Date
  actions?: React.ReactNode
}) {
  const name = retrospectiveAuthorName(retrospective)

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            size="sm"
            name={name}
            src={retrospective.author?.avatarUrl ?? null}
          />
          <span className="min-w-0 truncate text-label-m">{name}</span>
          {mine && (
            <span className="shrink-0 rounded-full bg-muted px-2 text-label-s text-muted-foreground">
              나
            </span>
          )}
          <span className="shrink-0 text-body-s text-muted-foreground">
            {formatLogDate(retrospective.createdAt, now)}
            {wasEdited(retrospective) && " · 수정됨"}
          </span>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {RETRO_PARTS.map(
        ({ key, label, icon: Icon, tone }) =>
          retrospective[key] && (
            <div key={key} className="flex flex-col gap-1.5">
              <h3 className="flex items-center gap-2 text-label-m">
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className={cn("size-4 shrink-0", tone)}
                />
                {label}
              </h3>
              <p className="break-words whitespace-pre-wrap">
                {retrospective[key]}
              </p>
            </div>
          )
      )}
    </article>
  )
}
