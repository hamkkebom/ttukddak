"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoThumbnailProps {
  uid: string;
  alt?: string;
  className?: string;
  showPlayButton?: boolean;
  autoPlay?: boolean;
  onClick?: () => void;
}

/**
 * Cloudflare Stream 영상 썸네일/재생 컴포넌트
 * requireSignedURLs 문제를 우회하기 위해 iframe.videodelivery.net 사용
 */
export function VideoThumbnail({
  uid,
  alt = "영상 썸네일",
  className,
  showPlayButton = true,
  autoPlay = false,
  onClick,
}: VideoThumbnailProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsPlaying(true);
    }
  };

  const iframeSrc = isPlaying
    ? `https://iframe.videodelivery.net/${uid}?autoplay=true&loop=true&muted=true`
    : `https://iframe.videodelivery.net/${uid}?autoplay=false&preload=metadata&muted=true&controls=false`;

  return (
    <div
      className={cn("relative w-full h-full overflow-hidden bg-slate-100", className)}
      onClick={!isPlaying ? handleClick : undefined}
    >
      <iframe
        src={iframeSrc}
        className="absolute inset-0 w-full h-full border-0"
        style={!isPlaying ? { pointerEvents: "none" } : undefined}
        allow="autoplay; encrypted-media"
        title={alt}
        loading="lazy"
      />
      {!isPlaying && showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center cursor-pointer z-10">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-70 hover:opacity-100 scale-90 hover:scale-100 transition-all duration-300 shadow-xl">
            <Play className="h-5 w-5 text-slate-800 fill-slate-800 ml-0.5" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CF Stream UID를 썸네일 URL에서 추출하는 헬퍼
 */
export function extractStreamUid(url: string): string | null {
  const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)\//);
  return match ? match[1] : null;
}
