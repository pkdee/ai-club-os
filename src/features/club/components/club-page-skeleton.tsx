import { ContentSkeleton } from "@/components/content-skeleton"
import {
  FormCardSkeleton,
  PageHeadingSkeleton,
  PanelSkeleton,
  RowListSkeleton,
  SkeletonRegion,
  TabsSkeleton,
  TextSkeleton,
} from "@/components/page-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { DocSkeleton } from "@/features/docs/components/doc-skeleton"
import type { ClubPage, SessionTab } from "@/lib/skeleton-route"

// Club 안쪽 화면들의 자리 표시. 화면마다 실제 모양을 닮게 그린다.
// 어느 화면인지는 loading.tsx 가 주소로 골라 넘긴다. 운영자에게만 보이는 버튼과 칸은 그리지 않는다.

// 본문과 20rem 옆 칸. 좁은 화면에서는 한 칸으로 쌓는다.
const TWO_COLUMNS =
  "grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
// 옆 칸을 DOM 에서 먼저 두고 넓은 화면에서 오른쪽으로 보낼 때 쓴다. 좁은 화면에서는 옆 칸이 위에 온다.
const ASIDE_FIRST = "flex flex-col gap-6 xl:col-start-2 xl:row-start-1"
const MAIN_AFTER = "flex min-w-0 flex-col gap-6 xl:col-start-1 xl:row-start-1"

function Badge({ className = "w-14" }: { className?: string }) {
  return <Skeleton className={`h-5.5 shrink-0 rounded-full ${className}`} />
}

function AiLogCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <Skeleton className="size-6 shrink-0 rounded-full" />
        <TextSkeleton size="label" className="w-16" />
        <TextSkeleton size="caption" className="w-12" />
      </div>
      <TextSkeleton size="h4" className="w-56" />
      <div className="flex flex-col">
        <TextSkeleton className="w-full" />
        <TextSkeleton className="w-3/4" />
      </div>
      <div className="flex gap-2">
        <Badge className="w-16" />
        <Badge className="w-20" />
      </div>
    </div>
  )
}

function AiLogSectionSkeleton({ cards }: { cards: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <TextSkeleton size="h3" className="w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      {Array.from({ length: cards }, (_, index) => (
        <AiLogCardSkeleton key={index} />
      ))}
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 sm:p-5">
      <TextSkeleton size="body-s" className="w-16" />
      <TextSkeleton size="h1" className="w-14" />
      <TextSkeleton size="caption" className="w-24" />
    </div>
  )
}

function SessionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
      <Skeleton className="h-16 w-14 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <TextSkeleton size="h4" className="w-28 sm:w-40" />
          <Badge className="w-12" />
        </div>
        <TextSkeleton size="body-s" className="w-40 sm:w-48" />
      </div>
      <Skeleton className="size-5 shrink-0 rounded-sm" />
    </div>
  )
}

function ProjectCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <TextSkeleton size="h4" className="w-36" />
        <Badge />
      </div>
      <div className="flex flex-1 flex-col">
        <TextSkeleton className="w-full" />
        <TextSkeleton className="w-2/3" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex -space-x-1.5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton
              key={index}
              className="size-6 rounded-full ring-2 ring-card"
            />
          ))}
        </div>
        <TextSkeleton size="caption" className="w-28" />
      </div>
    </div>
  )
}

function InsightCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-5">
      <TextSkeleton size="caption" className="w-40" />
      <TextSkeleton size="h4" className="w-64" />
      <div className="flex flex-col">
        <TextSkeleton className="w-full" />
        <TextSkeleton className="w-2/3" />
      </div>
    </div>
  )
}

function RetroCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <Skeleton className="size-6 shrink-0 rounded-full" />
        <TextSkeleton size="label" className="w-16" />
        <TextSkeleton size="caption" className="w-14" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex flex-col gap-1">
          <TextSkeleton size="label" className="w-24" />
          <TextSkeleton className="w-full" />
          <TextSkeleton className="w-2/3" />
        </div>
      ))}
    </div>
  )
}

function RetroSectionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col">
          <TextSkeleton size="h3" className="w-20" />
          <TextSkeleton size="body-s" className="w-64" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <RetroCardSkeleton />
      <RetroCardSkeleton />
    </div>
  )
}

// Session 의 AI Insight 탭과 한 달 AI Insight 화면이 함께 쓰는 본문.
function InsightSectionSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge />
          <TextSkeleton size="body-s" className="w-40" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <PanelSkeleton large lines={3} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PanelSkeleton lines={3} />
        <PanelSkeleton lines={3} />
      </div>
    </div>
  )
}

function MemberRowsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col">
            <TextSkeleton size="label" className="w-24" />
            <TextSkeleton size="caption" className="w-40" />
          </div>
          <Badge />
          <TextSkeleton size="body-s" className="hidden w-20 sm:block" />
        </div>
      ))}
    </div>
  )
}

