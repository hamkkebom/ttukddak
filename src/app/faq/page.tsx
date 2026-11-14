import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PAYMENT_CLOSED_NOTICE, PAYMENT_OPEN } from "@/lib/site-status";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: "뚝딱 이용, 주문과 작업, 결제와 환불, 전문가 등록, 계정에 관한 질문과 답을 모았습니다.",
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const primaryLink = `inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black ${focusRing}`;
const secondaryLink = `inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper ${focusRing}`;
const textLink = `font-bold underline underline-offset-4 hover:text-black ${focusRing}`;
const chipLink = `inline-flex h-11 items-center rounded-full border border-[#D5D9DE] px-4 text-[15px] font-medium hover:border-ink ${focusRing}`;

type Question = { q: string; a: ReactNode };
type Group = { id: string; title: string; items: Question[] };

const GROUPS: Group[] = [
  {
    id: "use",
    title: "서비스 이용",
    items: [
      {
        q: "뚝딱은 어떤 곳인가요?",
        a: "AI로 영상을 만드는 전문가를 찾고, 전문가가 올린 작업을 본 뒤 일을 맡기는 곳입니다. 주문하기 전에 전문가에게 궁금한 점을 물어볼 수 있습니다.",
      },
      {
        q: "어떤 영상을 맡길 수 있나요?",
        a: (
          <>
            지금{" "}
            <Link href="/search" className={textLink}>
              공개된 서비스
            </Link>
            나{" "}
            <Link href="/categories" className={textLink}>
              카테고리
            </Link>
            에서 확인할 수 있습니다.
          </>
        ),
      },
      {
        q: "원하는 서비스가 없으면 어떻게 하나요?",
        a: (
          <>
            <Link href="/request" className={textLink}>
              견적 요청
            </Link>
            에 필요한 영상을 적어 올리세요. 요청을 올리면 관심 있는 전문가가 견적을 보냅니다. 받은 견적은 알림에서 확인할
            수 있습니다. 견적 하나를 수락하면 요청은 마감되고, 그 전문가와 메시지에서 대화가 시작됩니다.
          </>
        ),
      },
      {
        q: "주문하기 전에 전문가에게 물어볼 수 있나요?",
        a: (
          <>
            네. 서비스 화면의 문의하기로 문의를 보내면{" "}
            <Link href="/messages" className={textLink}>
              메시지
            </Link>
            에서 전문가와 대화가 이어집니다.
          </>
        ),
      },
    ],
  },
  {
    id: "order",
    title: "주문과 작업",
    items: [
      {
        q: "주문은 어떻게 하나요?",
        a: PAYMENT_OPEN
          ? "서비스에서 전문가가 정해 둔 패키지를 고르거나, 전문가와 합의한 견적으로 주문합니다."
          : `서비스에서 전문가가 정해 둔 패키지를 고르거나, 전문가와 합의한 견적으로 주문합니다. ${PAYMENT_CLOSED_NOTICE}`,
      },
      {
        q: "작업 기간과 수정 횟수는 어떻게 정해지나요?",
        a: "작업 기간은 고른 패키지에 적힌 대로이고, 패키지에 적힌 수정 횟수가 전문가와 약속한 범위입니다. 아직 적혀 있지 않은 서비스는 주문하기 전에 전문가에게 물어보세요.",
      },
      {
        q: "받은 결과물을 고치고 싶어요.",
        a: "구매를 확정하기 전에 수정을 요청할 수 있습니다. 패키지에 적힌 수정 횟수가 전문가와 약속한 범위입니다.",
      },
      {
        q: "구매 확정은 무엇인가요?",
        a: "결과물을 받고 더 고칠 곳이 없을 때 구매를 확정합니다. 확정한 뒤에는 리뷰를 남길 수 있습니다.",
      },
    ],
  },
  {
    id: "payment",
    title: "결제와 환불",
    items: [
      {
        q: "결제는 어떻게 하나요?",
        a: PAYMENT_OPEN ? "카드, 카카오페이, 네이버페이, 가상계좌로 결제할 수 있습니다." : PAYMENT_CLOSED_NOTICE,
      },
      // 결제를 열기 전에는 수수료를 안내하지 않는다.
      ...(PAYMENT_OPEN
        ? [
            {
              q: "수수료가 있나요?",
              a: "패키지로 주문하면 주문 금액에 서비스 수수료 5%가 더해집니다. 합의한 견적으로 주문하면 견적 금액 그대로 결제합니다.",
            },
          ]
        : []),
      {
        q: "취소나 환불은 어떻게 하나요?",
        a: (
          <>
            취소와 환불 기준은{" "}
            <Link href="/terms" className={textLink}>
              이용약관
            </Link>
            에 있습니다. 작업에 관한 문제라면 먼저 메시지에서 전문가와 이야기해 보세요.
          </>
        ),
      },
    ],
  },
  {
    id: "expert",
    title: "전문가",
    items: [
      {
        q: "전문가로 등록하려면 어떻게 하나요?",
        a: (
          <>
            <Link href="/expert/register" className={textLink}>
              전문가 등록
            </Link>{" "}
            화면에서 회원이면 누구나 신청할 수 있습니다. 운영자가 신청 내용을 검토해 승인하면 서비스를 등록할 수 있습니다.
          </>
        ),
      },
      {
        q: "서비스는 어떻게 올리나요?",
        a: "승인된 전문가는 서비스를 등록하고 패키지마다 가격과 작업 기간, 수정 횟수를 정합니다. 등록한 서비스는 검수를 거친 뒤 공개됩니다.",
      },
    ],
  },
  {
    id: "account",
    title: "계정",
    items: [
      {
        q: "비밀번호를 잊어버렸어요.",
        a: (
          <>
            <Link href="/forgot-password" className={textLink}>
              비밀번호 찾기
            </Link>
            에서 비밀번호를 다시 설정할 수 있습니다.
          </>
        ),
      },
      {
        q: "회원 탈퇴는 어떻게 하나요?",
        a: (
          <>
            <Link href="/settings" className={textLink}>
              설정
            </Link>
            의 &lsquo;개인정보 및 탈퇴&rsquo;에서 탈퇴할 수 있습니다.
          </>
        ),
      },
    ],
  },
];

