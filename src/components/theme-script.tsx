import { THEME_SCRIPT } from "@/lib/theme"

// 화면 모드를 처음 그리기 전에 맞추는 스크립트. body 의 맨 앞에 둔다.
// 브라우저가 HTML 을 읽는 도중에 바로 실행하므로 밝은 화면이 잠깐 보이지 않는다.
// 브라우저에서 다시 그릴 때는 실행되지 않는 종류로 바꿔 React 의 경고를 피한다. Next.js 문서가 권하는 방식이다.
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  )
}
