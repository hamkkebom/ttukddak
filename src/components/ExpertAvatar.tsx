"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Expert } from "@/types";

const SIZES = {
  64: { box: "h-16 w-16", text: "text-2xl" },
  96: { box: "h-24 w-24", text: "text-4xl" },
} as const;

// 전문가 사진. 등록한 사진이 없으면 이름 첫 글자를 보여 준다.
// (사진이 없는 계정에는 자동으로 만든 그림 주소가 들어 있는데, 그 그림은 쓰지 않는다.)
export function ExpertAvatar({
  expert,
  size = 64,
}: {
  expert: Pick<Expert, "name" | "profileImage">;
  size?: keyof typeof SIZES;
}) {
  const [broken, setBroken] = useState(false);
  const { box, text } = SIZES[size];
  const hasPhoto = !broken && Boolean(expert.profileImage) && !expert.profileImage.includes("api.dicebear.com");

  if (!hasPhoto) {
    return (
      <span
        aria-hidden="true"
        className={cn("flex shrink-0 items-center justify-center rounded-full bg-ink font-black text-white", box, text)}
      >
        {Array.from(expert.name)[0] ?? ""}
      </span>
    );
  }
  return (
    <Image
      src={expert.profileImage}
      alt=""
      width={size}
      height={size}
      unoptimized
      onError={() => setBroken(true)}
      className={cn("shrink-0 rounded-full border border-[#D5D9DE] object-cover", box)}
    />
  );
}
