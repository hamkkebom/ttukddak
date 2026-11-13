import Link from "next/link";
import { Play } from "lucide-react";
import {
  getPublicServices,
  getPublicServiceById,
  countPublicExpertsWithServices,
  countPublicServices,
} from "@/lib/db-public";
import { SceneImage } from "@/components/SceneImage";
import { streamFrameUrl } from "@/lib/stream";
import type { Service } from "@/types";

// 공개 데이터만 쓰는 페이지라 정적으로 만들어 두고 60초마다 다시 만든다 (ISR).
export const revalidate = 60;

// 첫 화면에 보여 줄 작업. 이 서비스가 공개 상태가 아니면 가장 많이 팔린 서비스로 대신한다.
const HERO_SERVICE_ID = "b2304722-6711-4a7b-bc4b-bb03cef2fec2";

// 영상 종류 바로가기. 개수는 검색과 같은 조건(제목·설명)으로 세고, 하나도 없는 종류는 숨긴다.
const VIDEO_TYPES = ["힐링", "운세", "소개", "브랜딩"];

const formatPrice = (price: number) => new Intl.NumberFormat("ko-KR").format(price);

// 서비스 영상의 한 장면. 영상이 없으면 등록된 썸네일을 쓴다.
function sceneOf(service: Service, width: number, height: number): string {
  return streamFrameUrl(service.images[0], { width, height }) ?? service.thumbnail;
}

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

