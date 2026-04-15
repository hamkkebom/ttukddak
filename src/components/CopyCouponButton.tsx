"use client";

import { Button } from "@/components/ui/button";

export function CopyCouponButton({ code }: { code: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs"
      onClick={() => {
        navigator.clipboard.writeText(code);
        alert("쿠폰 코드가 복사되었습니다!");
      }}
    >
      복사
    </Button>
  );
}