function SessionTabContent({ tab }: { tab: SessionTab }) {
  switch (tab) {
    case "overview":
      return (
        <div className={TWO_COLUMNS}>
          <div className="flex min-w-0 flex-col gap-6">
            <PanelSkeleton large lines={3} />
            <AiLogSectionSkeleton cards={2} />
          </div>
          <div className="flex flex-col gap-6">
            <PanelSkeleton lines={3} button />
            <PanelSkeleton lines={2} button />
          </div>
        </div>
      )
    case "attendance":
      return (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2 rounded-xl border bg-card px-5 py-4">
            {Array.from({ length: 5 }, (_, index) => (
              <Badge key={index} className="w-16" />
            ))}
          </div>
          <MemberRowsSkeleton rows={5} />
        </div>
      )
    case "logs":
      return (
        <div className={TWO_COLUMNS}>
          <div className="flex min-w-0 flex-col gap-3">
            <TextSkeleton size="h3" className="w-28" />
            <AiLogCardSkeleton />
            <AiLogCardSkeleton />
          </div>
          <PanelSkeleton lines={4} />
        </div>
      )
    case "insight":
      return <InsightSectionSkeleton />
    case "retros":
      return <RetroSectionSkeleton />
  }
}

// Session 상세에서 탭의 내용만 바뀔 때 쓴다. 머리말과 탭은 그대로 남아 있다.
export function SessionTabSkeleton({ tab }: { tab: SessionTab }) {
  return (
    <SkeletonRegion>
      <SessionTabContent tab={tab} />
    </SkeletonRegion>
  )
}

