import { Skeleton } from "@/components/ui/skeleton"

const SIDEBAR_ITEMS = ["w-10", "w-16", "w-14", "w-20", "w-14", "w-10", "w-16", "w-12"]
const TABBAR_ITEMS = 6

// Club 의 틀(ClubShell)을 불러오는 동안 보여 준다. 처음 Club 에 들어오거나 새로고침할 때
// Club 의 layout 이 사용자와 Club 을 읽는 사이에 쓴다. 칸의 크기와 자리를 ClubShell 과 같게 둬서
// 틀이 들어올 때 화면이 움직이지 않게 한다. 본문 자리에는 children 을 둔다.
export function ClubShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <div
        aria-hidden="true"
        className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-app px-3 py-4 lg:sticky lg:top-0 lg:flex lg:h-dvh"
      >
        <div className="flex items-center gap-3 p-2">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          {SIDEBAR_ITEMS.map((width, index) => (
            <div key={index} className="flex h-9 items-center gap-3 px-3">
              <Skeleton className="size-5 shrink-0 rounded-sm" />
              <Skeleton className={`h-3.5 ${width}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          aria-hidden="true"
          className="flex h-14 shrink-0 items-center gap-1 border-b bg-card px-2 lg:h-16 lg:px-10"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4 pl-3 lg:hidden">
            <Skeleton className="size-5 shrink-0 rounded-sm" />
            <Skeleton className="h-4.5 w-32" />
          </div>
          <div className="flex shrink-0 items-center gap-4 pr-1 lg:ml-auto">
            <Skeleton className="h-8.5 w-23.5 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[85rem] min-w-0 flex-1 flex-col gap-6 px-4 py-8 lg:px-10 lg:pb-12">
          {children}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="sticky bottom-0 flex h-16 shrink-0 items-center justify-around border-t bg-card lg:hidden"
      >
        {Array.from({ length: TABBAR_ITEMS }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-1.5">
            <Skeleton className="size-5 rounded-sm" />
            <Skeleton className="h-2.5 w-9" />
          </div>
        ))}
      </div>
    </div>
  )
}
