"use client"

import { useState, useTransition } from "react"
import { CircleAlert, ExternalLink, Plus, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  addProjectLink,
  removeProjectLink,
  type ProjectActionResult,
} from "../actions"
import type { ProjectLink } from "../queries"
import {
  PROJECT_LINK_LABEL_MAX,
  PROJECT_LINK_URL_MAX,
  linkHost,
} from "../rules"

// Project 의 결과물로 가는 주소. 저장소, 발표 자료, 데모 같은 것을 둔다.
// 참여자와 운영자가 넣고 지운다. 주소는 새 창으로 열고, 열린 쪽에서 이 화면을 건드리지 못하게 한다.
export function ProjectLinks({
  clubId,
  projectId,
  links,
  canEdit,
}: {
  clubId: string
  projectId: string
  links: ProjectLink[]
  canEdit: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState("")
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<ProjectActionResult>, after?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        after?.()
      } else {
        setError(result.message)
      }
    })
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <h2 className="text-h4">결과물 링크</h2>
      {error && (
        <Alert tone="danger">
          <CircleAlert aria-hidden="true" strokeWidth={1.5} />
          <AlertTitle>바꾸지 못했습니다</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {links.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {links.map((link) => (
            <li key={link.id} className="flex items-center gap-2">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-2 rounded-sm transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-ring"
              >
                <ExternalLink
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-4 shrink-0 text-icon-subtle"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-label-m">{link.label}</span>
                  <span className="truncate text-caption text-muted-foreground">
                    {linkHost(link.url)}
                  </span>
                </span>
                <span className="sr-only">새 창에서 열림</span>
              </a>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  aria-label={`${link.label} 링크 지우기`}
                  onClick={() => run(() => removeProjectLink(clubId, link.id))}
                >
                  <X aria-hidden="true" strokeWidth={1.5} />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-s text-muted-foreground">
          아직 링크가 없습니다. 저장소나 발표 자료, 데모 주소를 둘 수 있습니다.
        </p>
      )}
      {canEdit &&
        (adding ? (
          <form
            className="flex flex-col gap-2 border-t pt-3"
            onSubmit={(event) => {
              event.preventDefault()
              run(
                () => addProjectLink(clubId, projectId, { label, url }),
                () => {
                  setLabel("")
                  setUrl("")
                  setAdding(false)
                }
              )
            }}
          >
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              required
              maxLength={PROJECT_LINK_LABEL_MAX}
              placeholder="이름. 예: 저장소"
              aria-label="링크의 이름"
              autoComplete="off"
            />
            <Input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
              maxLength={PROJECT_LINK_URL_MAX}
              placeholder="https://"
              aria-label="링크의 주소"
              autoComplete="off"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setAdding(false)
                  setError(null)
                }}
              >
                취소
              </Button>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "넣는 중" : "넣기"}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
            className="self-start"
          >
            <Plus aria-hidden="true" strokeWidth={1.5} />
            링크 더하기
          </Button>
        ))}
    </section>
  )
}
