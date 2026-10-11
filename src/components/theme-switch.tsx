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

// 화면 모드를 고르는 세 칸. 고르면 바로 바뀌고 이 브라우저에 기억된다.
export function ThemeSwitch() {
  const name = useId()
  // 서버는 무엇을 골랐는지 모르므로 기기 설정으로 그려 두고, 브라우저에서 저장된 값으로 맞춘다.
  const choice = useSyncExternalStore<ThemeChoice>(
    subscribe,
    readThemeChoice,
    () => "system"
  )

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">화면 모드</legend>
      <div className="grid grid-cols-3 gap-2">
        {THEME_CHOICES.map(({ value, label }) => {
          const Icon = ICONS[value]

          return (
            <label
              key={value}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-label-m text-muted-foreground transition-colors hover:bg-accent has-checked:border-brand-border has-checked:bg-primary-subtle has-checked:text-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring"
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
              {label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
