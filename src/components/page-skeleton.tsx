import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// 글자 크기마다 한 줄의 높이와 그 안에 그릴 막대의 높이. 줄 높이는 globals.css 의 글자 토큰과 같다.
// 줄 높이를 실제 글자와 맞춰 두면 내용이 들어올 때 아래가 덜 밀린다.
const TEXT = {
  "display-l": ["h-11.5", "h-9"],
  h1: ["h-9.5", "h-7"],
  h2: ["h-8", "h-6"],
  h3: ["h-7", "h-5"],
  h4: ["h-6", "h-4.5"],
  "body-l": ["h-6.5", "h-4"],
  body: ["h-5.5", "h-3.5"],
  "body-s": ["h-5", "h-3"],
  label: ["h-5", "h-3.5"],
  caption: ["h-4.5", "h-3"],
  overline: ["h-4", "h-3"],
} as const

export type SkeletonTextSize = keyof typeof TEXT

// 글 한 줄의 자리. className 으로 막대의 폭을 정한다.
export function TextSkeleton({
  size = "body",
  className,
}: {
  size?: SkeletonTextSize
  className?: string
}) {
  const [line, bar] = TEXT[size]
  return (
    <div className={cn("flex items-center", line)}>
      <Skeleton className={cn(bar, "w-full max-w-full", className)} />
    </div>
  )
}

// 화면 하나의 자리 표시를 감싼다. 화면 읽기 프로그램에는 불러오는 중이라고만 알린다.
// 덩어리 사이를 gap-6 으로 벌려 Club 안쪽 화면의 본문과 같은 간격을 둔다.
export function SkeletonRegion({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div role="status" className={cn("flex min-w-0 flex-col gap-6", className)}>
      <span className="sr-only">불러오는 중입니다.</span>
      {children}
    </div>
  )
}

// 화면의 머리말. 제목과 설명을 왼쪽에, 버튼을 오른쪽에 두고 640px 보다 좁으면 버튼을 아래로 내린다.
// actions 는 버튼마다의 폭이다. actionsClassName 으로 버튼 줄을 좁은 화면에서 감출 수 있다.
// description 을 넘기지 않으면 설명 한 줄을 그린다. null 이면 설명 자리가 없다.
export function PageHeadingSkeleton({
  title = "w-40",
  breadcrumb = false,
  badge = false,
  description,
  actions = [],
  actionsClassName,
}: {
  title?: string
  breadcrumb?: boolean
  badge?: boolean
  description?: React.ReactNode
  actions?: string[]
  actionsClassName?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {breadcrumb && <TextSkeleton size="body-s" className="w-56" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-3">
            <TextSkeleton size="h1" className={title} />
            {badge && <Skeleton className="h-5.5 w-14 shrink-0 rounded-full" />}
          </div>
          {description === undefined ? (
            <TextSkeleton className="w-80" />
          ) : (
            description
          )}
        </div>
        {actions.length > 0 && (
          <div className={cn("flex shrink-0 flex-wrap gap-2", actionsClassName)}>
            {actions.map((width, index) => (
              <Skeleton key={index} className={cn("h-10", width)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// LinkTabs 의 자리. tabs 는 탭 이름마다의 폭이다.
export function TabsSkeleton({ tabs }: { tabs: string[] }) {
  return (
    <div className="flex gap-6 overflow-hidden border-b">
      {tabs.map((width, index) => (
        <div key={index} className="flex h-10 shrink-0 items-center px-1">
          <Skeleton className={cn("h-3.5", width)} />
        </div>
      ))}
    </div>
  )
}

// 옆 칸이나 본문에 놓이는 카드 하나. 제목 아래에 lines 줄의 글과, button 이 있으면 버튼 자리를 둔다.
export function PanelSkeleton({
  lines = 2,
  button = false,
  large = false,
  className,
}: {
  lines?: number
  button?: boolean
  // 본문의 큰 카드. 안쪽 여백이 넓고 글이 크다.
  large?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card",
        large ? "gap-4 p-6" : "gap-3 p-5",
        className
      )}
    >
      <TextSkeleton size="h4" className="w-28" />
      <div className="flex flex-col">
        {Array.from({ length: lines }, (_, index) => (
          <TextSkeleton
            key={index}
            size={large ? "body-l" : "body-s"}
            className={index === lines - 1 ? "w-2/3" : "w-full"}
          />
        ))}
      </div>
      {button && <Skeleton className="h-8 w-28" />}
    </div>
  )
}

// 테두리 하나 안에 줄을 나눠 놓은 목록. 알림, 회고, Member 처럼 줄마다 아이콘이나 사진이 앞에 온다.
// avatar 가 있으면 줄 앞에 둥근 사진 자리를 둔다. meta 가 있으면 줄 오른쪽에 작은 글 자리를 둔다.
export function RowListSkeleton({
  rows = 3,
  avatar = false,
  meta = true,
}: {
  rows?: number
  avatar?: boolean
  meta?: boolean
}) {
  return (
    <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-start gap-3 p-4">
          {avatar ? (
            <Skeleton className="size-8 shrink-0 rounded-full" />
          ) : (
            <Skeleton className="size-5 shrink-0 rounded-sm" />
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <TextSkeleton size="label" className="w-40" />
            <TextSkeleton size="body-s" className="w-3/4" />
          </div>
          {meta && (
            <TextSkeleton size="caption" className="hidden w-14 sm:block" />
          )}
        </div>
      ))}
    </div>
  )
}

// 입력 칸이 놓인 카드. fields 개의 이름과 칸을 그리고, textarea 가 있으면 큰 칸을 하나 더 둔다.
export function FormCardSkeleton({
  fields = 2,
  textarea = false,
  button = false,
  className,
}: {
  fields?: number
  textarea?: boolean
  button?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6",
        className
      )}
    >
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <TextSkeleton size="label" className="w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {textarea && (
        <div className="flex flex-col gap-2">
          <TextSkeleton size="label" className="w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {button && <Skeleton className="h-10 w-20 self-end" />}
    </div>
  )
}
