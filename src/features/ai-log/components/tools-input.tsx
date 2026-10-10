"use client"

import { useRef, useState } from "react"
import { X } from "lucide-react"

import {
  AI_LOG_TOOL_COUNT_MAX,
  AI_LOG_TOOL_NAME_MAX,
  canonicalTools,
} from "../rules"

// 도구 이름을 하나씩 이름표로 쌓는 입력 칸. Enter 나 쉼표로 넣고, 빈 칸에서 Backspace 로 마지막 것을 뺀다.
// 이름표는 같은 name 의 숨은 값으로 함께 제출된다. 아직 이름표로 만들지 않은 글자도 그대로 제출되어 서버가 다듬는다.
// suggestions 는 이 Club 에서 이미 쓰는 도구 이름이다. 적는 동안 보여 주고, 표기만 다르게 적으면 그 표기로 맞춘다.
export function ToolsInput({
  id,
  name,
  defaultValue,
  suggestions = [],
  invalid,
  describedBy,
}: {
  id: string
  name: string
  defaultValue: string[]
  suggestions?: string[]
  invalid?: boolean
  describedBy?: string
}) {
  const [tools, setTools] = useState(defaultValue)
  const [draft, setDraft] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const full = tools.length >= AI_LOG_TOOL_COUNT_MAX

  function add(value: string) {
    setTools((current) =>
      canonicalTools([...current, value], suggestions).slice(
        0,
        AI_LOG_TOOL_COUNT_MAX
      )
    )
    setDraft("")
  }

  return (
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
        maxLength={AI_LOG_TOOL_NAME_MAX}
        autoComplete="off"
        enterKeyHint="done"
        list={suggestions.length > 0 ? `${id}-suggestions` : undefined}
        disabled={full}
        placeholder={
          full
            ? `${AI_LOG_TOOL_COUNT_MAX}개까지 넣을 수 있습니다`
            : "도구 이름을 적고 Enter"
        }
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(event) => {
          const value = event.target.value
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
          if (event.key === "Enter") {
            // Enter 로 폼이 통째로 제출되지 않게 한다.
            event.preventDefault()
            add(draft)
          } else if (event.key === "Backspace" && draft === "") {
            setTools((current) => current.slice(0, -1))
          }
        }}
        onBlur={() => add(draft)}
        className="h-6 min-w-32 flex-1 bg-transparent px-1 text-base text-foreground outline-none placeholder:text-tertiary disabled:cursor-not-allowed md:text-body-m"
      />
      {suggestions.length > 0 && (
        <datalist id={`${id}-suggestions`}>
          {suggestions.map((tool) => (
            <option key={tool} value={tool} />
          ))}
        </datalist>
      )}
    </div>
  )
}
