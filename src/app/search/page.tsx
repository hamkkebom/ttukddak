"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, Sparkles, X, SlidersHorizontal, Star, Zap, Award,
  ChevronDown, ChevronUp, LayoutGrid, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCard } from "@/components/ServiceCard";
import {
  searchServicesClient,
  getServicesClient,
  getCategoriesClient,
  getExpertByIdClient,
} from "@/lib/db-client";
import type { Service, Expert, Category } from "@/types";

const popularKeywords = [
  "AI 영상", "모션그래픽", "유튜브 편집", "3D", "숏폼",
  "제품 광고", "로고 애니메이션", "뮤직비디오", "Sora", "Runway",
];

type SortOption = "relevance" | "popular" | "rating" | "price-low" | "price-high";

const SORT_TABS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "관련도순" },
  { value: "popular", label: "인기순" },
  { value: "rating", label: "평점순" },
  { value: "price-low", label: "낮은가격" },
  { value: "price-high", label: "높은가격" },
];

const MAX_PRICE = 5000000;

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center animate-pulse">
              <Search className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-slate-400 text-sm font-medium">검색 중...</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

/* ─────────────────────────────── Sidebar Filters ─────────────────────────── */
interface FiltersProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  onlyPrime: boolean;
  onlyFast: boolean;
  onlyMaster: boolean;
  onTogglePrime: () => void;
  onToggleFast: () => void;
  onToggleMaster: () => void;
  onReset: () => void;
}

