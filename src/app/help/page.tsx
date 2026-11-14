import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "고객센터",
  description: "자주 묻는 질문과 이용 가이드에서 뚝딱 이용 방법을 찾아보세요.",
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const PLACES = [
  {
    href: "/faq",
    title: "자주 묻는 질문",
    body: "서비스 이용, 주문과 작업, 결제와 환불, 전문가, 계정에 관한 질문과 답을 모았습니다.",
  },
  {
    href: "/guide",
    title: "이용 가이드",
    body: "의뢰하는 분과 전문가가 각각 어떤 순서로 이용하는지 정리했습니다.",
  },
  {
    href: "/messages",
    title: "메시지",
    body: "서비스 화면의 문의하기로 문의를 보내면 이곳에서 전문가와 대화가 이어집니다.",
  },
];

export default function HelpPage() {
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
                고객센터
              </li>
            </ol>
          </nav>
          <div className="flex flex-col gap-4 pt-4">
            <h1 className="font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em]">고객센터</h1>
            <p className="max-w-[720px] text-[17px] leading-relaxed text-[#3A3A37]">
              궁금한 점은 먼저 자주 묻는 질문과 이용 가이드에서 찾아보세요.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-16 px-4 pb-24 pt-12 md:px-8">
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-5">
          {PLACES.map((place) => (
            <li key={place.href}>
              <Link
                href={place.href}
                className="group flex h-full flex-col gap-3 rounded-[20px] border border-[#D5D9DE] p-7 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="text-[22px] font-black tracking-[-0.02em] group-hover:underline">{place.title}</span>
                  <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />
                </span>
                <span className="text-[17px] leading-relaxed text-[#3A3A37]">{place.body}</span>
              </Link>
            </li>
          ))}
        </ul>

        <section aria-labelledby="help-contact" className="flex max-w-[720px] flex-col gap-3">
          <h2 id="help-contact" className="text-[28px] font-black tracking-[-0.03em]">
            운영자에게 문의하기
          </h2>
          <p className="text-[17px] leading-relaxed text-[#3A3A37]">
            운영자에게 직접 문의할 수 있는 창구는 아직 열지 않았습니다. 창구를 열면 이 페이지에서 안내하겠습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
