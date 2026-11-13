"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ServiceCard } from "@/components/ServiceCard";
import {
  getCategoriesClient,
  getExpertsByIdsClient,
  getServicesClient,
  searchServicesClient,
} from "@/lib/db-client";
import { VIDEO_TYPES, matchesKeyword } from "@/lib/video-types";
import { cn } from "@/lib/utils";
import type { Category, Expert, Service } from "@/types";

type SortOption = "relevance" | "popular" | "rating" | "price-low" | "price-high";

const SORT_TABS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "관련도순" },
  { value: "popular", label: "인기순" },
  { value: "rating", label: "평점순" },
  { value: "price-low", label: "낮은 가격" },
  { value: "price-high", label: "높은 가격" },
];

// 가격 필터를 움직이는 단위
const PRICE_STEP = 10000;

const formatPrice = (price: number) => new Intl.NumberFormat("ko-KR").format(price);

/* ───────────────────────────── 최근 검색어 (이 기기에만 저장) ───────────────────────────── */

const RECENT_KEY = "recentSearches";

function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, 10) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    if (list.length > 0) localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    else localStorage.removeItem(RECENT_KEY);
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 최근 검색어 없이 동작한다.
  }
}

function rememberSearch(term: string) {
  writeRecent([term, ...readRecent().filter((s) => s !== term)].slice(0, 10));
}

/* ───────────────────────────────────── 검색창 ───────────────────────────────────── */

