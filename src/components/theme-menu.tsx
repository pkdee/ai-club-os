"use client"

import { useSyncExternalStore } from "react"
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Menu,
  MenuContent,
  MenuLabel,
  MenuNote,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@/components/ui/menu"
import {
  parseThemeChoice,
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

// 상단 막대의 오른쪽에 두는 화면 모드 메뉴. 버튼에는 지금 고른 모드의 아이콘이 보인다.
// 고르면 바로 바뀌고 이 브라우저에 기억된다.
export function ThemeMenu() {
  // 서버는 무엇을 골랐는지 모르므로 기기 설정으로 그려 두고, 브라우저에서 저장된 값으로 맞춘다.
  const choice = useSyncExternalStore<ThemeChoice>(
    subscribe,
    readThemeChoice,
    () => "system"
  )
  const Icon = ICONS[choice]
  const label = THEME_CHOICES.find((item) => item.value === choice)?.label

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`화면 모드: ${label}`}
            className="data-popup-open:bg-accent"
          />
        }
      >
        <Icon aria-hidden="true" strokeWidth={1.5} />
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>화면 모드</MenuLabel>
        <MenuRadioGroup
          aria-label="화면 모드"
          value={choice}
          onValueChange={(value) => saveThemeChoice(parseThemeChoice(value))}
        >
          {THEME_CHOICES.map(({ value, label }) => {
            const ItemIcon = ICONS[value]

            return (
              <MenuRadioItem key={value} value={value}>
                <ItemIcon aria-hidden="true" strokeWidth={1.5} />
                {label}
              </MenuRadioItem>
            )
          })}
        </MenuRadioGroup>
        <MenuNote>이 브라우저에 기억됩니다.</MenuNote>
      </MenuContent>
    </Menu>
  )
}
