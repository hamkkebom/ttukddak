"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronRight, Heart, Link2, MessageCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { InquiryModal } from "@/components/InquiryModal";
import { SceneImage } from "@/components/SceneImage";
import { ServiceCard } from "@/components/ServiceCard";
import { useFavorites } from "@/contexts/FavoritesContext";
import { streamFrameUrl, streamUid } from "@/lib/stream";
import { cn } from "@/lib/utils";
import type { Category, Expert, PublicReview, Service } from "@/types";

const formatPrice = (price: number) => new Intl.NumberFormat("ko-KR").format(price);

/* ───────────────────────────────── 영상·이미지 ───────────────────────────────── */

type Media = {
  key: string;
  /** Cloudflare Stream 영상이면 그 id, 일반 이미지면 null */
  uid: string | null;
  poster: string;
  posterFallback: string;
  thumb: string;
  thumbFallback: string;
};

// 서비스에 등록된 영상과 이미지를 보여 줄 순서대로 만든다.
// 영상은 3초 지점의 장면을 표지로 쓰고, 영상이 그보다 짧아 실패하면 첫 장면으로 대신한다.
// 등록된 영상·이미지가 하나도 없을 때만 썸네일을 보여 준다.
function buildMedia(service: Service): Media[] {
  const seen = new Set<string>();
  const media: Media[] = [];

  for (const url of service.images) {
    const uid = streamUid(url);
    const key = uid ?? url;
    if (!url || seen.has(key)) continue;
    seen.add(key);

    if (uid) {
      media.push({
        key,
        uid,
        poster: streamFrameUrl(url, { width: 1280, height: 720 }) ?? url,
        posterFallback: streamFrameUrl(url, { width: 1280, height: 720, time: "0s" }) ?? url,
        thumb: streamFrameUrl(url, { width: 212, height: 120 }) ?? url,
        thumbFallback: streamFrameUrl(url, { width: 212, height: 120, time: "0s" }) ?? url,
      });
    } else {
      media.push({ key, uid: null, poster: url, posterFallback: service.thumbnail, thumb: url, thumbFallback: service.thumbnail });
    }
  }

  if (media.length === 0) {
    const t = service.thumbnail;
    media.push({ key: "thumbnail", uid: null, poster: t, posterFallback: t, thumb: t, thumbFallback: t });
  }
  return media;
}

