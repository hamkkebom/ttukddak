"use client";

import { useMemo, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ServiceCard } from "@/components/ServiceCard";
import { cn } from "@/lib/utils";
import type { Category, ExpertSummary, Service } from "@/types";

export type SortOption = "relevance" | "popular" | "latest" | "rating" | "price-low" | "price-high";

const SORT_LABELS: Record<SortOption, string> = {
  relevance: "관련도순",
  popular: "인기순",
  latest: "최신순",
  rating: "평점순",
  "price-low": "낮은 가격",
  "price-high": "높은 가격",
};

// 가격 필터를 움직이는 단위
const PRICE_STEP = 10000;

const formatPrice = (price: number) => new Intl.NumberFormat("ko-KR").format(price);

interface ServiceBrowserProps {
  /** 필터·정렬을 하기 전의 목록. "관련도순"은 이 순서를 그대로 쓴다. */
  services: Service[];
  /** 카드에 보여 줄 전문가 정보 (전문가 id → 전문가) */
  expertMap: Record<string, ExpertSummary>;
  /** 고를 수 있는 정렬. 첫 번째가 처음 값이다. */
  sortOptions: SortOption[];
  /** 목록을 불러오는 중인지 */
  loading?: boolean;
  /** 전문가 정보를 다 받았는지. 아니면 "마스터 전문가" 필터는 결과를 내지 않고 기다린다. */
  expertsReady?: boolean;
  /** 카테고리 필터에 쓸 이름 목록. 주지 않으면 카테고리 필터가 없다 (카테고리 화면처럼 이미 하나로 좁혀진 경우). */
  categories?: Category[];
  /** 이 값이 바뀌면 그 목록에서 고른 카테고리와 가격 상한을 버린다 (검색어 등). */
  scopeKey?: string;
  /** 목록 자체가 비었을 때 보여 줄 안내 */
  empty: ReactNode;
}

/* ───────────────────────────────────── 필터 ───────────────────────────────────── */

interface FiltersProps {
  categoryOptions: { id: string; name: string; count: number }[];
  category: string;
  onCategoryChange: (id: string) => void;
  priceFloor: number;
  priceCeil: number;
  priceCap: number | null;
  onPriceCapChange: (cap: number | null) => void;
  onlyPrime: boolean;
  onlyFast: boolean;
  onlyMaster: boolean;
  onTogglePrime: () => void;
  onToggleFast: () => void;
  onToggleMaster: () => void;
}

