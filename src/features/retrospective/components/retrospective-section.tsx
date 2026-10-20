import { DeleteDialog } from "@/components/delete-dialog"
import { insightProviderInfo } from "@/features/ai-insight/provider"

import { deleteRetrospective } from "../actions"
import type { RetrospectiveListResult } from "../queries"
import type { RetrospectiveTarget } from "../rules"
import { RetrospectiveCard } from "./retrospective-card"
import { RetrospectiveFormDialog } from "./retrospective-form-dialog"

// 한 대상의 회고를 모아 보여 주고, 내 회고를 쓰게 하는 영역.
// Project 화면, Session 의 회고 탭, 한 달 회고 화면이 함께 쓴다.
// subject 는 무엇을 돌아보는지 알리는 이름이다. canWrite 는 내가 여기에 회고를 쓸 수 있다는 뜻이고,
// 실제 판단은 데이터베이스가 한다. cannotWriteText 는 쓸 수 없을 때의 까닭이다.
// 회고의 구조가 아직 없으면 아무것도 그리지 않는다.
export function RetrospectiveSection({
  clubId,
  target,
  subject,
  title = "회고",
  description,
  result,
  currentUserId,
  isAdmin,
  canWrite,
  cannotWriteText,
  now,
}: {
  clubId: string
  target: RetrospectiveTarget
  subject: string
  title?: string
  description?: string
  result: RetrospectiveListResult
  currentUserId: string
  isAdmin: boolean
  canWrite: boolean
  cannotWriteText?: string
  now: Date
}) {
  if (result.status === "unavailable") {
    return null
  }

  const all = result.status === "ok" ? result.retrospectives : []
  const optionsReady = result.status === "ok" && result.optionsReady
  // Project 회고는 AI Insight 에 쓰이지 않으므로 알릴 것이 없다.
  const insightNotice =
    target.scope === "project" ? null : (insightProviderInfo()?.dataNotice ?? null)
  const mine = all.find((item) => item.author?.userId === currentUserId)
  // 내 회고를 맨 앞에 둔다.
  const ordered = mine ? [mine, ...all.filter((item) => item !== mine)] : all

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-h3">
            {title}
            {all.length > 0 && (
              <span className="ml-2 text-body-s text-muted-foreground">
                {all.length}개
              </span>
            )}
          </h2>
          {description && (
            <p className="text-body-s text-muted-foreground">{description}</p>
          )}
        </div>
        {result.status === "ok" && canWrite && !mine && (
          <RetrospectiveFormDialog
            clubId={clubId}
            target={target}
            subject={subject}
            optionsReady={optionsReady}
            insightNotice={insightNotice}
          />
        )}
      </div>
      {result.status === "error" ? (
        <p className="rounded-xl border bg-card p-5 text-muted-foreground">
          회고를 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.
        </p>
      ) : ordered.length === 0 ? (
        <p className="rounded-xl border bg-card p-5 text-muted-foreground">
          {canWrite
            ? "아직 회고가 없습니다. 좋았던 것, 아쉬운 것, 다음에 해 볼 것을 한 줄씩만 적어도 됩니다."
            : `아직 회고가 없습니다. ${cannotWriteText ?? ""}`.trim()}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {ordered.map((item) => {
              const isMine = item === mine

              return (
                <RetrospectiveCard
                  key={item.id}
                  retrospective={item}
                  mine={isMine}
                  now={now}
                  actions={
                    (isMine || isAdmin) && (
                      <>
                        {isMine && (
                          <RetrospectiveFormDialog
                            clubId={clubId}
                            target={target}
                            subject={subject}
                            existing={{
                              id: item.id,
                              wentWell: item.wentWell,
                              toImprove: item.toImprove,
                              toTry: item.toTry,
                              options: item.options,
                            }}
                            optionsReady={optionsReady}
                            insightNotice={insightNotice}
                          />
                        )}
                        <DeleteDialog
                          label="삭제"
                          size="sm"
                          title="이 회고를 지울까요?"
                          description={
                            <>
                              {!isMine && (
                                <p>다른 사람이 쓴 회고입니다.</p>
                              )}
                              <p>
                                지우면 되돌릴 수 없습니다. 지웠다는 사실은
                                운영자가 볼 수 있게 남고, 적은 내용은 남지
                                않습니다.
                              </p>
                            </>
                          }
                          onDelete={deleteRetrospective.bind(
                            null,
                            clubId,
                            item.id
                          )}
                        />
                      </>
                    )
                  }
                />
              )
            })}
          </div>
          {!canWrite && !mine && cannotWriteText && (
            <p className="text-body-s text-muted-foreground">
              {cannotWriteText}
            </p>
          )}
        </>
      )}
    </section>
  )
}
