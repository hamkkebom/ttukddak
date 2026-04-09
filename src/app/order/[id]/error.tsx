"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">주문 처리 중 오류</h2>
        <p className="text-muted-foreground">
          주문 정보를 불러오는 중 문제가 발생했습니다.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>다시 시도</Button>
          <Button variant="outline" asChild>
            <Link href="/mypage">마이페이지로</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
