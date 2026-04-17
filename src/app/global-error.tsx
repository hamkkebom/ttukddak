"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

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
      <body style={{ fontFamily: "sans-serif", padding: 32, textAlign: "center" }}>
        <h2>치명적 오류가 발생했습니다</h2>
        <p style={{ color: "#666" }}>잠시 후 다시 시도해주세요.</p>
        <button
          onClick={reset}
          style={{
            background: "#f97316",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: 8,
            cursor: "pointer",
            marginTop: 16,
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
