import type { Metadata } from "next";
import Link from "next/link";
import { SceneImage } from "@/components/SceneImage";
import { getPublicCategories, getPublicServices } from "@/lib/db-public";
import { streamFrameUrl } from "@/lib/stream";
import type { Service } from "@/types";

export const metadata: Metadata = {
  title: "전체 카테고리",
  description: "뚝딱의 영상 서비스 카테고리를 둘러보세요.",
};

// 공개 데이터만 쓰는 페이지라 정적으로 만들어 두고 60초마다 다시 만든다 (ISR).
export const revalidate = 60;

const formatPrice = (price: number) => new Intl.NumberFormat("ko-KR").format(price);

export default async function CategoriesPage() {
  // 공개 서비스를 한 번에 읽어 카테고리별로 나눈다 (카테고리마다 따로 조회하지 않는다).
  // 개수는 저장된 숫자가 아니라 실제 공개 서비스에서 센다.
  const [categories, services] = await Promise.all([getPublicCategories(), getPublicServices()]);

  const byCategory = new Map<string, Service[]>();
  for (const service of services) {
    const list = byCategory.get(service.categoryId);
    if (list) list.push(service);
    else byCategory.set(service.categoryId, [service]);
  }

  const filled = categories
    .filter((c) => byCategory.has(c.id))
    .map((c) => ({ category: c, services: byCategory.get(c.id) ?? [] }))
    .sort((a, b) => b.services.length - a.services.length);
  const empty = categories.filter((c) => !byCategory.has(c.id));

  return (
    <div className="min-h-screen bg-white text-ink [word-break:keep-all]">
      <section className="border-b border-[#E2E5E9]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 pb-8 pt-12 md:px-8">
          <h1 className="font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em]">
            전체 카테고리
          </h1>
          <p className="text-[17px] text-[#3A3A37]">
            {filled.length > 0
              ? `서비스가 있는 카테고리 ${filled.length}개 · 공개된 서비스 ${services.length}개`
              : "아직 공개된 서비스가 없습니다."}
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1240px] flex-col gap-16 px-4 pb-24 pt-10 md:px-8">
        {/* ===== 서비스가 있는 카테고리 ===== */}
        {filled.length > 0 && (
          <ul className="flex flex-col gap-5">
            {filled.map(({ category, services: list }, index) => {
              // 목록은 많이 팔린 순서다. 맨 앞 서비스의 영상 장면을 카테고리의 얼굴로 쓴다.
              const top = list[0];
              const scene = streamFrameUrl(top.images[0], { width: 960, height: 540 }) ?? top.thumbnail;
              const lowest = Math.min(...list.map((s) => s.price));
              return (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="group grid items-center gap-6 rounded-[28px] border border-[#D5D9DE] p-5 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] md:gap-10 md:p-6"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-[20px] bg-paper">
                      <SceneImage
                        src={scene}
                        fallbackSrc={top.thumbnail}
                        // 카드 전체가 하나의 링크라, 사진 설명까지 읽으면 링크 이름이 길어진다. 꾸밈으로 둔다.
                        alt=""
                        fill
                        preload={index === 0}
                        sizes="(max-width: 768px) 100vw, 440px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col items-start gap-3">
                      <h2 className="font-display text-[clamp(32px,4vw,52px)] leading-[1.05] group-hover:underline">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-[17px] text-[#3A3A37]">{category.description}</p>
                      )}
                      <p className="text-[17px] font-black">서비스 {list.length}개</p>
                      <span className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[15px] font-black text-white">
                        {formatPrice(lowest)}원부터
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* ===== 아직 서비스가 없는 카테고리 ===== */}
        {empty.length > 0 && (
          <section className="flex flex-col items-start gap-4">
            <h2 className="text-2xl font-black tracking-[-0.03em]">아직 서비스가 없는 카테고리</h2>
            <p className="max-w-[640px] text-base text-[#3A3A37]">
              전문가가 서비스를 올리면 위 목록에 나타납니다. 필요한 영상이 있다면 견적을 요청해 보세요.
            </p>
            <ul className="flex flex-wrap gap-2">
              {empty.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug}`}
                    className="inline-flex h-11 items-center rounded-full border border-[#D5D9DE] px-4 text-[15px] font-medium text-[#3A3A37] hover:border-ink hover:text-ink"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/request"
              className="mt-2 inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black"
            >
              견적 요청하기
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