export default function FAQPage() {
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
                자주 묻는 질문
              </li>
            </ol>
          </nav>
          <div className="flex flex-col gap-4 pt-4">
            <h1 className="font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em]">
              자주 묻는 질문
            </h1>
            <p className="max-w-[720px] text-[17px] leading-relaxed text-[#3A3A37]">
              질문을 누르면 답이 펼쳐집니다. 이용 순서는{" "}
              <Link href="/guide" className={textLink}>
                이용 가이드
              </Link>
              에 정리해 두었습니다.
            </p>
          </div>
          <nav aria-label="질문 분류" className="flex flex-wrap gap-2">
            {GROUPS.map((group) => (
              <a key={group.id} href={`#${group.id}`} className={chipLink}>
                {group.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-16 px-4 pb-24 pt-12 md:px-8">
        {GROUPS.map((group) => (
          <section
            key={group.id}
            id={group.id}
            aria-labelledby={`faq-${group.id}`}
            className="flex max-w-[880px] scroll-mt-24 flex-col gap-4"
          >
            <h2 id={`faq-${group.id}`} className="text-[28px] font-black tracking-[-0.03em]">
              {group.title}
            </h2>
            <div className="flex flex-col border-b border-[#E2E5E9]">
              {group.items.map((item) => (
                <details key={item.q} className="group border-t border-[#E2E5E9]">
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-[10px] py-5 text-[19px] font-bold leading-[1.4] hover:underline [&::-webkit-details-marker]:hidden ${focusRing}`}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="max-w-[680px] pb-6 text-[17px] leading-relaxed text-[#3A3A37]">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section aria-labelledby="faq-more" className="flex flex-col items-start gap-3 rounded-[28px] bg-paper p-9">
          <h2 id="faq-more" className="text-2xl font-black tracking-[-0.03em]">
            찾는 답이 없나요?
          </h2>
          <p className="max-w-[640px] text-[17px] leading-relaxed text-[#3A3A37]">
            서비스나 작업에 관한 질문은 서비스 화면의 문의하기로 전문가에게 물어보세요. 문의를 보내면 메시지에서 대화가
            이어집니다.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/search" className={primaryLink}>
              서비스 둘러보기
            </Link>
            <Link href="/help" className={secondaryLink}>
              고객센터
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