function ClubPageContent({ page }: { page: ClubPage }) {
  switch (page.kind) {
    case "overview":
      return (
        <>
          <PageHeadingSkeleton title="w-48" actions={["w-28"]} />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <StatSkeleton key={index} />
            ))}
          </div>
          <div className={TWO_COLUMNS}>
            <div className={ASIDE_FIRST}>
              <PanelSkeleton lines={3} />
              <PanelSkeleton lines={2} button />
            </div>
            <div className={MAIN_AFTER}>
              <AiLogSectionSkeleton cards={3} />
            </div>
          </div>
        </>
      )
    case "sessions":
      return (
        <>
          <PageHeadingSkeleton title="w-32" />
          {[3, 2].map((rows, index) => (
            <div key={index} className="flex flex-col gap-3">
              <TextSkeleton size="h4" className="w-28" />
              {Array.from({ length: rows }, (_, row) => (
                <SessionRowSkeleton key={row} />
              ))}
            </div>
          ))}
        </>
      )
    case "session":
      return (
        <>
          <PageHeadingSkeleton
            breadcrumb
            badge
            title="w-56"
            description={<TextSkeleton size="body-s" className="w-64" />}
            actions={["w-28"]}
          />
          <TabsSkeleton tabs={["w-8", "w-24", "w-16", "w-20", "w-10"]} />
          <SessionTabContent tab={page.tab} />
        </>
      )
    case "logs":
      return (
        <>
          <PageHeadingSkeleton title="w-28" actions={["w-28"]} />
          <TabsSkeleton tabs={["w-12", "w-28"]} />
          <div className={TWO_COLUMNS}>
            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 min-w-52 flex-1" />
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                  <Skeleton className="h-10 w-full sm:w-48" />
                  <Skeleton className="h-10 flex-1 sm:w-40 sm:flex-none" />
                  <Skeleton className="h-10 flex-1 sm:w-32 sm:flex-none" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <AiLogCardSkeleton />
                <AiLogCardSkeleton />
                <AiLogCardSkeleton />
              </div>
            </div>
            <div className="hidden flex-col gap-6 xl:flex">
              <PanelSkeleton lines={4} />
              <PanelSkeleton lines={3} />
            </div>
          </div>
        </>
      )
    case "log-form":
      return (
        <>
          <PageHeadingSkeleton
            breadcrumb
            title="w-36"
            description={null}
            actions={["w-16", "w-16"]}
            actionsClassName="hidden sm:flex"
          />
          <div className={TWO_COLUMNS}>
            <FormCardSkeleton fields={3} textarea />
            <div className="flex flex-col gap-6">
              <PanelSkeleton lines={2} />
              <PanelSkeleton lines={4} />
            </div>
          </div>
        </>
      )
    case "log":
      return (
        <>
          <PageHeadingSkeleton
            breadcrumb
            title="w-64"
            description={
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-6 shrink-0 rounded-full" />
                  <TextSkeleton size="label" className="w-16" />
                  <TextSkeleton size="caption" className="w-20" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="w-20" />
                  <Badge className="w-16" />
                </div>
              </div>
            }
          />
          <div className={TWO_COLUMNS}>
            <div className="flex min-w-0 flex-col gap-8 rounded-xl border bg-card p-6 sm:p-8">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-5 shrink-0 rounded-sm" />
                    <TextSkeleton size="h4" className="w-24" />
                  </div>
                  <TextSkeleton size="body-l" className="w-full" />
                  <TextSkeleton size="body-l" className="w-full" />
                  <TextSkeleton size="body-l" className="w-2/3" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-6">
              <PanelSkeleton lines={4} />
              <PanelSkeleton lines={3} />
            </div>
          </div>
        </>
      )
    case "insights":
      return (
        <>
          <PageHeadingSkeleton
            title="w-36"
            description={
              <div className="flex flex-col">
                <TextSkeleton className="w-96" />
                <TextSkeleton className="w-64" />
              </div>
            }
          />
          <div className="flex flex-col gap-3">
            <InsightCardSkeleton />
            <InsightCardSkeleton />
            <InsightCardSkeleton />
          </div>
        </>
      )
    case "insight-month":
      return (
        <>
          <PageHeadingSkeleton breadcrumb title="w-56" />
          <InsightSectionSkeleton />
        </>
      )
    case "projects":
      return (
        <>
          <PageHeadingSkeleton title="w-32" actions={["w-32"]} />
          <TabsSkeleton tabs={["w-8", "w-8", "w-14", "w-8"]} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        </>
      )
    case "project":
      return (
        <>
          <PageHeadingSkeleton
            breadcrumb
            badge
            title="w-48"
            description={null}
            actions={["w-28"]}
          />
          <div className={TWO_COLUMNS}>
            <div className="flex min-w-0 flex-col gap-6">
              <PanelSkeleton large lines={3} />
              <PanelSkeleton lines={3} />
              <AiLogSectionSkeleton cards={2} />
            </div>
            <div className="flex flex-col gap-6">
              <PanelSkeleton lines={1} button />
              <PanelSkeleton lines={3} />
              <PanelSkeleton lines={2} />
            </div>
          </div>
        </>
      )
    case "retros":
      return (
        <>
          <PageHeadingSkeleton
            title="w-20"
            description={
              <div className="flex flex-col">
                <TextSkeleton className="w-96" />
                <TextSkeleton className="w-56" />
              </div>
            }
          />
          <div className={TWO_COLUMNS}>
            <div className={ASIDE_FIRST}>
              <div className="flex flex-col gap-3">
                <TextSkeleton size="h3" className="w-24" />
                <RowListSkeleton rows={3} />
              </div>
            </div>
            <div className={MAIN_AFTER}>
              <div className="flex flex-col gap-3">
                <TextSkeleton size="h3" className="w-24" />
                <RowListSkeleton rows={4} avatar />
              </div>
            </div>
          </div>
        </>
      )
    case "retro-month":
      return (
        <>
          <PageHeadingSkeleton breadcrumb title="w-48" />
          <div className={TWO_COLUMNS}>
            <div className={ASIDE_FIRST}>
              <PanelSkeleton lines={4} />
            </div>
            <div className={MAIN_AFTER}>
              <RetroSectionSkeleton />
            </div>
          </div>
        </>
      )
    case "members":
      return (
        <>
          <PageHeadingSkeleton title="w-32" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsSkeleton tabs={["w-8", "w-12", "w-14"]} />
            <Skeleton className="h-10 w-full sm:w-72" />
          </div>
          <MemberRowsSkeleton rows={5} />
        </>
      )
    case "notifications":
      return (
        <>
          <PageHeadingSkeleton title="w-16" />
          {[3, 2].map((rows, index) => (
            <div key={index} className="flex flex-col gap-3">
              <div className="flex flex-col">
                <TextSkeleton size="h3" className="w-20" />
                <TextSkeleton size="body-s" className="w-64" />
              </div>
              <RowListSkeleton rows={rows} />
            </div>
          ))}
        </>
      )
    case "settings":
      return (
        <>
          <PageHeadingSkeleton title="w-20" />
          <FormCardSkeleton fields={2} button className="max-w-[720px]" />
          <PanelSkeleton lines={1} button className="max-w-[720px]" />
        </>
      )
    case "docs":
      // Docs 의 layout 과 같은 격자에 왼쪽 문서 목록과 본문, 목차 자리를 둔다.
      return (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[12rem_minmax(0,48rem)] lg:justify-center xl:grid-cols-[12rem_minmax(0,48rem)_12rem] 2xl:grid-cols-[14rem_minmax(0,48rem)_14rem] 2xl:gap-12">
          <div className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-8">
            <TextSkeleton size="overline" className="w-10" />
            <div className="flex gap-1 overflow-hidden lg:flex-col">
              {["w-16", "w-32", "w-32"].map((width, index) => (
                <div
                  key={index}
                  className="flex h-9 shrink-0 items-center px-3"
                >
                  <Skeleton className={`h-3.5 ${width}`} />
                </div>
              ))}
            </div>
          </div>
          <DocSkeleton />
        </div>
      )
    case "other":
      return <ContentSkeleton />
  }
}

// Club 안쪽 화면 하나의 자리 표시. Club 의 틀 안, 본문 자리에 놓인다.
export function ClubPageSkeleton({ page }: { page: ClubPage }) {
  // Docs 와 그 밖의 화면의 자리 표시는 스스로 불러오는 중이라고 알린다.
  if (page.kind === "docs" || page.kind === "other") {
    return <ClubPageContent page={page} />
  }
  return (
    <SkeletonRegion>
      <ClubPageContent page={page} />
    </SkeletonRegion>
  )
}
