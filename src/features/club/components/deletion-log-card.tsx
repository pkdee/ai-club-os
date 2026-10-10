import { Badge } from "@/components/ui/badge"
import { kstMonthDay, kstTime } from "@/features/session/time"

import {
  DELETED_ENTITY_LABEL,
  DELETION_LOG_LIMIT,
  type DeletionLogResult,
} from "../deletions"

// 예: 10월 11일 14:30
function formatDeletedAt(value: string) {
  const { month, day } = kstMonthDay(value)
  return `${month} ${day}일 ${kstTime(value)}`
}

// 누가 언제 무엇을 지웠는지 보여 주는 영역. 운영자만 보는 Club 설정에 놓는다.
// 구조가 아직 없으면 아무것도 그리지 않는다.
export function DeletionLogCard({ result }: { result: DeletionLogResult }) {
  if (result.status === "unavailable") {
    return null
  }

  return (
    <section className="flex max-w-[720px] flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3">지운 기록</h2>
        <p className="text-body-s text-muted-foreground">
          누가 언제 무엇을 지웠는지 최근 {DELETION_LOG_LIMIT}건을 보여 줍니다.
          지운 내용은 남기지 않고 종류와 제목만 남깁니다.
        </p>
      </div>
      {result.status === "error" ? (
        <p className="text-muted-foreground">
          지운 기록을 불러오지 못했습니다. 잠시 뒤 화면을 새로 고쳐 주세요.
        </p>
      ) : result.logs.length === 0 ? (
        <p className="text-muted-foreground">아직 지운 것이 없습니다.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {result.logs.map((log) => (
            <li key={log.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-2">
                <Badge>{DELETED_ENTITY_LABEL[log.entity]}</Badge>
                <span className="min-w-0 truncate text-label-m">
                  {log.title || "제목 없음"}
                </span>
              </div>
              <p className="text-body-s text-muted-foreground">
                {log.deletedByName || "알 수 없는 사람"} 님이{" "}
                {formatDeletedAt(log.deletedAt)} 에 지움
                {log.entity === "ai_log" &&
                  ` · 작성자 ${log.ownerName ?? "탈퇴한 Member"}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
