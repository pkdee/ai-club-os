import { Skeleton } from "@/components/ui/skeleton"

// 화면의 내용을 불러오는 동안 보여 주는 자리 표시. Figma 의 "불러오는 중" 화면을 옮긴 것이다.
// heading 을 끄면 제목 자리 없이 카드만 보여 준다.
export function ContentSkeleton({
  cards = 3,
  heading = true,
}: {
  cards?: number
  heading?: boolean
}) {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">불러오는 중입니다.</span>
      {heading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      )}
      <div className="flex flex-col gap-3">
        {Array.from({ length: cards }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border bg-card p-5"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
