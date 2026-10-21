import {
  PanelSkeleton,
  SkeletonRegion,
  TextSkeleton,
} from "@/components/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

// 공개 발표 화면을 불러오는 동안 보여 준다. 로그인하지 않은 사람도 보므로 프로필 자리 없이
// PresentationView 의 머리 막대와 가운데 열을 닮게 그린다.
export function PresentationSkeleton() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <div
        aria-hidden="true"
        className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-card px-4 sm:px-8"
      >
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
      <SkeletonRegion className="mx-auto w-full max-w-[880px] flex-1 gap-10 px-4 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-2">
          <TextSkeleton size="overline" className="w-20" />
          <TextSkeleton size="display-l" className="w-80" />
          <TextSkeleton size="body-l" className="w-full" />
          <TextSkeleton size="body-l" className="w-2/3" />
        </div>
        <PanelSkeleton lines={3} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-1 rounded-xl border bg-card p-5"
            >
              <TextSkeleton size="body-s" className="w-16" />
              <TextSkeleton size="h2" className="w-12" />
            </div>
          ))}
        </div>
      </SkeletonRegion>
    </div>
  )
}

// 발표 모드를 불러오는 동안 보여 준다. SlideDeck 처럼 화면 높이를 머리 막대, 가운데 장, 아래 막대로 나눈다.
export function SlidesSkeleton() {
  return (
    <div className="flex h-dvh flex-1 flex-col bg-app">
      <div
        aria-hidden="true"
        className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4 sm:px-6"
      >
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton className="ml-auto h-8 w-20" />
        <Skeleton className="size-8" />
      </div>
      <SkeletonRegion className="mx-auto w-full max-w-[880px] flex-1 justify-center px-4 py-8 sm:px-6">
        <TextSkeleton size="overline" className="w-20" />
        <TextSkeleton size="display-l" className="w-80" />
        <div className="flex flex-col">
          <TextSkeleton size="body-l" className="w-full" />
          <TextSkeleton size="body-l" className="w-2/3" />
        </div>
      </SkeletonRegion>
      <div aria-hidden="true" className="shrink-0 border-t bg-card">
        <Skeleton className="h-1 w-full rounded-none" />
        <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
          <Skeleton className="size-10" />
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="size-10 justify-self-end" />
        </div>
      </div>
    </div>
  )
}
