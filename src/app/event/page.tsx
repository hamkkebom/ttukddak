import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyNotice } from "@/components/ServiceBrowser";

export const metadata: Metadata = {
  title: "이벤트",
  description: "뚝딱에서 진행하는 이벤트를 안내하는 페이지입니다.",
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const primaryLink = `inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black ${focusRing}`;
const secondaryLink = `inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper ${focusRing}`;

export default function EventPage() {
  return (
    <div className="min-h-screen bg-white text-ink [word-break:keep-all]">
      <section className="border-b border-[#E2E5E9]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pb-8 pt-4 md:px-8">
          <nav aria-label="현재 위치">
            <ol className="flex items-center gap-1.5 text-sm text-[#56606B]">
              <li className="shrink-0">
                <Link href="/" className={`inline-flex min-h-6 items-center hover:text-ink hover:underline ${focusRing}`}>
                  홈
                </Link>
              </li>
              <li aria-hidden="true" className="shrink-0">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="font-medium text-ink">
                이벤트
              </li>
            </ol>
          </nav>
          <h1 className="pt-4 font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em]">이벤트</h1>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-10 md:px-8">
        <EmptyNotice
          title="지금 진행 중인 이벤트가 없습니다"
          body="공개된 서비스를 둘러보거나 카테고리별로 찾아보세요."
        >
          <Link href="/search" className={primaryLink}>
            서비스 둘러보기
          </Link>
          <Link href="/categories" className={secondaryLink}>
            전체 카테고리
          </Link>
        </EmptyNotice>
      </div>
    </div>
  );
}
