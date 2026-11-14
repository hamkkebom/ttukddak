import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PAYMENT_CLOSED_NOTICE, PAYMENT_OPEN } from "@/lib/site-status";

export const metadata: Metadata = {
  title: "소개",
  description: "AI로 영상을 만드는 전문가를 찾고, 전문가가 올린 작업을 본 뒤 일을 맡기는 곳입니다.",
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const primaryLink = `inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black ${focusRing}`;
const secondaryLink = `inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper ${focusRing}`;
const textLink = `font-bold underline underline-offset-4 hover:text-black ${focusRing}`;

// 홈 화면의 뚝. 딱. 끝. 과 같은 문장을 쓴다.
const STEPS = [
  {
    word: "뚝.",
    title: "고릅니다",
    body: "전문가가 실제로 만든 영상을 보고 마음에 드는 서비스를 고르세요. 주문 전에 문의할 수 있습니다.",
  },
  {
    word: "딱.",
    title: "맡깁니다",
    body: "준비된 패키지를 고르거나, 전문가와 합의한 견적으로 주문합니다.",
  },
  {
    word: "끝.",
    title: "받습니다",
    body: "결과물을 확인하고 구매를 확정하면 끝입니다. 고칠 곳은 확정 전에 수정을 요청하세요.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-ink [word-break:keep-all]">
      <section className="border-b border-[#E2E5E9]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pb-10 pt-4 md:px-8">
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
                뚝딱 소개
              </li>
            </ol>
          </nav>
          <div className="flex flex-col gap-4 pt-4">
            <h1 className="font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em]">뚝딱 소개</h1>
            <p className="max-w-[720px] text-[17px] leading-relaxed text-[#3A3A37]">
              뚝딱은 AI로 영상을 만드는 전문가를 찾는 곳입니다. 전문가가 올린 작업을 먼저 보고, 궁금한 점을 물어본 뒤,
              마음에 드는 사람에게 일을 맡길 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-20 px-4 pb-24 pt-14 md:px-8">
        {/* ===== 할 수 있는 일 ===== */}
        <section aria-labelledby="about-can-do" className="flex flex-col gap-6">
          <h2 id="about-can-do" className="text-[28px] font-black tracking-[-0.03em]">
            여기서 할 수 있는 일
          </h2>
          <dl className="flex max-w-[860px] flex-col">
            <div className="grid gap-2 border-t border-[#E2E5E9] py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
              <dt className="text-[19px] font-black">영상 보고 고르기</dt>
              <dd className="max-w-[640px] text-[17px] leading-relaxed text-[#3A3A37]">
                서비스 화면에서 전문가가 올린 작업 영상과 이미지를 볼 수 있습니다.{" "}
                <Link href="/search" className={textLink}>
                  검색
                </Link>
                하거나{" "}
                <Link href="/categories" className={textLink}>
                  카테고리
                </Link>
                를 둘러보며 먼저 확인하세요.
              </dd>
            </div>
            <div className="grid gap-2 border-t border-[#E2E5E9] py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
              <dt className="text-[19px] font-black">주문 전에 묻기</dt>
              <dd className="max-w-[640px] text-[17px] leading-relaxed text-[#3A3A37]">
                궁금한 점은 주문하기 전에 서비스 화면의 문의하기로 전문가에게 물어볼 수 있습니다. 문의를 보내면 메시지에서
                대화가 이어집니다.
              </dd>
            </div>
            <div className="grid gap-2 border-y border-[#E2E5E9] py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8">
              <dt className="text-[19px] font-black">견적 요청하기</dt>
              <dd className="max-w-[640px] text-[17px] leading-relaxed text-[#3A3A37]">
                원하는 영상이 목록에 없으면 필요한 내용을 적어{" "}
                <Link href="/request" className={textLink}>
                  견적을 요청
                </Link>
                하세요. 관심 있는 전문가가 보낸 견적은 알림에서 확인할 수 있고, 견적 하나를 수락하면 요청은 마감되고 그
                전문가와 메시지에서 대화가 시작됩니다.
              </dd>
            </div>
          </dl>
        </section>

        {/* ===== 뚝. 딱. 끝. ===== */}
        <section aria-labelledby="about-steps" className="flex flex-col gap-6">
          <h2 id="about-steps" className="text-[28px] font-black tracking-[-0.03em]">
            맡기는 순서
          </h2>
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
            {STEPS.map((step, i) => {
              const last = i === STEPS.length - 1;
              return (
                <li
                  key={step.word}
                  className={`flex flex-col gap-3.5 rounded-[28px] p-9 ${last ? "bg-ink text-white" : "bg-paper"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`font-display text-[clamp(72px,8vw,112px)] leading-none ${last ? "text-brand" : ""}`}
                  >
                    {step.word}
                  </span>
                  <h3 className="text-2xl font-black tracking-[-0.02em]">{step.title}</h3>
                  <p className={`text-[17px] leading-relaxed ${last ? "text-[#E4E4E0]" : "text-[#3A3A37]"}`}>
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
          {!PAYMENT_OPEN && <p className="max-w-[720px] text-[17px] font-bold leading-relaxed">{PAYMENT_CLOSED_NOTICE}</p>}
          <p className="text-[17px] text-[#3A3A37]">
            단계마다 자세한 내용은{" "}
            <Link href="/guide" className={textLink}>
              이용 가이드
            </Link>
            에 있습니다.
          </p>
        </section>

        {/* ===== 전문가 ===== */}
        <section aria-labelledby="about-experts" className="flex flex-col gap-4">
          <h2 id="about-experts" className="text-[28px] font-black tracking-[-0.03em]">
            전문가로 참여하려면
          </h2>
          <p className="max-w-[720px] text-[17px] leading-relaxed text-[#3A3A37]">
            전문가 등록은 회원이면 누구나 신청할 수 있습니다. 운영자가 신청 내용을 검토해 승인하면 서비스를 등록하고, 패키지마다
            가격과 작업 기간, 수정 횟수를 정할 수 있습니다. 등록한 서비스는 검수를 거친 뒤 공개됩니다.
          </p>
        </section>

        <div className="flex flex-wrap gap-2 border-t border-[#E2E5E9] pt-10">
          <Link href="/search" className={primaryLink}>
            서비스 둘러보기
          </Link>
          <Link href="/expert/register" className={secondaryLink}>
            전문가로 등록하기
          </Link>
        </div>
      </div>
    </div>
  );
}
