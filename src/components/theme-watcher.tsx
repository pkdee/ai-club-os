"use client"

import { useEffect } from "react"

import { applyTheme, THEME_STORAGE_KEY } from "@/lib/theme"

// 화면을 연 뒤에 기기 설정이 바뀌거나 다른 창에서 화면 모드를 바꾸면 따라간다. 그리는 것은 없다.
export function ThemeWatcher() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onMedia = () => applyTheme()
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) {
        applyTheme()
      }
    }

    media.addEventListener("change", onMedia)
    window.addEventListener("storage", onStorage)
    return () => {
      media.removeEventListener("change", onMedia)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  return null
}
