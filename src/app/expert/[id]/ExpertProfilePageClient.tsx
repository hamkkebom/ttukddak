"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, MessageCircle } from "lucide-react";
import { ExpertAvatar } from "@/components/ExpertAvatar";
import { InquiryModal } from "@/components/InquiryModal";
import { ReviewSection } from "@/components/ReviewSection";
import { ServiceCard } from "@/components/ServiceCard";
import type { Category, Expert, PublicReview, Service } from "@/types";

interface ExpertProfilePageClientProps {
  expert: Expert;
  /** 이 전문가의 공개 서비스 */
  services: Service[];
  category: Category;
  /** 이 전문가가 받은 공개 리뷰 (최근 것부터) */
  reviews?: PublicReview[];
  reviewTotal?: number;
}

export default function ExpertProfilePageClient({
  expert,
  services,
  category,
  reviews = [],
  reviewTotal = reviews.length,
}: ExpertProfilePageClientProps) {
  const [inquiryOpen, setInquiryOpen] = useState(false);

  // joinedAt 은 "YYYY-MM-DD" 형태다.
  const [joinYear, joinMonth] = expert.joinedAt.split("-").map(Number);
  const meta = [
    expert.isMaster ? "마스터" : null,
    expert.isPrime ? "프라임" : null,
    joinYear && joinMonth ? `${joinYear}년 ${joinMonth}월부터 활동` : null,
  ].filter((item): item is string => Boolean(item));

  // 서비스가 하나뿐이면 그 서비스에 대한 문의로 보낸다. 여러 개거나 없으면 서비스를 정하지 않은 문의로 보낸다.
  const inquiryService = services.length === 1 ? services[0] : undefined;
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
            {expert.name}
          </li>
        </ol>
      </nav>

      {/* ===== 이름 ===== */}
      <section className="border-b border-[#E2E5E9]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:gap-8 md:px-8">
          <ExpertAvatar expert={expert} size={96} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em] [overflow-wrap:anywhere]">
              {expert.name}
            </h1>
            {expert.title && <p className="text-[19px] text-[#3A3A37]">{expert.title}</p>}
            {meta.length > 0 && <p className="text-[15px] text-[#56606B]">{meta.join(" · ")}</p>}
          </div>
          <button
            type="button"
            onClick={() => setInquiryOpen(true)}
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-ink px-7 text-base font-black text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            문의하기
          </button>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-14 px-4 pb-24 pt-10 md:px-8">
        {/* ===== 소개 ===== */}
        {(expert.introduction || expert.skills.length > 0 || expert.tools.length > 0) && (
          <section className="flex flex-col gap-4">
            <h2 className={sectionTitle}>소개</h2>
            <div className="flex flex-col gap-5 rounded-[28px] bg-paper p-7 md:p-9">
              {expert.introduction && (
                <p className="max-w-[820px] whitespace-pre-line text-[17px] leading-[1.75] text-[#3A3A37] [overflow-wrap:anywhere]">
                  {expert.introduction}
                </p>
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
            </div>
          </section>
        )}

        {/* ===== 서비스 ===== */}
        <section className="flex flex-col gap-5">
          <h2 className={sectionTitle}>
            서비스 <span className="font-display text-[28px] font-normal">{services.length}</span>
          </h2>
          {services.length > 0 ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {/* 이 화면이 곧 전문가 소개이므로 카드에는 전문가 이름을 다시 적지 않는다. */}
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <p className="rounded-[28px] bg-paper p-9 text-[17px] text-[#3A3A37]">지금 공개된 서비스가 없습니다.</p>
          )}
        </section>

        {/* ===== 리뷰 (실제로 등록된 리뷰가 있을 때만 그려진다) ===== */}
        <ReviewSection reviews={reviews} total={reviewTotal} replyFrom={expert.name} />
      </div>

      <InquiryModal
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        expertId={expert.id}
        expertName={expert.name}
        serviceId={inquiryService?.id}
        serviceName={inquiryService?.title}
        returnPath={`/expert/${expert.id}`}
      />
    </div>
  );
}
