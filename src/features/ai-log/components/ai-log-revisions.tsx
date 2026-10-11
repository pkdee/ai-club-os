import { History } from "lucide-react"

import { formatLogDateTime } from "../format"
import { AI_LOG_REVISION_DAYS, type AiLogEdit } from "../revisions"

// AI Log 의 수정 기록. 작성자와 운영자에게만 보여 준다.
// 한 번의 수정마다 무엇이 어떻게 바뀌었는지 펼쳐 볼 수 있다. 수정한 적이 없으면 아무것도 그리지 않는다.
export function AiLogRevisions({
  edits,
  limit,
  now,
}: {
  edits: AiLogEdit[]
  // 남겨 두는 수정의 수. 안내 글에 쓴다.
  limit: number
  now: Date
}) {
  if (edits.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-h4">
          <History
            aria-hidden="true"
            strokeWidth={1.5}
            className="size-5 shrink-0 text-icon-subtle"
          />
          수정 기록 {edits.length}건
        </h2>
        <p className="text-body-s text-muted-foreground">
          작성자와 운영자에게만 보입니다. 최근 {AI_LOG_REVISION_DAYS}일 동안의
          수정이 {limit}번까지 남고, 기록을 지우면 함께 지워집니다.
        </p>
      </div>
      <ul className="flex flex-col divide-y">
        {edits.map((edit) => (
          <li key={edit.id} className="py-3 first:pt-0 last:pb-0">
            <details className="group flex flex-col">
              <summary className="cursor-pointer rounded-sm text-label-m focus-visible:outline-2 focus-visible:outline-ring">
                {formatLogDateTime(edit.at, now)} 에 고침
                <span className="pl-2 text-body-s text-muted-foreground">
                  {edit.changes.length > 0
                    ? edit.changes.map((change) => change.label).join(", ")
                    : "달라진 내용 없음"}
                </span>
              </summary>
              <div className="flex flex-col gap-4 pt-3">
                {edit.changes.map((change) => (
                  <div key={change.label} className="flex flex-col gap-2">
                    <h3 className="text-label-m">{change.label}</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex flex-col gap-1 rounded-lg bg-muted p-3">
                        <span className="text-caption text-muted-foreground">
                          고치기 전
                        </span>
                        <p className="text-body-s break-words whitespace-pre-wrap">
                          {change.before || "비어 있음"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg border p-3">
                        <span className="text-caption text-muted-foreground">
                          고친 뒤
                        </span>
                        <p className="text-body-s break-words whitespace-pre-wrap">
                          {change.after || "비어 있음"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}
