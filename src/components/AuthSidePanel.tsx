import type { ReactNode } from "react";

const STEPS = [
  { word: "뚝.", text: "전문가가 올린 작업을 보고 고릅니다" },
  { word: "딱.", text: "패키지나 합의한 견적으로 맡깁니다" },
  { word: "끝.", text: "결과물을 확인하고 받습니다" },
];

// 로그인·회원가입 화면 왼쪽의 안내 영역. 넓은 화면에서만 보인다.
// 숫자, 후기, 등급 같은 내용 없이 이 사이트에서 하는 일만 적는다.
export function AuthSidePanel({ title, lead }: { title: ReactNode; lead: string }) {
  return (
    <aside aria-label="뚝딱 안내" className="hidden bg-night text-[#F4F2EE] [word-break:keep-all] lg:flex lg:w-1/2">
      <div className="flex w-full flex-col justify-center gap-14 p-12 xl:p-16">
        <div>
          <p className="font-display text-[clamp(44px,4.6vw,76px)] leading-[1.08] tracking-[-0.01em]">{title}</p>
          <p className="mt-6 max-w-[26em] text-[19px] leading-[1.7] text-[#C9CED4]">{lead}</p>
        </div>

        <ol className="grid gap-4 border-t border-white/20 pt-8">
          {STEPS.map((step) => (
            <li key={step.word} className="flex items-baseline gap-4">
              <span className="w-[2.2em] shrink-0 font-display text-[28px] leading-none text-brand">{step.word}</span>
              <span className="text-[17px] text-[#E4E6E9]">{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
