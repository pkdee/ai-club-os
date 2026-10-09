"use client"

import { Toggle } from "@base-ui/react/toggle"
import { ToggleGroup } from "@base-ui/react/toggle-group"

import { cn } from "@/lib/utils"

import {
  ATTENDANCE_LABEL,
  ATTENDANCE_STATUSES,
  type AttendanceStatus,
} from "../status"
import { ATTENDANCE_ICON } from "./attendance-status-badge"

// 고른 상태만 색을 입힌다. Figma 의 AttendanceToggle 과 같다.
const PRESSED: Record<AttendanceStatus, string> = {
  present:
    "data-pressed:border-success-border data-pressed:bg-success-subtle data-pressed:text-success data-pressed:[&_svg]:text-icon-success",
  late: "data-pressed:border-warning-border data-pressed:bg-warning-subtle data-pressed:text-warning data-pressed:[&_svg]:text-icon-warning",
  absent:
    "data-pressed:border-danger-border data-pressed:bg-danger-subtle data-pressed:text-danger data-pressed:[&_svg]:text-icon-danger",
  excused:
    "data-pressed:border-info-border data-pressed:bg-info-subtle data-pressed:text-info data-pressed:[&_svg]:text-icon-info",
}

// 한 Member 의 상태를 고르는 묶음. 좌우 화살표로 옮겨 다닐 수 있다.
// 고른 것을 다시 누르면 미기록으로 돌아간다.
export function AttendanceSelector({
  label,
  value,
  onChange,
}: {
  label: string
  value: AttendanceStatus | null
  onChange: (value: AttendanceStatus | null) => void
}) {
  return (
    <ToggleGroup
      aria-label={label}
      value={value ? [value] : []}
      onValueChange={(next) =>
        onChange((next[0] as AttendanceStatus | undefined) ?? null)
      }
      className="flex flex-wrap gap-1.5"
    >
      {ATTENDANCE_STATUSES.map((status) => {
        const Icon = ATTENDANCE_ICON[status]

        return (
          <Toggle
            key={status}
            value={status}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md border border-input bg-card pr-3 pl-2 text-label-m text-muted-foreground transition-colors outline-none select-none hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-4 [&_svg]:text-icon-subtle",
              PRESSED[status]
            )}
          >
            <Icon aria-hidden="true" strokeWidth={1.5} />
            {ATTENDANCE_LABEL[status]}
          </Toggle>
        )
      })}
    </ToggleGroup>
  )
}
