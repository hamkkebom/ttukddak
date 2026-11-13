"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

type SceneImageProps = Omit<ImageProps, "src" | "alt" | "unoptimized"> & {
  src: string;
  /** 장면을 가져오지 못했을 때 대신 보여 줄 이미지 */
  fallbackSrc: string;
  alt: string;
};

// 서비스 영상의 한 장면을 보여 준다.
// 장면 주소는 영상의 3초 지점을 가리키는데, 영상이 그보다 짧으면 Cloudflare 가 400 을 돌려준다.
// 그때는 깨진 이미지 대신 서비스에 등록된 썸네일을 보여 준다.
export function SceneImage({ src, fallbackSrc, alt, ...props }: SceneImageProps) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // 화면이 준비되기 전에 이미 실패한 경우에는 onError 가 불리지 않으므로 한 번 직접 확인한다.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <Image
      {...props}
      ref={ref}
      alt={alt}
      src={failed ? fallbackSrc : src}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
