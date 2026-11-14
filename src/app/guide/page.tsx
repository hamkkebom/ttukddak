import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { PAYMENT_CLOSED_NOTICE, PAYMENT_OPEN } from "@/lib/site-status";

export const metadata: Metadata = {
  title: "이용 가이드",
  description: "의뢰하는 분과 전문가가 뚝딱을 이용하는 순서를 단계별로 정리했습니다.",
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const primaryLink = `inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black ${focusRing}`;
const secondaryLink = `inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper ${focusRing}`;
const textLink = `font-bold underline underline-offset-4 hover:text-black ${focusRing}`;
const chipLink = `inline-flex h-11 items-center rounded-full border border-[#D5D9DE] px-4 text-[15px] font-medium hover:border-ink ${focusRing}`;

type Step = { title: string; body: ReactNode };

const BUYER_STEPS: Step[] = [
  {
    title: "서비스 찾기",
    body: (
      <>
        <Link href="/search" className={textLink}>
          검색
        </Link>
        하거나{" "}
        <Link href="/categories" className={textLink}>
          카테고리
        </Link>
        를 둘러보며 서비스를 찾습니다. 서비스 화면에서 전문가가 올린 작업 영상과 이미지를 볼 수 있습니다.
      </>
    ),
  },
  {
    title: "주문 전에 문의하기",
    body: "궁금한 점은 주문하기 전에 서비스 화면의 문의하기로 전문가에게 물어보세요. 문의를 보내면 메시지에서 대화가 이어집니다.",
  },
  {
    title: "패키지나 견적으로 주문하기",
    body: (
      <>
        전문가가 정해 둔 패키지를 고르거나, 전문가와 합의한 견적으로 주문합니다. 작업 기간은 고른 패키지에
        적힌 대로이고, 패키지에 적힌 수정 횟수가 전문가와 약속한 범위입니다. 아직 적혀 있지 않은 서비스는 전문가에게
        물어보세요.
        <span className="mt-3 block font-bold text-ink">
          {PAYMENT_OPEN
            ? "결제는 카드, 카카오페이, 네이버페이, 가상계좌로 할 수 있습니다. 패키지로 주문하면 주문 금액에 서비스 수수료 5%가 더해집니다. 합의한 견적으로 주문하면 견적 금액 그대로 결제합니다."
            : PAYMENT_CLOSED_NOTICE}
        </span>
      </>
    ),
  },
  {
    title: "결과물 받고 수정 요청하기",
    body: "전문가가 작업을 마치면 결과물을 보내 줍니다. 고칠 곳이 있으면 구매를 확정하기 전에 수정을 요청하세요.",
  },
  {
    title: "구매 확정하고 리뷰 남기기",
    body: "결과물이 마음에 들면 구매를 확정합니다. 확정한 뒤에는 리뷰를 남길 수 있습니다.",
  },
];

const EXPERT_STEPS: Step[] = [
  {
    title: "등록 신청하기",
    body: (
      <>
        <Link href="/expert/register" className={textLink}>
          전문가 등록
        </Link>{" "}
        화면에서 신청합니다. 회원이면 누구나 신청할 수 있습니다.
      </>
    ),
  },
  {
    title: "운영자 검토",
    body: "운영자가 신청 내용을 검토합니다. 승인되면 서비스를 등록할 수 있습니다.",
  },
  {
    title: "서비스와 패키지 등록하기",
    body: "서비스를 만들고, 패키지마다 가격과 작업 기간, 수정 횟수를 정합니다.",
  },
  {
    title: "검수 후 공개",
    body: "등록한 서비스는 검수를 거친 뒤 공개됩니다.",
  },
  {
    title: "문의와 주문에 답하기",
    body: "문의에는 메시지로 답하고, 견적 요청에는 견적 요청 화면에서 견적을 보냅니다. 주문을 받으면 작업한 결과물을 보내고, 수정 요청이 오면 반영합니다.",
  },
];

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => (
        <li
          key={step.title}
          className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 border-t border-[#E2E5E9] py-7 last:border-b md:grid-cols-[88px_minmax(0,1fr)] md:gap-6"
        >
          <span aria-hidden="true" className="font-display text-[40px] leading-none md:text-[52px]">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col gap-2">
            <h3 className="text-[22px] font-black leading-[1.3] tracking-[-0.02em]">{step.title}</h3>
            <p className="max-w-[680px] text-[17px] leading-relaxed text-[#3A3A37]">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function GuidePage() {
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
                이용 가이드
              </li>
            </ol>
          </nav>
          <div className="flex flex-col gap-4 pt-4">
            <h1 className="font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em]">이용 가이드</h1>
            <p className="max-w-[720px] text-[17px] leading-relaxed text-[#3A3A37]">
              의뢰하는 분과 전문가가 각각 어떤 순서로 이용하는지 정리했습니다.
            </p>
          </div>
          <nav aria-label="가이드 목차" className="flex flex-wrap gap-2">
            <a href="#buyer" className={chipLink}>
              의뢰하는 분
            </a>
            <a href="#expert" className={chipLink}>
              전문가
            </a>
            <a href="#trouble" className={chipLink}>
              문제가 생겼을 때
            </a>
          </nav>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-20 px-4 pb-24 pt-14 md:px-8">
        {/* ===== 의뢰하는 분 ===== */}
        <section id="buyer" aria-labelledby="guide-buyer" className="flex scroll-mt-24 flex-col gap-6">
          <h2 id="guide-buyer" className="font-display text-[clamp(32px,4vw,52px)] leading-[1.05]">
            의뢰하는 분
          </h2>
          <StepList steps={BUYER_STEPS} />
          <div className="flex flex-col items-start gap-3 rounded-[20px] bg-paper p-7 md:p-8">
            <h3 className="text-[22px] font-black tracking-[-0.02em]">원하는 서비스가 없을 때</h3>
            <p className="max-w-[680px] text-[17px] leading-relaxed text-[#3A3A37]">
              필요한 영상을 적어 견적 요청을 올리세요. 요청을 올리면 관심 있는 전문가가 견적을 보냅니다. 받은 견적은
              알림에서 확인할 수 있습니다. 견적 하나를 수락하면 요청은 마감되고, 그 전문가와 메시지에서 대화가
              시작됩니다.
            </p>
            <Link href="/request" className={`mt-2 ${primaryLink}`}>
              견적 요청하기
            </Link>
          </div>
        </section>

        {/* ===== 전문가 ===== */}
        <section id="expert" aria-labelledby="guide-expert" className="flex scroll-mt-24 flex-col gap-6">
          <h2 id="guide-expert" className="font-display text-[clamp(32px,4vw,52px)] leading-[1.05]">
            전문가
          </h2>
          <StepList steps={EXPERT_STEPS} />
        </section>

        {/* ===== 문제가 생겼을 때 ===== */}
        <section id="trouble" aria-labelledby="guide-trouble" className="flex scroll-mt-24 flex-col gap-5">
          <h2 id="guide-trouble" className="text-[28px] font-black tracking-[-0.03em]">
            문제가 생겼을 때
          </h2>
          <ul className="flex max-w-[720px] flex-col gap-3 text-[17px] leading-relaxed text-[#3A3A37]">
            <li className="border-l-2 border-ink pl-4">
              작업 내용이나 일정에 관한 일은 먼저 메시지에서 담당 전문가와 이야기해 주세요.
            </li>
            <li className="border-l-2 border-ink pl-4">
              결과물에 고칠 곳이 있으면 구매를 확정하기 전에 수정을 요청하세요.
            </li>
            <li className="border-l-2 border-ink pl-4">
              취소와 환불 기준은{" "}
              <Link href="/terms" className={textLink}>
                이용약관
              </Link>
              에 있습니다.
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-2 border-t border-[#E2E5E9] pt-10">
          <Link href="/search" className={primaryLink}>
            서비스 둘러보기
          </Link>
          <Link href="/faq" className={secondaryLink}>
            자주 묻는 질문
          </Link>
        </div>
      </div>
    </div>
  );
}
