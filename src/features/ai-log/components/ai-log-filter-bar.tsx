"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

import {
  AI_LOG_SEARCH_MAX,
  NO_SESSION,
  logsHref,
  parseLogFilters,
  type AiLogFilters,
} from "../filters"

// AI Log 목록을 찾고 고르는 칸. 조건은 주소에 담겨서 새로 고치거나 주소를 공유해도 그대로다.
// 고르는 칸은 바꾸는 즉시, 찾는 글자는 Enter 를 누르면 적용된다.
export function AiLogFilterBar({
  clubId,
  filters,
  sessions,
  tools,
}: {
  clubId: string
  filters: AiLogFilters
  sessions: { id: string; title: string }[]
  tools: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function apply(form: HTMLFormElement) {
    const data = new FormData(form)
    const value = (name: string) => String(data.get(name) ?? "")
    // 조건이 바뀌면 처음 묶음부터 다시 본다.
    const next = parseLogFilters({
      view: filters.view === "mine" ? "mine" : undefined,
      q: value("q"),
      session: value("session"),
      tool: value("tool"),
      sort: value("sort"),
    })

    startTransition(() => {
      router.push(logsHref(clubId, next), { scroll: false })
    })
  }

  function applyOnChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const form = event.currentTarget.form
    if (form) {
      apply(form)
    }
  }

  return (
    <form
      role="search"
      action={`/clubs/${clubId}/logs`}
      method="get"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault()
        apply(event.currentTarget)
      }}
      className="flex flex-wrap gap-2"
    >
      {filters.view === "mine" && <input type="hidden" name="view" value="mine" />}
      <div className="relative min-w-52 flex-1">
        <Search
          aria-hidden="true"
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-icon-subtle"
        />
        <Input
          type="search"
          name="q"
          defaultValue={filters.query}
          maxLength={AI_LOG_SEARCH_MAX}
          placeholder="제목, 내용, 도구로 검색"
          aria-label="AI Log 검색"
          enterKeyHint="search"
          autoComplete="off"
          className="pl-9"
        />
      </div>
      <NativeSelect
        name="session"
        defaultValue={filters.session ?? ""}
        aria-label="Session 으로 고르기"
        onChange={applyOnChange}
        className="w-full sm:w-48"
      >
        <option value="">모든 Session</option>
        <option value={NO_SESSION}>Session 없는 기록</option>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.title}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        name="tool"
        defaultValue={filters.tool ?? ""}
        aria-label="도구로 고르기"
        onChange={applyOnChange}
        className="min-w-0 flex-1 sm:w-40 sm:flex-none"
      >
        <option value="">모든 도구</option>
        {tools.map((tool) => (
          <option key={tool} value={tool}>
            {tool}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        name="sort"
        defaultValue={filters.sort}
        aria-label="정렬"
        onChange={applyOnChange}
        className="min-w-0 flex-1 sm:w-32 sm:flex-none"
      >
        <option value="newest">최신순</option>
        <option value="oldest">오래된순</option>
      </NativeSelect>
      <button type="submit" className="sr-only">
        검색
      </button>
      <span role="status" className="sr-only">
        {pending ? "찾는 중입니다." : ""}
      </span>
    </form>
  )
}
