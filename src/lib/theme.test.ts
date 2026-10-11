import assert from "node:assert/strict"
import { test } from "node:test"
import vm from "node:vm"

import {
  isDarkTheme,
  parseThemeChoice,
  THEME_SCRIPT,
  THEME_STORAGE_KEY,
} from "./theme"

test("모르는 값은 기기 설정을 따르는 것으로 본다", () => {
  assert.equal(parseThemeChoice("dark"), "dark")
  assert.equal(parseThemeChoice("light"), "light")
  assert.equal(parseThemeChoice("system"), "system")
  assert.equal(parseThemeChoice(null), "system")
  assert.equal(parseThemeChoice("DARK"), "system")
})

test("고른 값이 기기 설정보다 앞선다", () => {
  assert.equal(isDarkTheme("dark", false), true)
  assert.equal(isDarkTheme("light", true), false)
  assert.equal(isDarkTheme("system", true), true)
  assert.equal(isDarkTheme("system", false), false)
})

// 스크립트를 가짜 브라우저에서 돌려 본다. stored 가 undefined 이면 저장소를 읽을 때 오류가 난다.
function run(stored: string | null | undefined, systemDark: boolean) {
  const classes = new Set<string>()
  const root = {
    classList: {
      toggle: (name: string, on: boolean) =>
        on ? classes.add(name) : classes.delete(name),
    },
    style: { colorScheme: "" },
  }
  const localStorage = {
    getItem(key: string) {
      if (stored === undefined) {
        throw new Error("막힘")
      }
      return key === THEME_STORAGE_KEY ? stored : null
    },
  }
  const window = { matchMedia: () => ({ matches: systemDark }) }
  vm.runInNewContext(THEME_SCRIPT, {
    document: { documentElement: root },
    localStorage,
    window,
  })
  return `${classes.has("dark")}|${root.style.colorScheme}`
}

test("처음 그리기 전의 스크립트가 같은 판단을 한다", () => {
  for (const stored of ["dark", "light", null, "이상한 값"]) {
    for (const systemDark of [true, false]) {
      const dark = isDarkTheme(parseThemeChoice(stored), systemDark)
      assert.equal(
        run(stored, systemDark),
        `${dark}|${dark ? "dark" : "light"}`,
        `${stored} ${systemDark}`
      )
    }
  }
})

test("저장소를 읽지 못하면 기기 설정을 따른다", () => {
  assert.equal(run(undefined, true), "true|dark")
  assert.equal(run(undefined, false), "false|light")
})