export default async function HomePage() {
  const [services, chosenHero, expertCount, serviceCount, typeCounts] = await Promise.all([
    getPublicServices(20),
    getPublicServiceById(HERO_SERVICE_ID),
    countPublicExpertsWithServices(),
    countPublicServices(),
    Promise.all(VIDEO_TYPES.map((type) => countPublicServices(type))),
  ]);

  const heroService = chosenHero ?? services[0];
  const popular = services.slice(0, 3);
  const videoTypes = VIDEO_TYPES.map((type, i) => ({ type, count: typeCounts[i] })).filter((t) => t.count > 0);

  // 카드마다 똑같이 붙은 태그는 서로를 구분해 주지 못하므로 뺀다. 카드가 하나뿐이면 뺄 것이 없다.
  const sharedTags = new Set(
    popular.length > 1 ? popular[0].tags.filter((tag) => popular.every((s) => s.tags.includes(tag))) : []
  );

  return (
    <div className="bg-white text-ink [word-break:keep-all]">
      {/* ===== 첫 화면 ===== */}
      <section className="relative flex min-h-[560px] items-end overflow-hidden bg-night text-[#F4F2EE] md:min-h-[660px]">
        {heroService && (
          <div className="absolute inset-y-0 left-[18%] w-full">
            <SceneImage
              src={sceneOf(heroService, 1600, 900)}
              fallbackSrc={heroService.thumbnail}
              alt={`${heroService.title}의 한 장면`}
              fill
              preload
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}
        {/* 글자가 읽히도록 사진을 어둡게 덮는다. 좁은 화면에서는 글자가 사진 위에 넓게 놓이므로 더 짙게 덮는다. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,#0E0F11_0%,rgba(14,15,17,0.86)_45%,rgba(14,15,17,0.7)_100%)] md:bg-[linear-gradient(90deg,#0E0F11_0%,#0E0F11_20%,rgba(14,15,17,0.6)_46%,rgba(14,15,17,0.12)_100%)]"
        />
        <div className="relative mx-auto flex w-full max-w-[1240px] flex-col gap-7 px-4 pb-14 pt-24 md:px-8">
          <p className="text-sm font-black tracking-[0.14em] text-brand">AI 영상 재능마켓</p>
          <h1 className="text-[clamp(44px,6.2vw,88px)] font-black leading-[1.1] tracking-[-0.04em]">
            영상이 필요한 순간,
            <br />
            뚝딱.
          </h1>
          <p className="max-w-[540px] text-[19px] text-[#DDDAD3]">
            AI로 영상을 만드는 전문가{expertCount > 0 ? ` ${expertCount}명` : "들"}의 실제 작업을 먼저 보고, 마음에 드는 사람에게 바로
            맡기세요.
          </p>
          <form action="/search" method="get" role="search" className="flex max-w-[560px] flex-wrap gap-2">
            <label htmlFor="home-search" className="sr-only">
              서비스 검색
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder="어떤 영상이 필요하세요?"
              className="h-14 min-w-0 flex-[1_1_260px] rounded-[10px] border border-[#55585E] bg-[rgba(22,24,27,0.92)] px-5 text-base text-[#F4F2EE] placeholder:text-[#A8A6A0] focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
            <button
              type="submit"
              className="h-14 rounded-[10px] bg-brand px-7 text-base font-black text-[#1B0E03] transition-colors hover:bg-[#FF7A45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              찾아보기
            </button>
          </form>
          {heroService && (
            <Link
              href={`/service/${heroService.id}`}
              className="mt-5 inline-flex items-center gap-2.5 self-start py-2 text-[13px] text-[#CFCCC5] hover:text-white"
            >
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>지금 보이는 장면 · {heroService.title}</span>
            </Link>
          )}
        </div>
      </section>

      {/* ===== 영상 종류 ===== */}
      <nav aria-label="영상 종류" className="border-b border-[#E2E5E9]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 md:px-8">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/search"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-[15px] font-bold text-white hover:bg-black"
            >
              전체 <span className="font-medium">{serviceCount}</span>
            </Link>
            {videoTypes.map(({ type, count }) => (
              <Link
                key={type}
                href={`/search?q=${encodeURIComponent(type)}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-[#D5D9DE] px-4 text-[15px] font-medium hover:border-ink"
              >
                {type} <span className="text-[#56606B]">{count}</span>
              </Link>
            ))}
          </div>
          <Link href="/request" className="py-3 text-[15px] font-bold hover:underline">
            원하는 영상이 없다면 견적 요청 →
          </Link>
        </div>
      </nav>

      {/* ===== 지금 인기 ===== */}
      {popular.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-4 pt-20 md:px-8">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(44px,5.4vw,76px)] leading-none tracking-[-0.01em]">지금 인기</h2>
            <Link href="/search" className="border-b-[3px] border-ink py-3 text-[17px] font-black hover:text-[#C2410C]">
              서비스 {serviceCount}개 모두 보기
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-7">
            {popular.map((service, i) => {
              const tags = service.tags.filter((tag) => !sharedTags.has(tag)).slice(0, 2);
              const meta = [...tags, service.reviewCount > 0 ? `★ ${service.rating.toFixed(1)} (${service.reviewCount})` : null]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link key={service.id} href={`/service/${service.id}`} className="group flex flex-col gap-[18px]">
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-[28px] border-[3px] border-ink bg-paper">
                    <SceneImage
                      src={sceneOf(service, 800, 600)}
                      fallbackSrc={service.thumbnail}
                      alt={`${service.title}의 한 장면`}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                    />
                  </span>
                  <span className="flex items-start gap-4">
                    <span aria-hidden="true" className="font-display text-[44px] leading-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex flex-col items-start gap-2">
                      <span className="text-[22px] font-black leading-[1.3] tracking-[-0.02em] group-hover:underline">
                        {service.title}
                      </span>
                      {meta && <span className="text-[15px] font-medium text-[#4A4A46]">{meta}</span>}
                      <span className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[15px] font-black text-white">
                        {formatPrice(service.price)}원부터
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== 뚝. 딱. 끝. ===== */}
      <section className="mx-auto max-w-[1240px] px-4 pt-[88px] md:px-8">
        <h2 className="sr-only">이용 방법</h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {STEPS.map((step, i) => {
            const last = i === STEPS.length - 1;
            return (
              <li
                key={step.word}
                className={`flex flex-col gap-3.5 rounded-[28px] p-9 ${last ? "bg-ink text-white" : "bg-paper"}`}
              >
                <span className={`font-display text-[clamp(72px,8vw,112px)] leading-none ${last ? "text-brand" : ""}`}>
                  {step.word}
                </span>
                <h3 className="text-2xl font-black tracking-[-0.02em]">{step.title}</h3>
                <p className={`text-[17px] ${last ? "text-[#E4E4E0]" : "text-[#3A3A37]"}`}>{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ===== 견적 요청 · 전문가 등록 ===== */}
      <section className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-5 px-4 pb-[88px] pt-5 md:px-8">
        <div className="flex flex-col items-start gap-3 rounded-[28px] border border-[#D5D9DE] p-9">
          <h2 className="text-2xl font-black tracking-[-0.03em]">원하는 영상이 목록에 없나요?</h2>
          <p className="text-base text-[#3A3A37]">필요한 영상을 적어 올리면 전문가가 견적을 보내 드립니다.</p>
          <Link
            href="/request"
            className="mt-2 inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black"
          >
            견적 요청하기
          </Link>
        </div>
        <div className="flex flex-col items-start gap-3 rounded-[28px] border border-[#D5D9DE] p-9">
          <h2 className="text-2xl font-black tracking-[-0.03em]">영상을 만드는 분이신가요?</h2>
          <p className="text-base text-[#3A3A37]">
            서비스를 올리고 의뢰를 받아 보세요. 등록한 서비스는 검수를 거쳐 공개됩니다.
          </p>
          <Link
            href="/expert/register"
            className="mt-2 inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper"
          >
            전문가로 등록하기
          </Link>
        </div>
      </section>
    </div>
  );
}
