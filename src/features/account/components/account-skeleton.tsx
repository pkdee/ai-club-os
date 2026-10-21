import {
  PanelSkeleton,
  SkeletonRegion,
  TextSkeleton,
} from "@/components/page-skeleton"

// 내 계정 화면을 불러오는 동안 보여 준다. AccountScreen 과 같은 폭에 카드 세 장을 둔다.
export function AccountSkeleton() {
  return (
    <SkeletonRegion className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-3">
        <TextSkeleton size="body-s" className="w-28" />
        <TextSkeleton size="h1" className="w-28" />
      </div>
      <PanelSkeleton large lines={2} />
      <PanelSkeleton large lines={2} />
      <PanelSkeleton large lines={3} />
    </SkeletonRegion>
  )
}
