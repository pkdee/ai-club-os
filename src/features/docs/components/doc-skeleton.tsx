import { Skeleton } from "@/components/ui/skeleton"

// 본문 한 절의 줄 길이. 마지막 줄을 짧게 해서 글이 끝나는 모양을 낸다.
const SECTIONS = [
  ["w-full", "w-full", "w-11/12", "w-3/5"],
  ["w-full", "w-10/12", "w-2/3"],
  ["w-full", "w-full", "w-4/5"],
]

// 목차 한 줄의 길이와 들여쓰기. 문서 화면의 목차처럼 ### 제목은 한 칸 더 들인다.
const TOC = [
  { width: "w-28", nested: false },
  { width: "w-24", nested: true },
  { width: "w-20", nested: true },
  { width: "w-32", nested: false },
  { width: "w-24", nested: false },
]

// 문서를 불러오는 동안 본문 칸과 목차 칸에 보여 준다. DocArticle 과 문서 화면의 목차를 닮게 그린다.
// Docs 의 layout 이 세 칸 격자이므로 두 칸을 따로 내놓는다. 왼쪽 문서 목록은 layout 이 그대로 그린다.
export function DocSkeleton() {
  return (
    <>
      <div
        role="status"
        className="flex w-full max-w-3xl min-w-0 flex-col gap-8"
      >
        <span className="sr-only">문서를 불러오는 중입니다.</span>
        <div className="flex flex-col gap-4 border-b pb-8">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <Skeleton className="h-9 w-1/2 sm:h-11" />
            <Skeleton className="h-8 w-36" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
          <Skeleton className="h-4 w-64 max-w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex flex-col gap-10">
          {SECTIONS.map((lines, index) => (
            <div key={index} className="flex flex-col gap-3">
              <Skeleton className="mb-1 h-7 w-2/5" />
              {lines.map((width, line) => (
                <Skeleton key={line} className={`h-4 ${width}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="hidden xl:sticky xl:top-8 xl:flex xl:flex-col xl:gap-3"
      >
        <Skeleton className="h-3 w-10" />
        <div className="flex flex-col gap-3 border-l py-1">
          {TOC.map((item, index) => (
            <Skeleton
              key={index}
              className={`h-3.5 ${item.width} ${item.nested ? "ml-6" : "ml-3"}`}
            />
          ))}
        </div>
      </div>
    </>
  )
}
