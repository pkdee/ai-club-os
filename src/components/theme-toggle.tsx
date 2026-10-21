"use client"

import { useId, useSyncExternalStore } from "react"
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"

import {
  readThemeChoice,
  saveThemeChoice,
  THEME_CHANGE_EVENT,
  THEME_CHOICES,
  type ThemeChoice,
} from "@/lib/theme"

const ICONS: Record<ThemeChoice, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

// 상단 막대의 오른쪽에 두는 화면 모드 토글. 세 칸의 아이콘 가운데 하나를 고르면 바로 바뀐다.
export function ThemeToggle() {
  const name = useId()
  // 서버는 무엇을 골랐는지 모르므로 기기 설정으로 그려 두고, 브라우저에서 저장된 값으로 맞춘다.
  const choice = useSyncExternalStore<ThemeChoice>(
    subscribe,
    readThemeChoice,
    () => "system"
  )

  return (
    <fieldset className="flex items-center gap-0.5 rounded-full border bg-card p-0.5">
      <legend className="sr-only">화면 모드</legend>
      {THEME_CHOICES.map(({ value, label }) => {
        const Icon = ICONS[value]

        return (
          <label
            key={value}
            title={label}
            className="flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground has-checked:bg-accent has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-ring"
          >
            <input
              type="radio"
              name={name}
              value={value}
              checked={choice === value}
              onChange={() => saveThemeChoice(value)}
              className="sr-only"
            />
            <Icon aria-hidden="true" strokeWidth={1.5} className="size-4" />
            <span className="sr-only">{label}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
