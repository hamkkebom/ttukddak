"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  SlidersHorizontal,
  Zap,
  Award,
  X,
  Search,
  TrendingUp,
  Sparkles,
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

interface Props {
  slug: string;
  category: Category | null;
  initialServices: Service[];
  allCategories: Category[];
}

const SORT_TABS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "인기순" },
  { value: "latest", label: "최신순" },
  { value: "rating", label: "평점순" },
  { value: "price-low", label: "가격↑" },
  { value: "price-high", label: "가격↓" },
];

export default function CategoryPageClient({
  slug,
  category,
  initialServices,
  allCategories,
}: Props) {
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
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
    result = result.filter(
      (s) => s.price >= priceRange[0] && s.price <= priceRange[1]
    );

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const activeFiltersCount =
    [showPrimeOnly, showFastResponse, showMasterOnly].filter(Boolean).length +
    (priceRange[0] > 0 || priceRange[1] < 500000 ? 1 : 0);

  const clearFilters = () => {
    setPriceRange([0, 500000]);
    setShowPrimeOnly(false);
    setShowFastResponse(false);
    setShowMasterOnly(false);
  };

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Search className="h-9 w-9 text-slate-400" />
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

  const FilterPanel = () => (
    <div className="space-y-7">
      {/* Active filter count indicator */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between py-2.5 px-3.5 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="text-sm font-medium text-orange-700">
            필터 {activeFiltersCount}개 적용 중
          </span>
          <button
            onClick={clearFilters}
            className="text-xs text-orange-600 hover:text-orange-800 font-medium underline underline-offset-2 transition-colors"
          >
            초기화
          </button>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">
          가격 범위
        </h3>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={0}
          max={500000}
          step={10000}
          className="mb-4"
        />
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-slate-400 mb-0.5">최소</p>
            <p className="text-sm font-semibold text-slate-800 font-number">
              {formatPrice(priceRange[0])}원
            </p>
          </div>
          <span className="text-slate-300 font-light">—</span>
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-slate-400 mb-0.5">최대</p>
            <p className="text-sm font-semibold text-slate-800 font-number">
              {formatPrice(priceRange[1])}원
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Filter Options */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wide">
          전문가 유형
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              checked={showPrimeOnly}
              onCheckedChange={(checked) => setShowPrimeOnly(checked as boolean)}
              className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <div className="flex items-center gap-2.5 flex-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white">
                <Zap className="h-3 w-3" />
                프라임
              </span>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                프라임 전문가만
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              checked={showMasterOnly}
              onCheckedChange={(checked) => setShowMasterOnly(checked as boolean)}
              className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <div className="flex items-center gap-2.5 flex-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                <Award className="h-3 w-3" />
                마스터
              </span>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                마스터 전문가만
              </span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <Checkbox
              checked={showFastResponse}
              onCheckedChange={(checked) =>
                setShowFastResponse(checked as boolean)
              }
              className="border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <div className="flex items-center gap-2.5 flex-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">
                <Zap className="h-3 w-3" />
                빠른응답
              </span>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                빠른 응답 전문가
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              홈
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            <Link href="/categories" className="hover:text-orange-500 transition-colors">
              카테고리
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            <span className="font-medium text-slate-800">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Hero Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-slate-700/40 blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              {/* Category icon / emoji treatment */}
              {category.icon && (
                <div className="text-4xl mb-4 select-none">{category.icon}</div>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>

            {/* Stats badge */}
            <div className="flex-shrink-0">
              <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3">
                <TrendingUp className="h-5 w-5 text-orange-400 flex-shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-white font-number leading-none">
                    {initialServices.length.toLocaleString("ko-KR")}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">등록된 서비스</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategory Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1.5 overflow-x-auto py-3 scrollbar-hide">
            {allCategories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} className="flex-shrink-0">
                <span
                  className={
                    cat.id === category.id
                      ? "inline-block px-4 py-2 rounded-full text-sm font-semibold bg-orange-500 text-white shadow-sm shadow-orange-200 transition-all"
                      : "inline-block px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                  }
                >
                  {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar Filter */}
          <aside className="hidden lg:block w-60 xl:w-64 flex-shrink-0">
            <div className="sticky top-36 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                  필터
                </h2>
                {activeFiltersCount > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center font-number">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Sort + Results Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              {/* Result count + active filter chips */}
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-slate-500">
                  총{" "}
                  <span className="font-bold text-slate-900 font-number text-base">
                    {filteredAndSortedServices.length.toLocaleString("ko-KR")}
                  </span>
                  개의 서비스
                </p>

                {/* Active filter chips */}
                {showPrimeOnly && (
                  <button
                    onClick={() => setShowPrimeOnly(false)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                  >
                    프라임
                    <X className="h-3 w-3" />
                  </button>
                )}
                {showMasterOnly && (
                  <button
                    onClick={() => setShowMasterOnly(false)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                  >
                    마스터
                    <X className="h-3 w-3" />
                  </button>
                )}
                {showFastResponse && (
                  <button
                    onClick={() => setShowFastResponse(false)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    빠른응답
                    <X className="h-3 w-3" />
                  </button>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 500000) && (
                  <button
                    onClick={() => setPriceRange([0, 500000])}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    {formatPrice(priceRange[0])}~{formatPrice(priceRange[1])}원
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Sort tabs + Mobile filter button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mobile Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden gap-2 border-slate-300 hover:border-orange-400 hover:text-orange-600 transition-colors"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      필터
                      {activeFiltersCount > 0 && (
                        <span className="h-5 w-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center font-number">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2 text-slate-900">
                        <SlidersHorizontal className="h-4 w-4 text-orange-500" />
                        필터
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-8 px-1">
                      <FilterPanel />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Tabs */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                  {SORT_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setSortBy(tab.value)}
                      className={
                        sortBy === tab.value
                          ? "px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-500 text-white shadow-sm transition-all"
                          : "px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 rounded-lg transition-all"
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
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
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                  <Sparkles className="h-9 w-9 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  조건에 맞는 서비스가 없습니다
                </h3>
                <p className="text-slate-500 text-sm text-center max-w-xs mb-6 leading-relaxed">
                  필터 조건을 변경하거나 초기화하면 더 많은 서비스를 볼 수 있어요.
                </p>
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={clearFilters}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  >
                    <X className="h-4 w-4" />
                    필터 초기화
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
