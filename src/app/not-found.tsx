import Link from "next/link";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

// 없는 주소로 들어왔을 때의 화면.
export default function NotFound() {
  return (
    <div className="bg-white text-ink [word-break:keep-all]">
      <div className="mx-auto flex min-h-[70vh] max-w-[1240px] flex-col justify-center px-4 py-20 md:px-8">
        <p aria-hidden="true" className="font-display text-[clamp(72px,12vw,160px)] leading-none">
          404
        </p>
        <h1 className="mt-6 font-display text-[clamp(34px,4.6vw,60px)] leading-[1.1]">페이지를 찾을 수 없습니다</h1>
        <p className="mt-5 max-w-[34em] text-[17px] leading-[1.7] text-[#3A3A37]">
          주소가 바뀌었거나 없는 페이지입니다. 주소를 다시 확인하거나 아래에서 이동해 주세요.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/"
            className={`inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black ${focusRing}`}
          >
            홈으로
          </Link>
          <Link
            href="/search"
            className={`inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper ${focusRing}`}
          >
            서비스 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
}
