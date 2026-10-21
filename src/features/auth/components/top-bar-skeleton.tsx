import { Skeleton } from "@/components/ui/skeleton"

// Club 밖 화면의 상단 막대(TopBar)를 불러오는 동안 보여 준다. 높이와 여백을 TopBar 와 같게 둔다.
export function TopBarSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-8"
    >
      <Skeleton className="h-6 w-28" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-8.5 w-23.5 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="hidden h-3.5 w-16 sm:block" />
        </div>
      </div>
    </div>
  )
}
