"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Zap,
  Award,
  X,
  Search,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ServiceCard } from "@/components/ServiceCard";
import { getExpertByIdClient } from "@/lib/db-client";
import type { Category, Service, Expert } from "@/types";

type SortOption = "popular" | "latest" | "price-low" | "price-high" | "rating";

const SORT_TABS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "인기순" },
  { value: "latest", label: "최신순" },
  { value: "rating", label: "평점순" },
  { value: "price-low", label: "낮은가격" },
  { value: "price-high", label: "높은가격" },
];

const MAX_PRICE = 500000;

interface Props {
  slug: string;
  category: Category | null;
  initialServices: Service[];
  allCategories: Category[];
}

/* ─────────────────────────────── Sidebar Filters ─────────────────────────── */
interface FiltersProps {
  allCategories: Category[];
  currentCategoryId: string;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  showPrimeOnly: boolean;
  showFastResponse: boolean;
  showMasterOnly: boolean;
  onTogglePrime: () => void;
  onToggleFast: () => void;
  onToggleMaster: () => void;
  onReset: () => void;
}

function FilterSidebar({
  allCategories, currentCategoryId,
  priceRange, onPriceChange,
  showPrimeOnly, showFastResponse, showMasterOnly,
  onTogglePrime, onToggleFast, onToggleMaster,
  onReset,
}: FiltersProps) {
  const [catOpen, setCatOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [badgeOpen, setBadgeOpen] = useState(true);

  const formatPrice = (p: number) =>
    p >= 1000000
      ? `${(p / 10000).toFixed(0)}만원`
      : `${(p / 10000).toFixed(1)}만원`.replace(".0", "");

  return (
    <aside className="w-60 shrink-0 space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-800">필터</span>
        <button
          onClick={onReset}
          className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
        >
          초기화
        </button>
      </div>

      {/* Category */}
      <div className="border-b border-slate-100 pb-4 pt-3">
        <button
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-800 mb-3"
          onClick={() => setCatOpen((p) => !p)}
        >
          카테고리
          {catOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {catOpen && (
          <ul className="space-y-1">
            {allCategories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/category/${cat.slug}`}
                  className={`block text-sm px-2 py-1.5 rounded-lg transition-colors ${
                    cat.id === currentCategoryId
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price Range */}
      <div className="border-b border-slate-100 pb-4 pt-3">
        <button
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-800 mb-4"
          onClick={() => setPriceOpen((p) => !p)}
        >
          가격 범위
          {priceOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {priceOpen && (
          <div className="px-1 space-y-3">
            <Slider
              min={0}
              max={MAX_PRICE}
              step={10000}
              value={[priceRange[1]]}
              onValueChange={(v) => onPriceChange([priceRange[0], v[0]])}
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-number">₩0</span>
              <span className="font-number font-semibold text-orange-500">
                {formatPrice(priceRange[1])} 이하
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="pt-3">
        <button
          className="flex w-full items-center justify-between text-sm font-semibold text-slate-800 mb-3"
          onClick={() => setBadgeOpen((p) => !p)}
        >
          전문가 뱃지
          {badgeOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {badgeOpen && (
          <div className="space-y-2.5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox checked={showPrimeOnly} onCheckedChange={onTogglePrime} />
              <span className="flex items-center gap-1.5 text-sm text-slate-700 group-hover:text-slate-900">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
                프라임 전문가
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox checked={showFastResponse} onCheckedChange={onToggleFast} />
              <span className="flex items-center gap-1.5 text-sm text-slate-700 group-hover:text-slate-900">
                <Zap className="h-3.5 w-3.5 text-green-500" />
                빠른 응답
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox checked={showMasterOnly} onCheckedChange={onToggleMaster} />
              <span className="flex items-center gap-1.5 text-sm text-slate-700 group-hover:text-slate-900">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                마스터 등급
              </span>
            </label>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─────────────────────────────── Main Page ──────────────────────────────── */
export default function CategoryPageClient({
  slug,
  category,
  initialServices,
  allCategories,
}: Props) {
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [showPrimeOnly, setShowPrimeOnly] = useState(false);
  const [showFastResponse, setShowFastResponse] = useState(false);
  const [showMasterOnly, setShowMasterOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expertMap, setExpertMap] = useState<Record<string, Expert>>({});

  // Load experts for all services
  useEffect(() => {
    const expertIds = [...new Set(initialServices.map((s) => s.expertId))];
    Promise.all(
      expertIds.map((id) => getExpertByIdClient(id).then((e) => ({ id, expert: e })))
    ).then((results) => {
      const map: Record<string, Expert> = {};
      for (const { id, expert } of results) {
        if (expert) map[id] = expert;
      }
      setExpertMap(map);
    });
  }, [initialServices]);

  const filteredAndSortedServices = useMemo(() => {
    let result = [...initialServices];

    if (showPrimeOnly) {
      result = result.filter((s) => s.isPrime);
    }
    if (showFastResponse) {
      result = result.filter((s) => s.isFastResponse);
    }
    if (showMasterOnly) {
      result = result.filter((s) => {
        const expert = expertMap[s.expertId];
        return expert?.isMaster;
      });
    }
    if (priceRange[1] < MAX_PRICE) {
      result = result.filter((s) => s.price <= priceRange[1]);
    }

    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.salesCount - a.salesCount);
        break;
      case "latest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [initialServices, sortBy, priceRange, showPrimeOnly, showFastResponse, showMasterOnly, expertMap]);

  const activeFiltersCount =
    [showPrimeOnly, showFastResponse, showMasterOnly].filter(Boolean).length +
    (priceRange[1] < MAX_PRICE ? 1 : 0);

  const clearFilters = () => {
    setPriceRange([0, MAX_PRICE]);
    setShowPrimeOnly(false);
    setShowFastResponse(false);
    setShowMasterOnly(false);
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-24 w-24 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-slate-200" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">카테고리를 찾을 수 없습니다</h1>
          <p className="text-slate-500 mb-6">요청하신 카테고리가 존재하지 않거나 삭제되었습니다.</p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link href="/">홈으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  const filterProps: FiltersProps = {
    allCategories,
    currentCategoryId: category.id,
    priceRange,
    onPriceChange: setPriceRange,
    showPrimeOnly,
    showFastResponse,
    showMasterOnly,
    onTogglePrime: () => setShowPrimeOnly((p) => !p),
    onToggleFast: () => setShowFastResponse((p) => !p),
    onToggleMaster: () => setShowMasterOnly((p) => !p),
    onReset: clearFilters,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header: Breadcrumb + Category Info ── */}
      <section className="bg-white border-b border-slate-100 py-6">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
            <Link href="/" className="hover:text-orange-500 transition-colors">홈</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <Link href="/categories" className="hover:text-orange-500 transition-colors">카테고리</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-medium text-slate-800">{category.name}</span>
          </nav>

          {/* Category Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{category.name}</h1>
          {category.description && (
            <p className="text-slate-500 text-sm">{category.description}</p>
          )}

          {/* Subcategory Chips */}
          <div className="mt-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {allCategories.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <span
                    className={`shrink-0 inline-block text-sm px-3 py-1 rounded-full border transition-all ${
                      cat.id === category.id
                        ? "bg-orange-500 border-orange-500 text-white font-medium"
                        : "border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600 bg-white"
                    }`}
                  >
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Body: Sidebar + Content ── */}
      <div className="container mx-auto px-4 max-w-6xl py-8">
        <div className="flex gap-8">
          {/* ── Desktop Sidebar ── */}
          <div className="hidden lg:block">
            <FilterSidebar {...filterProps} />
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Sort Bar + Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-5 gap-4">
              {/* Sort Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {SORT_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSortBy(tab.value)}
                    className={`shrink-0 text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${
                      sortBy === tab.value
                        ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden flex items-center gap-2 text-sm font-medium text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-orange-300 hover:text-orange-600 transition-all shrink-0">
                    <SlidersHorizontal className="h-4 w-4" />
                    필터
                    {activeFiltersCount > 0 && (
                      <span className="h-5 w-5 text-xs bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <SheetTitle className="text-base font-bold text-slate-900">필터</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto h-full p-6">
                    <FilterSidebar {...filterProps} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Result Count + Active Filters */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-sm text-slate-500">
                총 <strong className="text-slate-800 font-number">{filteredAndSortedServices.length}</strong>개 서비스
              </span>
              {showPrimeOnly && (
                <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-100">
                  프라임
                  <button onClick={() => setShowPrimeOnly(false)} className="hover:text-orange-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {showFastResponse && (
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-100">
                  빠른응답
                  <button onClick={() => setShowFastResponse(false)} className="hover:text-green-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {showMasterOnly && (
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-100">
                  마스터
                  <button onClick={() => setShowMasterOnly(false)} className="hover:text-amber-900"><X className="h-3 w-3" /></button>
                </span>
              )}
              {priceRange[1] < MAX_PRICE && (
                <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200">
                  {new Intl.NumberFormat("ko-KR").format(priceRange[1])}원 이하
                  <button onClick={() => setPriceRange([0, MAX_PRICE])} className="hover:text-slate-900"><X className="h-3 w-3" /></button>
                </span>
              )}
            </div>

            {/* Service Grid */}
            {filteredAndSortedServices.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAndSortedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    expert={expertMap[service.expertId]}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-6">
                  <div className="h-24 w-24 rounded-3xl bg-slate-50 flex items-center justify-center">
                    <LayoutGrid className="h-10 w-10 text-slate-200" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center">
                    <Search className="h-4 w-4 text-orange-300" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">조건에 맞는 서비스가 없습니다</h3>
                <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-8">
                  필터 조건을 변경하거나 초기화하면 더 많은 서비스를 볼 수 있어요.
                </p>
                <div className="flex items-center gap-3">
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      className="border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600"
                      onClick={clearFilters}
                    >
                      필터 초기화
                    </Button>
                  )}
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200" asChild>
                    <Link href="/categories">전체 카테고리</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
