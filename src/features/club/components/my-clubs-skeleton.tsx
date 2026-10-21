import {
  PageHeadingSkeleton,
  SkeletonRegion,
  TextSkeleton,
} from "@/components/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

function ClubCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-11 shrink-0 rounded-lg" />
        <Skeleton className="h-5.5 w-12 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <TextSkeleton size="h3" className="w-32" />
        <div className="flex flex-col">
          <TextSkeleton size="body-s" className="w-full" />
          <TextSkeleton size="body-s" className="w-2/3" />
        </div>
      </div>
      <div className="border-t pt-3">
        <TextSkeleton size="caption" className="w-24" />
      </div>
    </div>
  )
}

// 처음 화면(내 Club 목록)을 불러오는 동안 보여 준다. MyClubsScreen 과 같은 폭과 격자를 쓴다.
export function MyClubsSkeleton() {
  return (
    <SkeletonRegion className="mx-auto w-full max-w-[1120px] gap-10 px-4 py-12 sm:px-8">
      <PageHeadingSkeleton
        title="w-20"
        description={<TextSkeleton className="w-96" />}
        actions={["w-28"]}
      />
      <div className="flex flex-col gap-4">
        <TextSkeleton size="h2" className="w-24" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ClubCardSkeleton />
          <ClubCardSkeleton />
          <ClubCardSkeleton />
        </div>
      </div>
    </SkeletonRegion>
  )
}
