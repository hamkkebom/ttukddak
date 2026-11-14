"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { SceneImage } from "@/components/SceneImage";
import { useFavorites } from "@/contexts/FavoritesContext";
import { streamFrameUrl } from "@/lib/stream";
import { cn } from "@/lib/utils";
import type { ExpertSummary, Service } from "@/types";

interface ServiceCardProps {
  service: Service;
  expert?: ExpertSummary;
  className?: string;
}

const formatPrice = (price: number) => new Intl.NumberFormat("ko-KR").format(price);

// 목록(검색, 카테고리, 전문가, 찜)에 쓰는 서비스 카드.
export function ServiceCard({ service, expert, className }: ServiceCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(service.id);

  // 글자가 들어간 썸네일 대신 서비스 영상의 한 장면을 쓴다. 영상이 없으면 등록된 썸네일을 쓴다.
  const scene = streamFrameUrl(service.images[0], { width: 640, height: 360 }) ?? service.thumbnail;

  const meta = [
    service.reviewCount > 0 ? `★ ${service.rating.toFixed(1)} (${service.reviewCount})` : null,
    service.isPrime ? "프라임" : null,
    expert?.isMaster ? "마스터" : null,
    service.isFastResponse ? "빠른 응답" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link
        href={`/service/${service.id}`}
        className="flex flex-1 flex-col gap-3.5 rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <div className="relative aspect-video overflow-hidden rounded-[20px] border border-[#D5D9DE] bg-paper">
          <SceneImage
            src={scene}
            fallbackSrc={service.thumbnail}
            alt={`${service.title}의 한 장면`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col items-start gap-1.5 px-1">
          {expert && <span className="text-[13px] font-medium text-[#56606B]">{expert.name}</span>}
          <h3 className="line-clamp-2 text-[17px] font-black leading-[1.35] tracking-[-0.02em] group-hover:underline">
            {service.title}
          </h3>
          {meta && <span className="text-sm font-medium text-[#4A4A46]">{meta}</span>}
          <span className="mt-auto pt-1.5">
            <span className="inline-flex h-8 items-center rounded-full bg-ink px-3.5 text-sm font-black text-white">
              {formatPrice(service.price)}원부터
            </span>
          </span>
        </div>
      </Link>

      {/* 찜 버튼은 링크 안에 넣지 않고 사진 위에 따로 올린다 (링크 안의 버튼은 올바른 구조가 아니다). */}
      <button
        type="button"
        onClick={() => {
          toggleFavorite(service.id);
          toast.success(liked ? "찜 목록에서 삭제되었습니다" : "찜 목록에 추가되었습니다");
        }}
        aria-pressed={liked}
        aria-label={liked ? `${service.title} 찜 취소` : `${service.title} 찜하기`}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#D5D9DE] bg-white text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <Heart className={cn("h-5 w-5", liked && "fill-ink")} aria-hidden="true" />
      </button>
    </article>
  );
}
