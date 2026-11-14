"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// 바깥 틀(layout)까지 그리지 못했을 때의 마지막 화면.
// 이 화면에서는 사이트의 스타일과 글꼴을 쓸 수 없어 필요한 모양을 직접 적는다.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "#FFFFFF",
          color: "#141414",
          fontFamily:
            'Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
          wordBreak: "keep-all",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, lineHeight: 1.2 }}>문제가 발생했습니다</h1>
          <p style={{ margin: "16px 0 0", fontSize: 17, lineHeight: 1.7, color: "#3A3A37" }}>
            화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              height: 48,
              padding: "0 22px",
              border: "none",
              borderRadius: 10,
              background: "#141414",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
