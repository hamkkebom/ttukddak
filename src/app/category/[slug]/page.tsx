import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { EmptyNotice, ServiceBrowser, type SortOption } from "@/components/ServiceBrowser";
import {
  countPublicServicesByCategory,
  getPublicCategories,
  getPublicCategoryBySlug,
  getPublicExpertsByIds,
  getPublicServicesByCategory,
} from "@/lib/db-public";
import { cn } from "@/lib/utils";
import type { ExpertSummary } from "@/types";

type CategoryPageParams = {
  slug: string;
};

// 공개 데이터만 쓰는 페이지라 정적으로 만들어 두고 60초마다 다시 만든다 (ISR).
export const revalidate = 60;

// 빌드 때 미리 만들지 않고, 처음 요청될 때 만들어 캐시한다.
export async function generateStaticParams() {
  return [];
}

// 카테고리 화면은 많이 팔린 순서를 처음 정렬로 쓴다.
const SORT_OPTIONS: SortOption[] = ["popular", "latest", "rating", "price-low", "price-high"];

export async function generateMetadata({
  params,
}: {
  params: Promise<CategoryPageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  const name = category?.name || "카테고리";
  const description = category?.description || "AI 영상 전문가 서비스를 찾아보세요.";
  return {
    title: name,
    description,
    openGraph: { title: `${name} | 뚝딱`, description },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<CategoryPageParams>;
}) {
  const { slug } = await params;
  const [category, allCategories, counts] = await Promise.all([
    getPublicCategoryBySlug(slug),
    getPublicCategories(),
    countPublicServicesByCategory(),
  ]);
  // 없는 카테고리는 안내 화면(200)이 아니라 404 로 응답한다. 임의의 주소가 캐시에 쌓이는 것도 막는다.
  if (!category) notFound();

  const services = await getPublicServicesByCategory(category.id);
  // 카드에 붙일 전문가 이름은 서버에서 한 번에 읽어 넘긴다 (화면에서 카드마다 따로 요청하지 않는다).
  // 이름은 없어도 되는 정보다. 읽지 못했다고 화면 전체를 오류로 만들지 않고 이름 없이 보여 준다.
  const experts = await getPublicExpertsByIds(services.map((s) => s.expertId)).catch((error) => {
    console.error("[category] expert lookup failed:", error);
    return [];
  });
  // 카드에 필요한 항목만 넘긴다 (소개글·기술 목록 등은 화면 데이터에 싣지 않는다).
  const expertMap: Record<string, ExpertSummary> = Object.fromEntries(
    experts.map(({ id, name, isMaster }) => [id, { id, name, isMaster }])
  );

  // 바로가기에는 서비스가 있는 카테고리만 놓는다. 지금 카테고리는 서비스가 없어도 포함한다.
  // 개수는 저장된 숫자가 아니라 공개 서비스에서 직접 센 값이다.
  const shortcuts = allCategories
    .map((c) => ({ ...c, count: c.id === category.id ? services.length : (counts[c.id] ?? 0) }))
    .filter((c) => c.id === category.id || c.count > 0);

  const summary = [category.description, `서비스 ${services.length}개`].filter(Boolean).join(" · ");
  const primaryLink =
    "inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black";
  const secondaryLink =
    "inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper";

  return (
    <div className="min-h-screen bg-white text-ink [word-break:keep-all]">
      <section className="border-b border-[#E2E5E9]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pb-6 pt-4 md:px-8">
          <nav aria-label="현재 위치">
            <ol className="flex items-center gap-1.5 text-sm text-[#56606B]">
              <li className="shrink-0">
                <Link href="/" className="hover:text-ink hover:underline">
                  홈
                </Link>
              </li>
              <li aria-hidden="true" className="shrink-0">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="shrink-0">
                <Link href="/categories" className="hover:text-ink hover:underline">
                  전체 카테고리
                </Link>
              </li>
              <li aria-hidden="true" className="shrink-0">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="min-w-0 truncate font-medium text-ink">
                {category.name}
              </li>
            </ol>
          </nav>

          <div className="flex flex-col gap-3 pt-4">
            <h1 className="font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em] [overflow-wrap:anywhere]">
              {category.name}
            </h1>
            <p className="text-[17px] text-[#3A3A37]">{summary}</p>
          </div>

          {/* 갈 곳이 지금 카테고리 하나뿐이면 바로가기를 놓지 않는다. */}
          {shortcuts.length > 1 && (
            <nav aria-label="서비스가 있는 카테고리" className="flex flex-wrap gap-2">
              {shortcuts.map((c) => {
                const active = c.id === category.id;
                return (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px]",
                      active
                        ? "bg-ink font-bold text-white hover:bg-black"
                        : "border border-[#D5D9DE] font-medium hover:border-ink"
                    )}
                  >
                    {c.name} <span className={active ? "font-medium" : "text-[#56606B]"}>{c.count}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 md:px-8">
        <ServiceBrowser
          // 다른 카테고리로 넘어가면 고른 정렬·필터가 남지 않도록 새로 만든다.
          key={category.id}
          services={services}
          expertMap={expertMap}
          sortOptions={SORT_OPTIONS}
          empty={
            <EmptyNotice
              title="이 카테고리에는 아직 서비스가 없습니다"
              body="필요한 영상을 적어 견적을 요청하거나, 지금 공개된 서비스를 둘러보세요."
            >
              <Link href="/request" className={primaryLink}>
                견적 요청하기
              </Link>
              <Link href="/search" className={secondaryLink}>
                전체 서비스 보기
              </Link>
            </EmptyNotice>
          }
        />
      </div>
    </div>
  );
}