function FilterSidebar({
  categories, selectedCategory, onCategoryChange,
  priceRange, onPriceChange,
  onlyPrime, onlyFast, onlyMaster,
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
            <li>
              <button
                onClick={() => onCategoryChange("all")}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                  selectedCategory === "all"
                    ? "bg-orange-50 text-orange-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                전체
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => onCategoryChange(cat.id)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-xs text-slate-400 ml-1 shrink-0">{cat.serviceCount}</span>
                </button>
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
              <Checkbox checked={onlyPrime} onCheckedChange={onTogglePrime} />
              <span className="flex items-center gap-1.5 text-sm text-slate-700 group-hover:text-slate-900">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
                프라임 전문가
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox checked={onlyFast} onCheckedChange={onToggleFast} />
              <span className="flex items-center gap-1.5 text-sm text-slate-700 group-hover:text-slate-900">
                <Zap className="h-3.5 w-3.5 text-green-500" />
                빠른 응답
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <Checkbox checked={onlyMaster} onCheckedChange={onToggleMaster} />
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
function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const isAI = searchParams.get("ai") === "true";

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expertMap, setExpertMap] = useState<Record<string, Expert>>({});
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  // Extra filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [onlyPrime, setOnlyPrime] = useState(false);
  const [onlyFast, setOnlyFast] = useState(false);
  const [onlyMaster, setOnlyMaster] = useState(false);

  // Load recent searches from localStorage once
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentSearches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((s) => s !== term)].slice(0, 10);
      try {
        localStorage.setItem("recentSearches", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("recentSearches");
    } catch {
      // ignore
    }
  };

  // Load categories once
  useEffect(() => {
    getCategoriesClient().then(setCategories);
  }, []);

  // Load services / search results when submittedQuery changes
  useEffect(() => {
    setLoading(true);
    const fetchServices = submittedQuery
      ? searchServicesClient(submittedQuery)
      : getServicesClient();

    fetchServices.then((svcs) => {
      if (submittedQuery) {
        setSearchResults(svcs);
      } else {
        setAllServices(svcs);
      }
      setLoading(false);
    });
  }, [submittedQuery]);

  // Load experts for visible services
  const activeServices = submittedQuery ? searchResults : allServices;
  useEffect(() => {
    const ids = [...new Set(activeServices.map((s) => s.expertId))];
    Promise.all(ids.map((id) => getExpertByIdClient(id).then((e) => ({ id, expert: e })))).then(
      (results) => {
        const map: Record<string, Expert> = {};
        for (const { id, expert } of results) {
          if (expert) map[id] = expert;
        }
        setExpertMap((prev) => ({ ...prev, ...map }));
      }
    );
  }, [activeServices]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowRecent(false);
    if (query.trim()) saveRecentSearch(query.trim());
    setSubmittedQuery(query);
  };

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
    setShowRecent(false);
    saveRecentSearch(keyword);
    setSubmittedQuery(keyword);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    setShowRecent(false);
    setSubmittedQuery(term);
  };

  const handleFilterReset = () => {
    setSelectedCategory("all");
    setPriceRange([0, MAX_PRICE]);
    setOnlyPrime(false);
    setOnlyFast(false);
    setOnlyMaster(false);
  };

  const results = useMemo(() => {
    let filtered = [...activeServices];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.categoryId === selectedCategory);
    }

    if (priceRange[1] < MAX_PRICE) {
      filtered = filtered.filter((s) => s.price <= priceRange[1]);
    }

    if (onlyPrime) {
      filtered = filtered.filter((s) => s.isPrime);
    }
    if (onlyFast) {
      filtered = filtered.filter((s) => s.isFastResponse);
    }
    if (onlyMaster) {
      filtered = filtered.filter((s) => {
        const expert = expertMap[s.expertId];
        return expert?.isMaster;
      });
    }

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
  }, [activeServices, sortBy, selectedCategory, priceRange, onlyPrime, onlyFast, onlyMaster, expertMap]);

  const matchedExperts = useMemo(() => {
    if (!submittedQuery) return [];
    const lower = submittedQuery.toLowerCase();
    return Object.values(expertMap).filter(
      (e) =>
        e.name.toLowerCase().includes(lower) ||
        e.title.toLowerCase().includes(lower) ||
        e.skills.some((s) => s.toLowerCase().includes(lower))
    );
  }, [submittedQuery, expertMap]);

  const activeFilterCount = [
    selectedCategory !== "all",
    priceRange[1] < MAX_PRICE,
    onlyPrime,
    onlyFast,
    onlyMaster,
  ].filter(Boolean).length;

  const filterProps: FiltersProps = {
    categories,
    selectedCategory,
    onCategoryChange: setSelectedCategory,
    priceRange,
    onPriceChange: setPriceRange,
    onlyPrime,
    onlyFast,
    onlyMaster,
    onTogglePrime: () => setOnlyPrime((p) => !p),
    onToggleFast: () => setOnlyFast((p) => !p),
    onToggleMaster: () => setOnlyMaster((p) => !p),
    onReset: handleFilterReset,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Search Header ── */}
      <section className="bg-white border-b border-slate-100 py-6">
        <div className="container mx-auto px-4 max-w-6xl">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <div className="flex items-stretch h-13 rounded-xl border-2 border-slate-200 bg-white overflow-hidden focus-within:border-orange-400 transition-colors shadow-sm">
              <div className="flex items-center pl-4">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
              </div>
              <Input
                type="text"
                placeholder="어떤 영상 서비스를 찾고 계세요?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowRecent(true)}
                onBlur={() => setTimeout(() => setShowRecent(false), 150)}
                className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base px-3 h-full bg-transparent"
              />
              {query && (
                <button
                  type="button"
                  className="px-2 text-slate-300 hover:text-slate-500 transition-colors"
                  onClick={() => { setQuery(""); setSubmittedQuery(""); }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors shrink-0"
              >
                검색
              </button>
            </div>
            {/* Recent Searches Dropdown */}
            {showRecent && !query && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">최근 검색어</span>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    전체 삭제
                  </button>
                </div>
                <ul>
                  {recentSearches.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        onMouseDown={() => handleRecentClick(term)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <Search className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                        <span className="flex-1 truncate">{term}</span>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const updated = recentSearches.filter((s) => s !== term);
                            setRecentSearches(updated);
                            try {
                              localStorage.setItem("recentSearches", JSON.stringify(updated));
                            } catch {
                              // ignore
                            }
                          }}
                          className="text-slate-300 hover:text-slate-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>

          {/* Category Chips */}
          <div className="max-w-2xl mx-auto mt-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs text-slate-400 shrink-0">인기</span>
              {popularKeywords.map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => handleKeywordClick(keyword)}
                  className={`shrink-0 text-sm px-3 py-1 rounded-full border transition-all ${
                    submittedQuery === keyword
                      ? "bg-orange-500 border-orange-500 text-white font-medium"
                      : "border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600 bg-white"
                  }`}
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Recommendation Banner ── */}
      {isAI && (
        <section className="bg-gradient-to-r from-orange-500 to-amber-400 text-white">
          <div className="container mx-auto px-4 max-w-6xl py-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">AI 맞춤 추천 결과</p>
                <p className="text-white/80 text-xs mt-0.5">
                  {submittedQuery
                    ? `"${submittedQuery}" 관련 서비스를 AI가 엄선했습니다`
                    : "회원님의 활동 패턴을 분석해 최적의 서비스를 추천합니다"}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">AI 추천</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Body: Sidebar + Content ── */}
      <div className="container mx-auto px-4 max-w-6xl py-8">
        {/* Results Title */}
        {submittedQuery && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              <span className="text-orange-500">&ldquo;{submittedQuery}&rdquo;</span> 검색 결과
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              서비스 <strong className="text-slate-800">{results.length}개</strong>
              {matchedExperts.length > 0 && (
                <>, 전문가 <strong className="text-slate-800">{matchedExperts.length}명</strong></>
              )}
            </p>
          </div>
        )}

        {/* Expert Horizontal Scroll */}
        {matchedExperts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="h-4 w-1 bg-orange-500 rounded-full inline-block" />
              관련 전문가
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {matchedExperts.map((expert) => (
                <Link key={expert.id} href={`/expert/${expert.id}`} className="shrink-0">
                  <div className="w-44 bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-lg hover:border-orange-200 transition-all group text-center">
                    <div className="relative mx-auto w-14 h-14 mb-3">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={expert.profileImage} alt={expert.name} />
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-400 text-white text-lg font-bold">
                          {expert.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {expert.isMaster && (
                        <span className="absolute -bottom-1 -right-1 h-5 w-5 bg-amber-400 rounded-full flex items-center justify-center shadow">
                          <Award className="h-3 w-3 text-white" />
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">{expert.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{expert.title}</p>
                    <div className="flex items-center justify-center gap-1 mt-2.5">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-800 font-number">{expert.rating.toFixed(1)}</span>
                      <span className="text-xs text-slate-400 font-number">({expert.reviewCount})</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden flex items-center gap-2 text-sm font-medium text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-orange-300 hover:text-orange-600 transition-all shrink-0">
                    <SlidersHorizontal className="h-4 w-4" />
                    필터
                    {activeFilterCount > 0 && (
                      <span className="h-5 w-5 text-xs bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                        {activeFilterCount}
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
            {(activeFilterCount > 0 || !loading) && (
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="text-sm text-slate-500">
                  총 <strong className="text-slate-800 font-number">{results.length}</strong>개 서비스
                </span>
                {selectedCategory !== "all" && (
                  <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-100">
                    {categories.find((c) => c.id === selectedCategory)?.name}
                    <button onClick={() => setSelectedCategory("all")} className="hover:text-orange-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {onlyPrime && (
                  <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-100">
                    프라임
                    <button onClick={() => setOnlyPrime(false)} className="hover:text-orange-900"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {onlyFast && (
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full border border-green-100">
                    빠른응답
                    <button onClick={() => setOnlyFast(false)} className="hover:text-green-900"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {onlyMaster && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-100">
                    마스터
                    <button onClick={() => setOnlyMaster(false)} className="hover:text-amber-900"><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Service Grid */}
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-100">
                    <Skeleton className="aspect-video w-full rounded-none" />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <Skeleton className="h-3 w-1/2 mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((service) => (
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
                <h3 className="text-lg font-bold text-slate-800 mb-2">검색 결과가 없습니다</h3>
                <p className="text-slate-500 text-sm max-w-xs leading-relaxed mb-8">
                  다른 키워드로 검색하거나 필터를 조정해 보세요. 원하는 전문가를 찾지 못했다면 의뢰를 올려보세요.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600"
                    onClick={() => {
                      setQuery("");
                      setSubmittedQuery("");
                      handleFilterReset();
                    }}
                  >
                    검색 초기화
                  </Button>
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
                    asChild
                  >
                    <Link href="/request">의뢰 올리기</Link>
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
