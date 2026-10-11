import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

import { ThemeScript } from "@/components/theme-script";
import { ThemeWatcher } from "@/components/theme-watcher";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Club OS",
  description: "AI 동아리의 학습, 실험, 기록을 한 흐름으로 이어 주는 작업 공간",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // 화면 모드를 맞추는 스크립트가 React 보다 먼저 html 의 class 를 바꾸므로 그 차이를 받아들이게 한다.
    <html
      lang="ko"
      className={`${notoSansKr.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeScript />
        {children}
        <ThemeWatcher />
      </body>
    </html>
  );
}
