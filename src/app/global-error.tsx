"use client";

import { useEffect } from "react";

// 가장 바깥 틀에서 오류가 났을 때 보여 준다.
// 이 화면은 앱의 스타일을 불러오지 못하므로 필요한 모양을 직접 적는다.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          color: "#18181b",
          background: "#fafafa",
        }}
      >
        <title>문제가 생겼습니다 | AI Club OS</title>
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>
            화면을 보여 주지 못했습니다
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 20px", color: "#52525b" }}>
            예상하지 못한 문제가 생겼습니다. 다시 시도해 주세요. 계속되면 잠시
            뒤에 다시 열어 주세요.
            {error.digest && ` 문의할 때는 번호 ${error.digest} 를 알려 주세요.`}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: "1px solid #d4d4d8",
              background: "#ffffff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  );
}