function Filters({
  categoryOptions,
  category,
  onCategoryChange,
  priceFloor,
  priceCeil,
  priceCap,
  onPriceCapChange,
  onlyPrime,
  onlyFast,
  onlyMaster,
  onTogglePrime,
  onToggleFast,
  onToggleMaster,
}: FiltersProps) {
  const badges = [
    { label: "프라임", checked: onlyPrime, toggle: onTogglePrime },
    { label: "빠른 응답", checked: onlyFast, toggle: onToggleFast },
    { label: "마스터 전문가", checked: onlyMaster, toggle: onToggleMaster },
  ];

  return (
    <div className="flex flex-col">
      {/* 목록이 한 카테고리에만 있으면 고를 것이 없으므로 보여 주지 않는다. */}
      {categoryOptions.length > 1 && (
        <fieldset className="border-t border-[#E2E5E9] py-5">
          <legend className="float-left mb-3 w-full text-[15px] font-black">카테고리</legend>
          <ul className="clear-both flex flex-col gap-1">
            {[{ id: "all", name: "전체", count: null as number | null }, ...categoryOptions].map((option) => {
              const active = category === option.id;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onCategoryChange(option.id)}
                    className={cn(
                      "flex h-10 w-full items-center justify-between gap-2 rounded-[10px] px-3 text-left text-[15px]",
                      active ? "bg-ink font-bold text-white" : "text-[#3A3A37] hover:bg-paper"
                    )}
                  >
                    <span className="truncate">{option.name}</span>
                    {option.count !== null && (
                      <span className={cn("shrink-0 text-sm", active ? "text-white" : "text-[#56606B]")}>
                        {option.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      {/* 가격 차이가 한 칸(1만원)에 못 미치면 범위를 고를 수 없으므로 보여 주지 않는다. */}
      {priceCeil > priceFloor && (
        <fieldset className="border-t border-[#E2E5E9] py-5">
          <legend className="float-left mb-3 w-full text-[15px] font-black">가격</legend>
          <div className="clear-both flex flex-col gap-3">
            <input
              type="range"
              aria-label="가격 상한"
              aria-valuetext={`${formatPrice(priceCap ?? priceCeil)}원 이하`}
              min={priceFloor}
              max={priceCeil}
              step={PRICE_STEP}
              value={priceCap ?? priceCeil}
              onChange={(e) => {
                const next = Number(e.target.value);
                onPriceCapChange(next >= priceCeil ? null : next);
              }}
              className="h-6 w-full cursor-pointer accent-ink"
            />
            <p className="text-[15px] font-bold">
              {priceCap === null ? "전체 가격" : `${formatPrice(priceCap)}원 이하`}
            </p>
          </div>
        </fieldset>
      )}

      <fieldset className="border-t border-[#E2E5E9] py-5">
        <legend className="float-left mb-3 w-full text-[15px] font-black">조건</legend>
        <div className="clear-both flex flex-col">
          {badges.map((badge) => (
            <label key={badge.label} className="flex h-10 cursor-pointer items-center gap-3 text-[15px] text-[#3A3A37]">
              <input
                type="checkbox"
                checked={badge.checked}
                onChange={badge.toggle}
                className="h-5 w-5 cursor-pointer accent-ink"
              />
              {badge.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/* ───────────────────────────────── 필터·정렬·목록 ───────────────────────────────── */

// 서비스 목록을 필터·정렬해서 카드로 보여 준다. 검색 화면과 카테고리 화면이 함께 쓴다.
export function ServiceBrowser({
  services,
  expertMap,
  sortOptions,
  loading = false,
  expertsReady = true,
  categories,
  scopeKey = "",
  empty,
}: ServiceBrowserProps) {
  const [sortBy, setSortBy] = useState<SortOption>(sortOptions[0]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceCap, setSelectedPriceCap] = useState<number | null>(null);
  const [onlyPrime, setOnlyPrime] = useState(false);
  const [onlyFast, setOnlyFast] = useState(false);
  const [onlyMaster, setOnlyMaster] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // 목록의 범위(검색어 등)가 바뀌면 그 목록에서 고른 카테고리와 가격 상한은 버린다.
  // 남겨 두면 나중에 조용히 다시 적용되거나, 고른 적 없는 값이 적용된 것처럼 보인다.
  // (프라임·빠른 응답·마스터와 정렬은 범위와 상관없는 조건이라 그대로 둔다.)
  const [seenScope, setSeenScope] = useState(scopeKey);
  if (scopeKey !== seenScope) {
    setSeenScope(scopeKey);
    setSelectedCategory("all");
    setSelectedPriceCap(null);
  }

  // 필터의 선택지는 지금 목록에서 만든다 (목록에 없는 카테고리나 닿지 않는 가격대를 보여 주지 않기 위해서다).
  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    const counts = new Map<string, number>();
    for (const s of services) counts.set(s.categoryId, (counts.get(s.categoryId) ?? 0) + 1);
    return categories
      .filter((c) => counts.has(c.id))
      .map((c) => ({ id: c.id, name: c.name, count: counts.get(c.id) ?? 0 }));
  }, [services, categories]);

  const [priceFloor, priceCeil] = useMemo(() => {
    if (services.length === 0) return [0, 0];
    const prices = services.map((s) => s.price);
    const roundUp = (n: number) => Math.ceil(n / PRICE_STEP) * PRICE_STEP;
    return [roundUp(Math.min(...prices)), roundUp(Math.max(...prices))];
  }, [services]);

  // 지금 목록의 선택지에 없는 값은 적용하지 않는다.
  const category =
    categoryOptions.length > 1 && categoryOptions.some((c) => c.id === selectedCategory) ? selectedCategory : "all";
  const priceCap =
    selectedPriceCap !== null && selectedPriceCap >= priceFloor && selectedPriceCap < priceCeil ? selectedPriceCap : null;

  // "마스터 전문가" 필터는 전문가 정보가 있어야 가릴 수 있다. 정보가 오기 전에 걸러 버리면
  // 잠깐 "조건에 맞는 서비스가 없습니다"가 보이므로, 다 받을 때까지는 불러오는 중으로 둔다.
  const waitingForExperts = onlyMaster && !expertsReady;

  const results = useMemo(() => {
    const filtered = services.filter(
      (s) =>
        (category === "all" || s.categoryId === category) &&
        (priceCap === null || s.price <= priceCap) &&
        (!onlyPrime || s.isPrime) &&
        (!onlyFast || s.isFastResponse) &&
        (!onlyMaster || expertMap[s.expertId]?.isMaster === true)
    );

    // 값이 같은 것끼리는 넘겨받은 순서를 유지한다 (정렬이 순서를 보존한다).
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.salesCount - a.salesCount);
        break;
      case "latest":
        filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
    }
    return filtered;
  }, [services, sortBy, category, priceCap, onlyPrime, onlyFast, onlyMaster, expertMap]);

  const activeFilters = [
    category !== "all" && {
      key: "category",
      label: categoryOptions.find((c) => c.id === category)?.name ?? "카테고리",
      clear: () => setSelectedCategory("all"),
    },
    priceCap !== null && {
      key: "price",
      label: `${formatPrice(priceCap)}원 이하`,
      clear: () => setSelectedPriceCap(null),
    },
    onlyPrime && { key: "prime", label: "프라임", clear: () => setOnlyPrime(false) },
    onlyFast && { key: "fast", label: "빠른 응답", clear: () => setOnlyFast(false) },
    onlyMaster && { key: "master", label: "마스터 전문가", clear: () => setOnlyMaster(false) },
  ].filter((f): f is { key: string; label: string; clear: () => void } => Boolean(f));

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedPriceCap(null);
    setOnlyPrime(false);
    setOnlyFast(false);
    setOnlyMaster(false);
  };

  // 목록 자체가 비었으면 거를 것도 줄 세울 것도 없으므로 안내만 보여 준다.
  if (!loading && services.length === 0) return <>{empty}</>;

  const filterProps: FiltersProps = {
    categoryOptions,
    category,
    onCategoryChange: setSelectedCategory,
    priceFloor,
    priceCeil,
    priceCap,
    onPriceCapChange: setSelectedPriceCap,
    onlyPrime,
    onlyFast,
    onlyMaster,
    onTogglePrime: () => setOnlyPrime((v) => !v),
    onToggleFast: () => setOnlyFast((v) => !v),
    onToggleMaster: () => setOnlyMaster((v) => !v),
  };

  const gridClass = "grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="flex gap-10">
      {/* ===== 필터 (넓은 화면) ===== */}
      <aside aria-label="필터" className="hidden w-60 shrink-0 lg:block">
        <div className="flex h-10 items-center justify-between">
          <h2 className="text-[17px] font-black">필터</h2>
          {activeFilters.length > 0 && (
            <button type="button" onClick={resetFilters} className="h-10 px-1 text-sm font-bold underline">
              초기화
            </button>
          )}
        </div>
        <div className="mt-3">
          <Filters {...filterProps} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* ===== 정렬 · 필터 버튼 ===== */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div role="group" aria-label="정렬" className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 scrollbar-hide">
            {sortOptions.map((option) => {
              const active = sortBy === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSortBy(option)}
                  className={cn(
                    "h-10 shrink-0 rounded-[10px] px-3.5 text-[15px]",
                    active ? "bg-ink font-bold text-white" : "font-medium text-[#3A3A37] hover:bg-paper"
                  )}
                >
                  {SORT_LABELS[option]}
                </button>
              );
            })}
          </div>

          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-10 shrink-0 items-center gap-2 rounded-[10px] border border-ink px-3.5 text-[15px] font-bold lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                필터
                {activeFilters.length > 0 && (
                  <span>
                    {activeFilters.length}
                    <span className="sr-only">개 적용됨</span>
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-80 flex-col p-0">
              <SheetHeader className="border-b border-[#E2E5E9] px-6 pb-4 pt-6">
                <SheetTitle className="text-[17px] font-black text-ink">필터</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6">
                <div className="-mt-px">
                  <Filters {...filterProps} />
                </div>
              </div>
              <div className="flex gap-2 border-t border-[#E2E5E9] p-4">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-12 rounded-[10px] border border-ink px-4 text-[15px] font-bold"
                >
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="h-12 flex-1 rounded-[10px] bg-ink px-4 text-[15px] font-bold text-white"
                >
                  서비스 {results.length}개 보기
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ===== 적용한 필터 ===== */}
        {activeFilters.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[15px] font-bold">{results.length}개</span>
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex h-9 items-center rounded-full border border-ink pl-3.5 text-sm font-bold"
              >
                {filter.label}
                <button
                  type="button"
                  aria-label={`${filter.label} 필터 지우기`}
                  onClick={filter.clear}
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* ===== 목록 ===== */}
        {loading || waitingForExperts ? (
          <div aria-hidden="true" className={gridClass}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex animate-pulse flex-col gap-3.5">
                <div className="aspect-video rounded-[20px] bg-paper" />
                <div className="h-4 w-1/3 rounded bg-paper" />
                <div className="h-5 w-4/5 rounded bg-paper" />
                <div className="h-8 w-28 rounded-full bg-paper" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className={gridClass}>
            {results.map((service) => (
              <ServiceCard key={service.id} service={service} expert={expertMap[service.expertId]} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-[28px] bg-paper p-9">
            <h2 className="text-2xl font-black tracking-[-0.03em]">조건에 맞는 서비스가 없습니다</h2>
            <p className="max-w-[520px] text-base text-[#3A3A37]">필터를 풀면 더 많은 서비스를 볼 수 있습니다.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 h-12 rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────── 빈 목록 안내 ───────────────────────────────── */

// 목록이 비었을 때의 안내 상자. 버튼은 부르는 쪽이 넣는다.
export function EmptyNotice({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[28px] bg-paper p-9">
      <h2 className="text-2xl font-black tracking-[-0.03em]">{title}</h2>
      <p className="max-w-[520px] text-base text-[#3A3A37]">{body}</p>
      {children && <div className="mt-2 flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
