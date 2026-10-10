"use client"

import { useRef, useState } from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

import {
  AI_LOG_TOOL_COUNT_MAX,
  AI_LOG_TOOL_NAME_MAX,
  canonicalTools,
} from "../rules"
import { suggestTools } from "../tool-catalog"

// 도구 이름을 하나씩 이름표로 쌓는 입력 칸.
// 적는 동안 널리 쓰는 도구와 이 Club 에서 쓰는 도구를 아래에 보여 주고, 화살표와 Enter 나 누르기로 고른다.
// 목록에 없는 도구는 적은 대로 Enter 나 쉼표로 넣는다. 빈 칸에서 Backspace 를 누르면 마지막 것을 뺀다.
// 이름표는 같은 name 의 숨은 값으로 함께 제출된다. 아직 이름표로 만들지 않은 글자도 그대로 제출되어 서버가 다듬는다.
export function ToolsInput({
  id,
  name,
  defaultValue,
  clubTools = [],
  invalid,
  describedBy,
}: {
  id: string
  name: string
  defaultValue: string[]
  // 이 Club 에서 이미 쓰는 도구 이름. 고르는 목록의 맨 위에 보여 준다.
  clubTools?: string[]
  invalid?: boolean
  describedBy?: string
}) {
  const [tools, setTools] = useState(defaultValue)
  const [draft, setDraft] = useState("")
  const [open, setOpen] = useState(false)
  // 고르는 목록에서 지금 가리키는 줄. -1 이면 가리키는 줄이 없어 적은 글자를 그대로 넣는다.
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const full = tools.length >= AI_LOG_TOOL_COUNT_MAX
  const options = open && !full ? suggestTools(draft, clubTools, tools) : []
  const listId = `${id}-options`

  function add(value: string) {
    setTools((current) =>
      canonicalTools([...current, value], clubTools).slice(
        0,
        AI_LOG_TOOL_COUNT_MAX
      )
    )
    setDraft("")
    setActive(-1)
  }

  return (
    <div className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1.5 transition-colors focus-within:border-ring focus-within:inset-ring-1 focus-within:inset-ring-ring focus-within:ring-3 focus-within:ring-ring/40 has-[input[aria-invalid=true]]:border-danger-border-strong"
      >
        {tools.map((tool) => (
          <span
            key={tool}
            className="flex h-6 items-center gap-0.5 rounded-full bg-muted pr-1 pl-2 text-label-s text-muted-foreground"
          >
            {tool}
            <input type="hidden" name={name} value={tool} />
            <button
              type="button"
              aria-label={`${tool} 빼기`}
              onClick={(event) => {
                event.stopPropagation()
                setTools((current) => current.filter((item) => item !== tool))
                inputRef.current?.focus()
              }}
              className="flex size-4 items-center justify-center rounded-full transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" strokeWidth={1.5} className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          name={name}
          value={draft}
          role="combobox"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 && active < options.length
              ? `${listId}-${active}`
              : undefined
          }
          maxLength={AI_LOG_TOOL_NAME_MAX}
          autoComplete="off"
          enterKeyHint="done"
          disabled={full}
          placeholder={
            full
              ? `${AI_LOG_TOOL_COUNT_MAX}개까지 넣을 수 있습니다`
              : "도구 이름으로 찾기"
          }
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const value = event.target.value
            setOpen(true)
            setActive(-1)
            // 쉼표가 들어오면 바로 이름표로 만든다. 여러 개를 붙여 넣은 경우도 여기서 나뉜다.
            if (value.includes(",")) {
              add(value)
            } else {
              setDraft(value)
            }
          }}
          onKeyDown={(event) => {
            // 한글을 조합하는 중의 Enter 는 글자를 확정하는 것이므로 넘긴다.
            if (event.nativeEvent.isComposing || event.keyCode === 229) {
              return
            }
            if (event.key === "ArrowDown" && options.length > 0) {
              event.preventDefault()
              setActive((current) => (current + 1) % options.length)
            } else if (event.key === "ArrowUp" && options.length > 0) {
              event.preventDefault()
              setActive((current) =>
                current <= 0 ? options.length - 1 : current - 1
              )
            } else if (event.key === "Enter") {
              // Enter 로 폼이 통째로 제출되지 않게 한다.
              event.preventDefault()
              add(active >= 0 && active < options.length ? options[active] : draft)
            } else if (event.key === "Escape" && open) {
              event.stopPropagation()
              setOpen(false)
              setActive(-1)
            } else if (event.key === "Backspace" && draft === "") {
              setTools((current) => current.slice(0, -1))
            }
          }}
          onBlur={() => {
            add(draft)
            setOpen(false)
          }}
          className="h-6 min-w-32 flex-1 bg-transparent px-1 text-base text-foreground outline-none placeholder:text-tertiary disabled:cursor-not-allowed md:text-body-m"
        />
      </div>
      {options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="도구 고르기"
          className="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-card p-1 shadow-lg"
        >
          {options.map((option, index) => (
            <li
              key={option}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // 누르는 동안 입력 칸이 초점을 잃지 않게 한다. 초점을 잃으면 적던 글자가 먼저 들어가 버린다.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                add(option)
                inputRef.current?.focus()
              }}
              onMouseEnter={() => setActive(index)}
              className={cn(
                "flex h-9 cursor-default items-center rounded-md px-2.5 text-label-m select-none",
                index === active && "bg-accent"
              )}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