function SearchBox({ query, onSubmit }: { query: string; onSubmit: (term: string) => void }) {
  const [value, setValue] = useState(query);
  // 주소의 검색어가 바뀌면(종류 버튼, 뒤로 가기 등) 입력란도 그 값으로 맞춘다.
  // 검색창을 통째로 다시 만들지 않는 것은, 다시 만들면 입력란에 있던 초점이 사라지기 때문이다.
  const [seenQuery, setSeenQuery] = useState(query);
  if (query !== seenQuery) {
    setSeenQuery(query);
    setValue(query);
  }
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showRecent = open && value === "" && recent.length > 0;

  const openRecent = () => {
    setRecent(readRecent());
    setOpen(true);
  };

  // 목록이 비어 사라질 때는 초점을 입력란으로 돌려놓는다 (누른 버튼이 함께 사라지기 때문이다).
  const saveRecent = (next: string[]) => {
    setRecent(next);
    writeRecent(next);
    if (next.length === 0) inputRef.current?.focus();
  };

  return (
    <form
      role="search"
      className="relative max-w-[640px]"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        onSubmit(value.trim());
      }}
      // 검색창 묶음 밖으로 초점이 나가면 최근 검색어를 닫는다.
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-[1_1_180px]">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#56606B]"
            aria-hidden="true"
          />
          <label htmlFor="search-q" className="sr-only">
            서비스 검색
          </label>
          <input
            id="search-q"
            ref={inputRef}
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="어떤 영상이 필요하세요?"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={openRecent}
            className="h-14 w-full rounded-[10px] border border-[#7B838D] bg-white pl-12 pr-12 text-base placeholder:text-[#6B7480] focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          />
          {value && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => {
                setValue("");
                inputRef.current?.focus();
              }}
              className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#56606B] hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-14 rounded-[10px] bg-ink px-7 text-base font-black text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          찾아보기
        </button>
      </div>

      {showRecent && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-[10px] border border-ink bg-white"
          // 목록을 누를 때 검색창의 초점이 빠지지 않게 한다 (초점이 빠지면 누르기 전에 목록이 닫힌다).
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between border-b border-[#E2E5E9] py-1 pl-4 pr-2">
            <span className="text-[13px] font-bold text-[#56606B]">최근 검색어</span>
            <button
              type="button"
              onClick={() => saveRecent([])}
              className="h-9 rounded-[10px] px-2 text-[13px] font-medium text-[#56606B] hover:text-ink"
            >
              전체 삭제
            </button>
          </div>
          <ul>
            {recent.map((term) => (
              <li key={term} className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSubmit(term);
                  }}
                  className="flex h-11 min-w-0 flex-1 items-center gap-3 pl-4 text-left text-[15px] hover:bg-paper"
                >
                  <Search className="h-4 w-4 shrink-0 text-[#56606B]" aria-hidden="true" />
                  <span className="truncate">{term}</span>
                </button>
                <button
                  type="button"
                  aria-label={`최근 검색어 ${term} 삭제`}
                  onClick={() => saveRecent(recent.filter((s) => s !== term))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[#56606B] hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
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
      {/* 결과가 한 카테고리에만 있으면 고를 것이 없으므로 보여 주지 않는다. */}
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

/* ───────────────────────────────────── 화면 ───────────────────────────────────── */

export default function SearchPage() {
  return (
    // useSearchParams 를 쓰는 부분은 Suspense 안에 있어야 한다.
    <Suspense fallback={<div className="min-h-screen bg-white" aria-busy="true" />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  // 주소의 q 가 검색어의 기준이다. 뒤로 가기, 홈의 종류 버튼, 헤더 검색 모두 주소만 바꾸면 결과가 따라온다.
  const q = (useSearchParams().get("q") ?? "").trim();

  const [allServices, setAllServices] = useState<Service[] | null>(null);
  const [found, setFound] = useState<{ q: string; services: Service[] } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expertMap, setExpertMap] = useState<Record<string, Expert>>({});
  // 이미 요청한 전문가 (같은 사람을 두 번 요청하지 않기 위해)
  const requestedExperts = useRef(new Set<string>());
  // 요청의 응답이 끝난 전문가 (성공이든 실패든). "마스터 전문가" 필터가 응답을 기다릴지 정하는 데 쓴다.
  const [settledExperts, setSettledExperts] = useState<ReadonlySet<string>>(new Set());

  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceCap, setSelectedPriceCap] = useState<number | null>(null);
  const [onlyPrime, setOnlyPrime] = useState(false);
  const [onlyFast, setOnlyFast] = useState(false);
  const [onlyMaster, setOnlyMaster] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // 전체 서비스와 카테고리는 한 번만 읽는다. 전체 서비스는 검색어가 없을 때의 목록이자 영상 종류 개수의 바탕이다.
  useEffect(() => {
    let cancelled = false;
    getServicesClient().then((services) => {
      if (!cancelled) setAllServices(services);
    });
    getCategoriesClient().then((list) => {
      if (!cancelled) setCategories(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    searchServicesClient(q).then((services) => {
      if (!cancelled) setFound({ q, services });
    });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const loading = q ? found?.q !== q : allServices === null;
  const base = useMemo(
    () => (q ? (found?.q === q ? found.services : []) : (allServices ?? [])),
    [q, found, allServices]
  );

  // 카드에 보여 줄 전문가 정보. 아직 요청하지 않은 전문가만 한 번에 묶어서 읽는다.
  useEffect(() => {
    const missing = [...new Set(base.map((s) => s.expertId))].filter((id) => !requestedExperts.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => requestedExperts.current.add(id));
    getExpertsByIdsClient(missing)
      .then((experts) => {
        setExpertMap((prev) => {
          const next = { ...prev };
          for (const expert of experts) next[expert.id] = expert;
          return next;
        });
      })
      .catch(() => {
        // 읽지 못한 묶음은 다음에 결과가 바뀔 때 다시 요청한다. 그동안 카드는 전문가 이름 없이 보인다.
        missing.forEach((id) => requestedExperts.current.delete(id));
      })
      .finally(() => {
        setSettledExperts((prev) => new Set([...prev, ...missing]));
      });
  }, [base]);

  // 검색어가 바뀌면 그 결과에서 고른 카테고리와 가격 상한은 버린다.
  // 남겨 두면 나중에 조용히 다시 적용되거나, 고른 적 없는 값이 적용된 것처럼 보인다.
  // (프라임·빠른 응답·마스터와 정렬은 검색어와 상관없는 조건이라 그대로 둔다.)
  const [seenQuery, setSeenQuery] = useState(q);
  if (q !== seenQuery) {
    setSeenQuery(q);
    setSelectedCategory("all");
    setSelectedPriceCap(null);
  }

  // 영상 종류 버튼. 개수는 전체 서비스에서 세고, 하나도 없는 종류는 숨긴다.
  const typeChips = useMemo(
    () =>
      allServices === null
        ? null
        : VIDEO_TYPES.map((type) => ({
            type,
            count: allServices.filter((s) => matchesKeyword(s, type)).length,
          })).filter((chip) => chip.count > 0),
    [allServices]
  );

  // 필터의 선택지는 지금 결과에서 만든다 (결과에 없는 카테고리나 닿지 않는 가격대를 보여 주지 않기 위해서다).
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of base) counts.set(s.categoryId, (counts.get(s.categoryId) ?? 0) + 1);
    return categories
      .filter((c) => counts.has(c.id))
      .map((c) => ({ id: c.id, name: c.name, count: counts.get(c.id) ?? 0 }));
  }, [base, categories]);

  const [priceFloor, priceCeil] = useMemo(() => {
    if (base.length === 0) return [0, 0];
    const prices = base.map((s) => s.price);
    const roundUp = (n: number) => Math.ceil(n / PRICE_STEP) * PRICE_STEP;
    return [roundUp(Math.min(...prices)), roundUp(Math.max(...prices))];
  }, [base]);

  // 지금 결과의 선택지에 없는 값은 적용하지 않는다.
  const category = categoryOptions.length > 1 && categoryOptions.some((c) => c.id === selectedCategory) ? selectedCategory : "all";
  const priceCap =
    selectedPriceCap !== null && selectedPriceCap >= priceFloor && selectedPriceCap < priceCeil ? selectedPriceCap : null;

  // "마스터 전문가" 필터는 전문가 정보가 있어야 가릴 수 있다. 응답이 오기 전에 걸러 버리면
  // 잠깐 "조건에 맞는 서비스가 없습니다"가 보이므로, 응답이 끝날 때까지는 불러오는 중으로 둔다.
  const waitingForExperts = onlyMaster && base.some((s) => !settledExperts.has(s.expertId));

  const results = useMemo(() => {
    const filtered = base.filter(
      (s) =>
        (category === "all" || s.categoryId === category) &&
        (priceCap === null || s.price <= priceCap) &&
        (!onlyPrime || s.isPrime) &&
        (!onlyFast || s.isFastResponse) &&
        (!onlyMaster || expertMap[s.expertId]?.isMaster === true)
    );

    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.salesCount - a.salesCount);
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
  }, [base, sortBy, category, priceCap, onlyPrime, onlyFast, onlyMaster, expertMap]);

  // 검색어가 이름·소개·기술에 걸리는 전문가 (지금 결과에 서비스가 있는 전문가 가운데)
  const matchedExperts = useMemo(() => {
    if (!q) return [];
    const needle = q.toLowerCase();
    const seen = new Set<string>();
    const matched: Expert[] = [];
    for (const service of base) {
      const expert = expertMap[service.expertId];
      if (!expert || seen.has(expert.id)) continue;
      seen.add(expert.id);
      if (
        expert.name.toLowerCase().includes(needle) ||
        expert.title.toLowerCase().includes(needle) ||
        expert.skills.some((skill) => skill.toLowerCase().includes(needle))
      ) {
        matched.push(expert);
      }
    }
    return matched;
  }, [q, base, expertMap]);

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

  const goSearch = (term: string) => {
    if (term) rememberSearch(term);
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

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

  const chipBase = "inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px]";
  const chipOn = "bg-ink font-bold text-white hover:bg-black";
  const chipOff = "border border-[#D5D9DE] font-medium hover:border-ink";

  return (
    <div className="min-h-screen bg-white text-ink [word-break:keep-all]">
      {/* ===== 검색어와 검색창 ===== */}
      <section className="border-b border-[#E2E5E9]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pb-6 pt-12 md:px-8">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[clamp(40px,5.4vw,72px)] leading-[1.05] tracking-[-0.01em] [overflow-wrap:anywhere]">
              {q ? (
                <>
                  <span className="sr-only">검색 결과: </span>
                  {q}
                </>
              ) : (
                "전체 서비스"
              )}
            </h1>
            <p role="status" className="text-[17px] text-[#3A3A37]">
              {loading
                ? "찾는 중입니다."
                : q
                  ? `검색 결과 ${base.length}개${matchedExperts.length > 0 ? ` · 관련 전문가 ${matchedExperts.length}명` : ""}`
                  : `공개된 서비스 ${base.length}개`}
            </p>
          </div>

          <SearchBox query={q} onSubmit={goSearch} />

          <nav aria-label="영상 종류" className="flex min-h-11 flex-wrap gap-2">
            {typeChips && (
              <>
                <Link
                  href="/search"
                  aria-current={q === "" ? "page" : undefined}
                  className={cn(chipBase, q === "" ? chipOn : chipOff)}
                >
                  전체 <span className={q === "" ? "font-medium" : "text-[#56606B]"}>{allServices?.length ?? 0}</span>
                </Link>
                {typeChips.map(({ type, count }) => {
                  const active = q === type;
                  return (
                    <Link
                      key={type}
                      href={`/search?q=${encodeURIComponent(type)}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(chipBase, active ? chipOn : chipOff)}
                    >
                      {type} <span className={active ? "font-medium" : "text-[#56606B]"}>{count}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 pb-24 pt-8 md:px-8">
        {/* ===== 관련 전문가 ===== */}
        {matchedExperts.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-[15px] font-black">관련 전문가</h2>
            {/* 다섯 명까지 한 줄로만 보여 준다. 여러 줄이 되면 정작 검색 결과가 화면 아래로 밀린다. */}
            <ul className="-mx-4 flex items-center gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide md:-mx-8 md:px-8">
              {matchedExperts.slice(0, 5).map((expert) => (
                <li key={expert.id} className="shrink-0">
                  <Link
                    href={`/expert/${expert.id}`}
                    className="flex w-52 flex-col gap-0.5 rounded-[20px] border border-[#D5D9DE] px-5 py-3.5 hover:border-ink"
                  >
                    <span className="truncate text-[17px] font-black">{expert.name}</span>
                    <span className="truncate text-sm text-[#56606B]">{expert.title || "전문가"}</span>
                  </Link>
                </li>
              ))}
              {matchedExperts.length > 5 && (
                <li className="shrink-0 px-2 text-[15px] font-medium text-[#56606B]">외 {matchedExperts.length - 5}명</li>
              )}
            </ul>
          </section>
        )}

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
              <div role="group" aria-label="정렬" className="-mx-1 flex items-center gap-1 overflow-x-auto px-1">
                {SORT_TABS.map((tab) => {
                  const active = sortBy === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSortBy(tab.value)}
                      className={cn(
                        "h-10 shrink-0 rounded-[10px] px-3.5 text-[15px]",
                        active ? "bg-ink font-bold text-white" : "font-medium text-[#3A3A37] hover:bg-paper"
                      )}
                    >
                      {tab.label}
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

            {/* ===== 결과 ===== */}
            {loading || waitingForExperts ? (
              <div aria-hidden="true" className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
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
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((service) => (
                  <ServiceCard key={service.id} service={service} expert={expertMap[service.expertId]} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-[28px] bg-paper p-9">
                <h2 className="text-2xl font-black tracking-[-0.03em]">
                  {base.length > 0
                    ? "조건에 맞는 서비스가 없습니다"
                    : q
                      ? "검색 결과가 없습니다"
                      : "공개된 서비스가 아직 없습니다"}
                </h2>
                <p className="max-w-[520px] text-base text-[#3A3A37]">
                  {base.length > 0
                    ? "필터를 풀면 더 많은 서비스를 볼 수 있습니다."
                    : q
                      ? "다른 낱말로 찾아보세요. 원하는 영상이 목록에 없다면 견적을 요청할 수 있습니다."
                      : "필요한 영상을 적어 견적을 요청할 수 있습니다."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {base.length > 0 ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="h-12 rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black"
                    >
                      필터 초기화
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/request"
                        className="inline-flex h-12 items-center rounded-[10px] bg-ink px-[22px] text-[15px] font-bold text-white hover:bg-black"
                      >
                        견적 요청하기
                      </Link>
                      {q && (
                        <Link
                          href="/search"
                          className="inline-flex h-12 items-center rounded-[10px] border border-ink bg-white px-[22px] text-[15px] font-bold hover:bg-paper"
                        >
                          전체 서비스 보기
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
