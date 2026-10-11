// 화면 모드. 밝은 화면과 어두운 화면 가운데 무엇을 쓸지 브라우저마다 기억한다.
// 계정에 저장하지 않는다. 기기마다 다르게 쓰는 값이고, 로그인하기 전의 화면에도 적용해야 하기 때문이다.

export type ThemeChoice = "system" | "light" | "dark"

export const THEME_STORAGE_KEY = "ai-club-os:theme"
// 같은 창 안에서 고른 값이 바뀌었다고 알리는 이벤트 이름.
export const THEME_CHANGE_EVENT = "ai-club-os:theme-change"

export const THEME_CHOICES: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "기기 설정" },
  { value: "light", label: "밝게" },
  { value: "dark", label: "어둡게" },
]

// 저장된 값을 읽는다. 모르는 값은 기기 설정을 따르는 것으로 본다.
export function parseThemeChoice(value: unknown): ThemeChoice {
  return value === "light" || value === "dark" ? value : "system"
}

// 어두운 화면을 쓸지. systemDark 는 기기가 어두운 화면을 쓰고 있다는 뜻이다.
export function isDarkTheme(choice: ThemeChoice, systemDark: boolean) {
  return choice === "dark" || (choice === "system" && systemDark)
}

// 화면을 처음 그리기 전에 실행하는 짧은 스크립트. 밝은 화면이 잠깐 보였다가 바뀌는 일을 막는다.
// 위의 두 함수와 같은 판단을 한다. 저장소를 읽지 못하는 브라우저에서는 기기 설정을 따른다.
export const THEME_SCRIPT = `(function(){var c=null;try{c=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}var d=c==="dark"||(c!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"})()`

// 아래는 브라우저에서만 부른다.

export function readThemeChoice(): ThemeChoice {
  try {
    return parseThemeChoice(window.localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return "system"
  }
}

// 지금 고른 값에 맞게 화면을 바꾼다.
export function applyTheme(choice: ThemeChoice = readThemeChoice()) {
  const dark = isDarkTheme(
    choice,
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.style.colorScheme = dark ? "dark" : "light"
}

// 고른 값을 기억하고 화면을 바꾼다. 저장하지 못하는 브라우저에서도 지금 화면은 바뀐다.
export function saveThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, choice)
    }
  } catch {
    // 저장소를 쓸 수 없으면 이번 화면에만 적용된다.
  }
  applyTheme(choice)
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: choice }))
}
