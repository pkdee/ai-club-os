import { SkeletonRegion, TextSkeleton } from "@/components/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

// 초대 링크로 들어온 화면을 불러오는 동안 보여 준다. JoinScreen 과 같은 폭에 카드 한 장을 둔다.
export function JoinSkeleton() {
  return (
    <SkeletonRegion className="mx-auto w-full max-w-[520px] px-4 py-12 sm:px-8">
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-1">
          <TextSkeleton size="overline" className="w-16" />
          <TextSkeleton size="h1" className="w-48" />
          <TextSkeleton className="w-full" />
          <TextSkeleton className="w-2/3" />
        </div>
        <div className="flex flex-col gap-1 border-t pt-6">
          <TextSkeleton size="body-s" className="w-full" />
          <TextSkeleton size="body-s" className="w-3/4" />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Skeleton className="h-10 w-full sm:w-20" />
          <Skeleton className="h-10 w-full sm:w-28" />
        </div>
      </div>
    </SkeletonRegion>
  )
}
