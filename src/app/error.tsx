"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

// 화면을 그리다 오류가 났을 때의 화면. 오류 내용은 기록으로만 보내고 화면에는 적지 않는다.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="bg-white text-ink [word-break:keep-all]">
      <div className="mx-auto flex min-h-[70vh] max-w-[1240px] flex-col justify-center px-4 py-20 md:px-8">
        <h1 className="font-display text-[clamp(34px,4.6vw,60px)] leading-[1.1]">문제가 발생했습니다</h1>
        <p className="mt-5 max-w-[34em] text-[17px] leading-[1.7] text-[#3A3A37]">
          화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className={`inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black ${focusRing}`}
          >
            다시 시도
          </button>
          <Link
            href="/"
            className={`inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper ${focusRing}`}
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
