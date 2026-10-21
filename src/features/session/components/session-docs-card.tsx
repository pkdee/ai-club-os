import Link from "next/link"
import { BookOpen } from "lucide-react"

import {
  LinkPicker,
  UnlinkButton,
  type LinkActionResult,
} from "@/components/link-controls"
import type { DocEntry } from "@/features/docs/catalog"

// 이 회차의 참고 자료. Session 개요의 옆 칸에 놓는다.
// docs 는 이어 둔 문서 가운데 Docs 목록에 아직 있는 것이다. 누르면 그 문서를 연다.
// linkable 은 더 가져올 수 있는 문서다. 운영자에게만 온다. null 이면 가져올 수 없거나 그 구조가 아직 없는 것이다.
// onLink 와 unlink 는 가져오고 빼는 동작이다. 실제 판단은 데이터베이스가 한다.
// notReady 는 데이터베이스에 잇는 구조가 아직 없다는 뜻이다. 운영자에게만 넘겨 무엇을 해야 하는지 알린다.
// 가져온 것도 가져올 것도 없으면 아무것도 그리지 않는다.
export function SessionDocsCard({
  clubId,
  docs,
  linkable = null,
  onLink,
  unlink,
  notReady = false,
}: {
  clubId: string
  docs: DocEntry[]
  linkable?: { id: string; name: string }[] | null
  onLink?: (slug: string) => Promise<LinkActionResult>
  unlink?: (slug: string) => () => Promise<LinkActionResult>
  notReady?: boolean
}) {
  const canLink = Boolean(onLink && linkable && linkable.length > 0)
  if (notReady) {
    return (
      <section className="flex flex-col gap-1 rounded-xl border bg-card p-5">
        <h2 className="text-h4">참고 자료</h2>
        <p className="text-body-s text-muted-foreground">
          Docs 의 문서를 이 회차의 참고 자료로 가져오려면 데이터베이스에 최신
          마이그레이션을 적용해야 합니다. 적용하면 여기에서 문서를 고를 수
          있습니다.
        </p>
      </section>
    )
  }
  if (docs.length === 0 && !canLink) {
    return null
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">참고 자료</h2>
        <p className="text-body-s text-muted-foreground">
          이 회차에 앞서 읽어 두면 좋은 Docs 의 문서입니다.
        </p>
      </div>
      {docs.length > 0 && (
        <ul className="flex flex-col gap-1">
          {docs.map((doc) => (
            <li key={doc.slug} className="flex items-start gap-1">
              <Link
                href={`/clubs/${clubId}/docs/${doc.slug}`}
                className="flex min-w-0 flex-1 items-start gap-2 rounded-md py-1 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"
              >
                <BookOpen
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="mt-0.5 size-4 shrink-0 text-icon-subtle"
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-label-m">{doc.title}</span>
                  {doc.description && (
                    <span className="line-clamp-2 text-body-s text-muted-foreground">
                      {doc.description}
                    </span>
                  )}
                </span>
              </Link>
              {unlink && (
                <UnlinkButton
                  label={`참고 자료에서 ${doc.title} 빼기`}
                  onUnlink={unlink(doc.slug)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {onLink && linkable && (
        <LinkPicker
          label="가져올 문서"
          actionLabel="가져오기"
          options={linkable}
          onLink={onLink}
        />
      )}
    </section>
  )
}