function Gallery({ service }: { service: Service }) {
  const media = useMemo(() => buildMedia(service), [service]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const current = media[index] ?? media[0];

  const poster = (
    <SceneImage
      // 다른 영상으로 바꾸면 앞 영상의 실패 기록이 남지 않도록 새로 만든다.
      key={current.key}
      src={current.poster}
      fallbackSrc={current.posterFallback}
      alt={`${service.title}의 한 장면`}
      fill
      preload={index === 0}
      sizes="(max-width: 1024px) 100vw, 800px"
      className="object-cover"
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-[28px] border-[3px] border-ink bg-night">
        {current.uid && playing ? (
          <iframe
            src={`https://iframe.videodelivery.net/${current.uid}?autoplay=true&muted=false`}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            title={`${service.title} 영상`}
          />
        ) : current.uid ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="영상 재생"
            className="group absolute inset-0 block h-full w-full cursor-pointer focus-visible:outline-none"
          >
            {poster}
            <span className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-ink bg-white text-ink transition-transform group-hover:scale-105 group-focus-visible:ring-[3px] group-focus-visible:ring-white group-focus-visible:outline-[3px] group-focus-visible:outline-offset-[3px] group-focus-visible:outline-ink">
              <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
            </span>
          </button>
        ) : (
          poster
        )}
      </div>

      {media.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {media.map((item, i) => (
            <li key={item.key} className="shrink-0">
              <button
                type="button"
                aria-label={`${i + 1}번째 ${item.uid ? "영상" : "이미지"} 보기`}
                aria-pressed={i === index}
                onClick={() => {
                  setIndex(i);
                  setPlaying(false);
                }}
                className={cn(
                  "relative block h-[60px] w-[106px] overflow-hidden rounded-[10px] border-[3px] bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                  i === index ? "border-ink" : "border-transparent hover:border-[#B9BEC5]"
                )}
              >
                <SceneImage
                  src={item.thumb}
                  fallbackSrc={item.thumbFallback}
                  alt=""
                  fill
                  sizes="106px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────────────────────────── 가격과 주문 ───────────────────────────────── */

function PurchaseBox({
  service,
  selected,
  onSelect,
  onInquiry,
}: {
  service: Service;
  selected: number;
  onSelect: (index: number) => void;
  onInquiry: () => void;
}) {
  const pkg = service.packages[selected] ?? service.packages[0];
  if (!pkg) return null;

  return (
    <section aria-label="가격과 주문" className="flex flex-col gap-5 rounded-[28px] border border-[#D5D9DE] bg-white p-7">
      {service.packages.length > 1 && (
        <div role="group" aria-label="패키지 선택" className="flex gap-1">
          {service.packages.map((p, i) => (
            <button
              key={`${p.name}-${i}`}
              type="button"
              aria-pressed={i === selected}
              onClick={() => onSelect(i)}
              className={cn(
                "h-10 min-w-0 flex-1 truncate rounded-[10px] px-2 text-[15px]",
                i === selected ? "bg-ink font-bold text-white" : "bg-paper font-medium text-[#3A3A37] hover:bg-[#E6E6E1]"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {!pkg.isPlaceholder && <p className="text-[15px] font-bold text-[#3A3A37]">{pkg.name}</p>}
        <p className="font-display text-[46px] leading-none">
          {formatPrice(pkg.price)}
          <span className="ml-1 font-sans text-xl font-black">원</span>
        </p>
      </div>

      {pkg.isPlaceholder ? (
        // 전문가가 패키지를 등록하지 않은 서비스. 코드가 채운 기본값(기간·수정 횟수)은 적지 않는다.
        <p className="text-[15px] text-[#3A3A37]">작업 기간과 수정 횟수는 주문 전에 전문가에게 문의해 정할 수 있습니다.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-2">
            <div className="rounded-[10px] bg-paper px-4 py-3">
              <dt className="text-[13px] text-[#56606B]">작업 기간</dt>
              <dd className="text-[17px] font-black">{pkg.deliveryDays}일</dd>
            </div>
            <div className="rounded-[10px] bg-paper px-4 py-3">
              <dt className="text-[13px] text-[#56606B]">수정</dt>
              <dd className="text-[17px] font-black">{pkg.revisions}회</dd>
            </div>
          </dl>
          {pkg.features.length > 0 && (
            <ul className="flex flex-col gap-2">
              {pkg.features.map((feature, i) => (
                <li key={`${i}-${feature}`} className="flex items-start gap-2.5 text-[15px] text-[#3A3A37]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={3} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="flex flex-col gap-2">
        <Link
          href={`/order/${service.id}?package=${selected}`}
          className="flex h-14 items-center justify-center rounded-[10px] bg-brand text-[17px] font-black text-[#1B0E03] transition-colors hover:bg-[#FF7A45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          바로 구매하기
        </Link>
        <button
          type="button"
          onClick={onInquiry}
          className="flex h-12 items-center justify-center gap-2 rounded-[10px] border border-ink text-[15px] font-bold hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          문의하기
        </button>
      </div>
    </section>
  );
}

// 주문한 뒤의 순서. 홈의 "뚝. 딱. 끝." 과 같은 흐름이다.
const ORDER_STEPS = [
  { word: "뚝.", body: "주문하고 결제합니다." },
  { word: "딱.", body: "전문가가 작업해 결과물을 전달합니다." },
  { word: "끝.", body: "결과물을 확인하고 구매를 확정합니다. 고칠 곳은 확정 전에 수정을 요청하세요." },
];

function OrderSteps() {
  return (
    <section aria-label="주문 뒤 진행 순서" className="rounded-[28px] bg-paper p-7">
      <p className="text-[15px] font-black">주문하면 이렇게 진행됩니다</p>
      <ol className="mt-4 flex flex-col gap-3.5">
        {ORDER_STEPS.map((step) => (
          <li key={step.word} className="flex items-baseline gap-3">
            <span aria-hidden="true" className="w-11 shrink-0 font-display text-[26px] leading-none">
              {step.word}
            </span>
            <span className="text-[15px] text-[#3A3A37]">{step.body}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ───────────────────────────────── 전문가 사진 ───────────────────────────────── */

function ExpertAvatar({ expert }: { expert: Expert }) {
  const [broken, setBroken] = useState(false);
  // 등록한 사진이 없으면 자동으로 만든 그림 대신 이름 첫 글자를 보여 준다.
  const hasPhoto = !broken && Boolean(expert.profileImage) && !expert.profileImage.includes("api.dicebear.com");

  if (!hasPhoto) {
    return (
      <span
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink text-2xl font-black text-white"
      >
        {Array.from(expert.name)[0] ?? ""}
      </span>
    );
  }
  return (
    <Image
      src={expert.profileImage}
      alt=""
      width={64}
      height={64}
      unoptimized
      onError={() => setBroken(true)}
      className="h-16 w-16 shrink-0 rounded-full border border-[#D5D9DE] object-cover"
    />
  );
}

/* ───────────────────────────────────── 화면 ───────────────────────────────────── */

export default function ServiceDetailPageClient({
  service,
  expert,
  category,
  expertServices,
  reviews = [],
  reviewTotal = reviews.length,
}: {
  service: Service;
  expert: Expert;
  category: Category;
  expertServices: Service[];
  /** 공개 리뷰 (최근 것부터). 미리보기 화면에서는 넘기지 않는다. */
  reviews?: PublicReview[];
  reviewTotal?: number;
}) {
  // 패키지는 가격이 낮은 순서다. 셋 이상이면 가운데를, 아니면 가장 싼 것을 처음에 고른다.
  // (둘뿐일 때 두 번째를 고르면 더 비싼 쪽을 권하는 셈이 된다. 없는 번호를 고르면 화면 전체가 오류로 바뀐다.)
  const [selectedPackage, setSelectedPackage] = useState(() => (service.packages.length >= 3 ? 1 : 0));
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(service.id);

  const otherServices = expertServices.filter((s) => s.id !== service.id).slice(0, 3);
  const longDescription = service.description.length > 600 || service.description.split("\n").length > 12;

  const meta = [
    expert.isMaster ? "마스터" : null,
    service.reviewCount > 0 ? `★ ${service.rating.toFixed(1)} (${service.reviewCount})` : null,
    service.salesCount > 0 ? `판매 ${formatPrice(service.salesCount)}회` : null,
    service.isPrime ? "프라임" : null,
    service.isFastResponse ? "빠른 응답" : null,
  ].filter((item): item is string => Boolean(item));

  const copyLink = async () => {
    try {
      // 미리보기 화면이나 임시 배포 주소에서 눌러도 대표 주소가 복사되게 한다.
      const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/+$/, "");
      await navigator.clipboard.writeText(`${siteUrl}/service/${service.id}`);
      toast.success("링크를 복사했습니다");
    } catch {
      toast.error("링크를 복사하지 못했습니다");
    }
  };

  const openInquiry = () => setInquiryOpen(true);
  const actionButton =
    "inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#D5D9DE] px-3.5 text-[15px] font-bold hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
  const sectionTitle = "text-2xl font-black tracking-[-0.03em]";

  return (
    <div className="bg-white text-ink [word-break:keep-all]">
      {/* ===== 현재 위치 ===== */}
      <nav aria-label="현재 위치" className="border-b border-[#E2E5E9]">
        <ol className="mx-auto flex max-w-[1240px] items-center gap-1.5 px-4 py-3 text-sm text-[#56606B] md:px-8">
          <li className="shrink-0">
            <Link href="/" className="hover:text-ink hover:underline">
              홈
            </Link>
          </li>
          <li aria-hidden="true" className="shrink-0">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li className="shrink-0">
            <Link href={`/category/${category.slug}`} className="hover:text-ink hover:underline">
              {category.name}
            </Link>
          </li>
          <li aria-hidden="true" className="shrink-0">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="min-w-0 truncate font-medium text-ink">
            {service.title}
          </li>
        </ol>
      </nav>

      <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 md:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-14">
          <div className="flex flex-col gap-6">
            <Gallery service={service} />

            {/* ===== 제목 ===== */}
            <div className="flex flex-col gap-4">
              <h1 className="text-[clamp(28px,3.4vw,42px)] font-black leading-[1.2] tracking-[-0.03em]">
                {service.title}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-[#3A3A37]">
                  <Link
                    href={`/expert/${expert.id}`}
                    className="font-black text-ink underline-offset-4 hover:underline"
                  >
                    {expert.name}
                  </Link>
                  {meta.map((item) => (
                    <span key={item} className="before:mr-2 before:content-['·']">
                      {item}
                    </span>
                  ))}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-pressed={liked}
                    onClick={() => {
                      toggleFavorite(service.id);
                      toast.success(liked ? "찜 목록에서 삭제되었습니다" : "찜 목록에 추가되었습니다");
                    }}
                    className={actionButton}
                  >
                    <Heart className={cn("h-4 w-4", liked && "fill-ink")} aria-hidden="true" />
                    {liked ? "찜함" : "찜하기"}
                  </button>
                  <button type="button" onClick={copyLink} className={actionButton}>
                    <Link2 className="h-4 w-4" aria-hidden="true" />
                    링크 복사
                  </button>
                </div>
              </div>
            </div>

            {/* 좁은 화면에서는 가격과 주문을 제목 바로 아래에 둔다. */}
            <div className="flex flex-col gap-4 lg:hidden">
              <PurchaseBox
                service={service}
                selected={selectedPackage}
                onSelect={setSelectedPackage}
                onInquiry={openInquiry}
              />
              <OrderSteps />
            </div>
          </div>

          {/* ===== 서비스 설명 ===== */}
          <section className="flex flex-col gap-4">
            <h2 className={sectionTitle}>서비스 설명</h2>
            <p
              id="service-description"
              className={cn(
                "whitespace-pre-line text-[17px] leading-[1.75] text-[#3A3A37] [overflow-wrap:anywhere]",
                longDescription && !descriptionOpen && "line-clamp-12"
              )}
            >
              {service.description}
            </p>
            {longDescription && (
              <button
                type="button"
                aria-expanded={descriptionOpen}
                aria-controls="service-description"
                onClick={() => setDescriptionOpen((open) => !open)}
                className="self-start border-b-2 border-ink py-1 text-[15px] font-black"
              >
                {descriptionOpen ? "접기" : "설명 모두 보기"}
              </button>
            )}
            {service.tags.length > 0 && (
              <ul aria-label="태그" className="mt-2 flex flex-wrap gap-2">
                {service.tags.map((tag, i) => (
                  <li
                    key={`${i}-${tag}`}
                    className="inline-flex h-9 items-center rounded-full border border-[#D5D9DE] px-3.5 text-sm font-medium text-[#3A3A37]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ===== 전문가 ===== */}
          <section className="flex flex-col gap-4">
            <h2 className={sectionTitle}>전문가</h2>
            <div className="flex flex-col gap-5 rounded-[28px] bg-paper p-7 md:p-9">
              <div className="flex items-center gap-4">
                <ExpertAvatar expert={expert} />
                <div className="min-w-0">
                  <p className="text-xl font-black tracking-[-0.02em]">{expert.name}</p>
                  {expert.title && <p className="text-[15px] text-[#3A3A37]">{expert.title}</p>}
                </div>
              </div>
              {expert.introduction && (
                <p className="whitespace-pre-line text-[17px] leading-[1.7] text-[#3A3A37]">{expert.introduction}</p>
              )}
              {(expert.skills.length > 0 || expert.tools.length > 0) && (
                <dl className="flex flex-col gap-1.5 text-[15px]">
                  {expert.skills.length > 0 && (
                    <div className="flex gap-3">
                      <dt className="w-10 shrink-0 font-black">분야</dt>
                      <dd className="text-[#3A3A37]">{expert.skills.join(", ")}</dd>
                    </div>
                  )}
                  {expert.tools.length > 0 && (
                    <div className="flex gap-3">
                      <dt className="w-10 shrink-0 font-black">도구</dt>
                      <dd className="text-[#3A3A37]">{expert.tools.join(", ")}</dd>
                    </div>
                  )}
                </dl>
              )}
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/expert/${expert.id}`}
                  className="inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black"
                >
                  프로필 보기
                </Link>
                <button
                  type="button"
                  onClick={openInquiry}
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-[#E6E6E1]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  문의하기
                </button>
              </div>
            </div>
          </section>

          {/* ===== 같은 전문가의 다른 서비스 ===== */}
          {otherServices.length > 0 && (
            <section className="flex flex-col gap-5">
              <h2 className={sectionTitle}>{expert.name}님의 다른 서비스</h2>
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {otherServices.map((other) => (
                  <ServiceCard key={other.id} service={other} />
                ))}
              </div>
            </section>
          )}

          {/* ===== 리뷰 (실제로 등록된 리뷰가 있을 때만) ===== */}
          {reviews.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className={sectionTitle}>
                리뷰 <span className="font-display text-[28px] font-normal">{reviewTotal}</span>
              </h2>
              <ul className="border-t border-[#E2E5E9]">
                {reviews.map((review) => (
                  <li key={review.id} className="flex flex-col gap-2.5 border-b border-[#E2E5E9] py-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
                      <span role="img" aria-label={`5점 만점에 ${review.rating}점`} className="font-black tracking-[0.08em]">
                        {"★".repeat(review.rating)}
                        <span className="text-[#B9BEC5]">{"★".repeat(5 - review.rating)}</span>
                      </span>
                      <span className="font-bold">{review.name}</span>
                      <time dateTime={review.createdAt} className="text-[#56606B]">
                        {review.createdAt.replaceAll("-", ".")}
                      </time>
                    </div>
                    {review.content && (
                      <p className="whitespace-pre-line text-[17px] leading-[1.7] text-[#3A3A37] [overflow-wrap:anywhere]">
                        {review.content}
                      </p>
                    )}
                    {review.reply && (
                      <div className="mt-1 rounded-[20px] bg-paper p-5">
                        <p className="text-sm font-black">{expert.name}님의 답글</p>
                        <p className="mt-1.5 whitespace-pre-line text-[15px] leading-[1.7] text-[#3A3A37] [overflow-wrap:anywhere]">
                          {review.reply}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {reviewTotal > reviews.length && (
                <p className="text-[15px] text-[#56606B]">최근 리뷰 {reviews.length}개를 보여 드립니다.</p>
              )}
            </section>
          )}
        </div>

        {/* ===== 가격과 주문 (넓은 화면에서는 오른쪽에 붙어 따라온다) ===== */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 flex max-h-[calc(100dvh-7.5rem)] flex-col gap-4 overflow-y-auto scrollbar-hide">
            <PurchaseBox
              service={service}
              selected={selectedPackage}
              onSelect={setSelectedPackage}
              onInquiry={openInquiry}
            />
            <OrderSteps />
          </div>
        </aside>
      </div>

      <InquiryModal
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        serviceId={service.id}
        expertId={expert.id}
        serviceName={service.title}
        expertName={expert.name}
      />
    </div>
  );
}
