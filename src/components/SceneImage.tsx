"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

type SceneImageProps = Omit<ImageProps, "src" | "alt" | "unoptimized"> & {
  src: string;
  /** 장면을 가져오지 못했을 때 대신 보여 줄 이미지 */
  fallbackSrc: string;
  alt: string;
};

// 0: 원래 이미지, 1: 대체 이미지, 2: 둘 다 실패
type Stage = 0 | 1 | 2;

// 서비스 영상의 한 장면을 보여 준다.
// 장면 주소는 영상의 3초 지점을 가리키는데, 영상이 그보다 짧으면 Cloudflare 가 400 을 돌려준다.
// 그때는 깨진 이미지 대신 대체 이미지(등록된 썸네일 등)를 보여 준다.
// 대체 이미지마저 없거나 실패하면 아무것도 그리지 않아, 깨진 이미지 표시 대신 바탕색만 남는다.
export function SceneImage({ src, fallbackSrc, alt, ...props }: SceneImageProps) {
  const [stage, setStage] = useState<Stage>(0);
  const ref = useRef<HTMLImageElement>(null);

  // "failedStage 단계의 이미지가 실패했다"를 반영한다. 이미 그 단계를 지났으면 아무것도 하지 않는다.
  // 같은 실패가 두 경로(onError 와 아래의 확인)로 함께 보고돼도 한 단계만 넘어가게 하기 위해서다.
  // 그러지 않으면 대체 이미지를 시도해 보지도 않고 건너뛸 수 있다.
  const reportFailure = (failedStage: Stage) =>
    setStage((current) => {
      if (current !== failedStage) return current;
      return current === 0 && fallbackSrc !== src ? 1 : 2;
    });

  // 화면이 준비되기 전에 이미 실패한 경우에는 onError 가 불리지 않으므로 처음 한 번 직접 확인한다.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) reportFailure(0);
    // 처음 그린 이미지(0단계)만 확인한다. 그 뒤의 실패는 onError 가 알려 준다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (stage === 2) return null;

  return (
    <Image
      {...props}
      ref={ref}
      alt={alt}
      src={stage === 1 ? fallbackSrc : src}
      unoptimized
      onError={() => reportFailure(stage)}
    />
  );
}
