"use client"

import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"
import { Check, ChevronDown } from "lucide-react"

import { controlClassName } from "@/components/ui/input"
import {
  formatDuration,
  formatTimeLabel,
  matchesTimeQuery,
  minutesBetween,
  parseTimeInput,
  timeOptions,
  withTime,
} from "@/lib/time-of-day"
import { cn } from "@/lib/utils"

type TimePickerProps = {
  id?: string
  // "19:00" 같은 HH:MM. 고르지 않았으면 빈 글이다.
  value: string
  onValueChange: (value: string) => void
  // 있으면 종료 시각을 고르는 칸이다. 이 시각 뒤만 목록에 두고 옆에 걸리는 시간을 적는다.
  after?: string
  // 고른 값이 없을 때 목록을 열면 먼저 보여 줄 시각. 오전, 오후 없이 적은 시각도 이 시각에 가까운 쪽으로 읽는다.
  anchor?: string
  disabled?: boolean
  placeholder?: string
  className?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

// Google Calendar 처럼 시각을 고르는 칸. 누르면 30분 간격의 목록이 열리고, 칸에 시각을 바로 적어도 된다.
// 적은 글은 Enter 를 누르거나 칸을 떠날 때 시각으로 읽고, 읽지 못하면 전의 값으로 돌아간다.
// 이 칸은 폼에 값을 보내지 않는다. 쓰는 쪽이 hidden input 으로 value 를 보낸다.
function TimePicker({
  id,
  value,
  onValueChange,
  after,
  anchor = "09:00",
  disabled,
  placeholder = "예: 오후 7:00",
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: TimePickerProps) {
  // 적고 있는 글. null 이면 적고 있지 않은 것이라 칸에 고른 값이 보인다.
  const [draft, setDraft] = React.useState<string | null>(null)
  // 목록에서 강조된 시각. 없을 때 누른 Enter 는 적은 글을 값으로 정한다.
  const highlighted = React.useRef<string | undefined>(undefined)
  // 눌러서 칸에 들어왔는지. 손을 뗄 때 글을 다시 고를지 정한다.
  const selectOnMouseUp = React.useRef(false)

  const parsed =
    draft === null
      ? null
      : parseTimeInput(draft, after ? { after } : { near: value || anchor })
  const items = React.useMemo(() => {
    let list = timeOptions(after)
    if (value) {
      list = withTime(list, value)
    }
    return parsed ? withTime(list, parsed) : list
  }, [after, value, parsed])
  // 적고 있으면 맞는 시각만 남기고, 적은 글로 읽은 시각을 맨 앞에 둔다. Enter 를 누르면 그 시각이 골라진다.
  const filtered = React.useMemo(() => {
    if (draft === null || draft.trim() === "") {
      return items
    }
    const matches = items.filter(
      (time) => time !== parsed && matchesTimeQuery(time, draft)
    )
    return parsed ? [parsed, ...matches] : matches
  }, [items, draft, parsed])

  // 적던 글을 값으로 정한다. 읽지 못했으면 버리고 전의 값을 보여 준다.
  function commit() {
    if (draft === null) {
      return
    }
    setDraft(null)
    if (parsed && parsed !== value) {
      onValueChange(parsed)
    }
  }

  // 목록을 열면 고른 시각이 가운데 오게 내린다. 고른 것이 없으면 종료 칸은 맨 위, 시작 칸은 anchor 를 보여 준다.
  // 페이지가 함께 움직이지 않게 scrollIntoView 대신 목록 안에서만 내린다.
  const focusTime = value || (after ? "" : anchor)
  const listRef = React.useCallback(
    (list: HTMLDivElement | null) => {
      if (!list) {
        return
      }
      requestAnimationFrame(() => {
        const rows = Array.from(
          list.querySelectorAll<HTMLElement>("[data-time]")
        )
        const target =
          rows.find((row) => (row.dataset.time ?? "") >= focusTime) ??
          rows.at(-1)
        if (target) {
          list.scrollTop =
            target.offsetTop - (list.clientHeight - target.offsetHeight) / 2
        }
      })
    },
    [focusTime]
  )

  return (
    <Combobox.Root
      items={items}
      filteredItems={filtered}
      value={value || null}
      onValueChange={(next) => {
        // 칸의 글을 모두 지우면 Base UI 가 null 을 보낸다. 값은 그대로 두고 칸을 떠날 때 되돌린다.
        if (next) {
          setDraft(null)
          onValueChange(next)
        }
      }}
      inputValue={draft ?? (value ? formatTimeLabel(value) : "")}
      onInputValueChange={(text, details) => {
        // 사람이 적은 글만 붙들어 둔다. 고르거나 닫을 때 Base UI 가 채우는 글은 고른 값과 같다.
        setDraft(details.reason === "input-change" ? text : null)
      }}
      onOpenChange={(open, details) => {
        if (open) {
          return
        }
        // 목록에서 고른 것은 이미 값이 되었다. Esc 는 적던 글을 버린다.
        if (
          details.reason === "item-press" ||
          details.reason === "escape-key"
        ) {
          setDraft(null)
          return
        }
        commit()
      }}
      onItemHighlighted={(time) => {
        highlighted.current = time
      }}
      itemToStringLabel={formatTimeLabel}
      autoHighlight
      disabled={disabled}
    >
      <div data-slot="time-picker" className={cn("relative", className)}>
        <Combobox.Input
          id={id}
          placeholder={placeholder}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={cn(controlClassName, "h-10 pr-9")}
          onFocus={(event) => {
            // 칸에 들어오면 글을 모두 골라 두어서 바로 새 시각을 적을 수 있게 한다.
            const input = event.currentTarget
            requestAnimationFrame(() => input.select())
          }}
          onMouseDown={(event) => {
            // 눌러서 들어오면 손을 뗄 때 브라우저가 고른 글을 풀고 커서를 놓는다. 그때 다시 고른다.
            // 이미 칸 안에 있을 때 누른 것은 커서를 옮기려는 것이라 그대로 둔다.
            selectOnMouseUp.current =
              document.activeElement !== event.currentTarget
          }}
          onMouseUp={(event) => {
            if (selectOnMouseUp.current) {
              selectOnMouseUp.current = false
              event.preventDefault()
              event.currentTarget.select()
            }
          }}
          onKeyDown={(event) => {
            // 목록이 닫혀 있을 때의 Esc 는 바깥의 창(Dialog)이 받게 넘긴다.
            // Base UI 는 이때 칸을 비우려고 Esc 를 붙잡는데, 이 칸은 값을 비우지 않으므로 할 일이 없다.
            if (
              event.key === "Escape" &&
              event.currentTarget.getAttribute("aria-expanded") !== "true"
            ) {
              event.preventBaseUIHandler()
              return
            }
            // 강조된 시각이 없을 때의 Enter 는 적은 글을 값으로 정하고 폼을 보내지 않는다.
            if (
              event.key === "Enter" &&
              draft !== null &&
              highlighted.current === undefined
            ) {
              event.preventDefault()
              commit()
            }
          }}
          onBlur={commit}
        />
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-icon-subtle"
        />
      </div>
      <Combobox.Portal>
        <Combobox.Positioner
          align="start"
          sideOffset={4}
          className="z-50 outline-none"
        >
          <Combobox.Popup className="w-(--anchor-width) max-w-(--available-width) min-w-56 rounded-lg border bg-card text-card-foreground shadow-lg duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Combobox.Empty>
              <p className="px-3 py-2.5 text-caption text-muted-foreground">
                {draft === null || draft.trim() === ""
                  ? "고를 수 있는 시각이 없습니다. 시각을 직접 적어 주세요."
                  : "시각을 읽지 못했습니다. 19:30 이나 오후 7시 30분처럼 적어 주세요."}
              </p>
            </Combobox.Empty>
            <Combobox.List
              ref={listRef}
              className="relative max-h-[min(15rem,var(--available-height))] overflow-y-auto overscroll-contain p-1 outline-none data-empty:p-0"
            >
              {(time: string) => {
                const length = after ? minutesBetween(after, time) : null

                return (
                  <Combobox.Item
                    key={time}
                    value={time}
                    data-time={time}
                    className="grid h-9 cursor-default grid-cols-[1rem_1fr_auto] items-center gap-2 rounded-md px-2.5 text-label-m outline-none select-none data-highlighted:bg-accent"
                  >
                    <Combobox.ItemIndicator className="col-start-1 text-brand">
                      <Check
                        aria-hidden="true"
                        strokeWidth={1.5}
                        className="size-4"
                      />
                    </Combobox.ItemIndicator>
                    <span className="col-start-2 whitespace-nowrap tabular-nums">
                      {formatTimeLabel(time)}
                    </span>
                    {length !== null && (
                      <span className="text-caption whitespace-nowrap text-muted-foreground">
                        {formatDuration(length)}
                      </span>
                    )}
                  </Combobox.Item>
                )
              }}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

export { TimePicker }
