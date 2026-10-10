import { ContentSkeleton } from "@/components/content-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Club 에 들어가기 전 화면의 내용을 불러오는 동안 보여 준다.
export default function RootLoading() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-app">
      <div className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 sm:px-8">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 py-12 sm:px-8">
        <ContentSkeleton />
      </main>
    </div>
  );
}
