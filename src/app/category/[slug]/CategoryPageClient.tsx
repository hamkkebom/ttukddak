"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  SlidersHorizontal,
  Zap,
  Award,
  ArrowUpDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">카테고리를 찾을 수 없습니다</h1>
        <Button asChild>
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-4">가격 범위</h3>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={0}
          max={500000}
          step={10000}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatPrice(priceRange[0])}원</span>
          <span>{formatPrice(priceRange[1])}원</span>
        </div>
      </div>

      {/* Filter Options */}
      <div>
        <h3 className="font-medium mb-4">필터 옵션</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={showPrimeOnly}
              onCheckedChange={(checked) => setShowPrimeOnly(checked as boolean)}
            />
            <div className="flex items-center gap-2">
              <Badge className="bg-primary">프라임</Badge>
              <span className="text-sm">프라임 전문가만</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={showMasterOnly}
              onCheckedChange={(checked) => setShowMasterOnly(checked as boolean)}
            />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Award className="h-3 w-3 text-amber-500" />
                마스터
              </Badge>
              <span className="text-sm">마스터 전문가만</span>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={showFastResponse}
              onCheckedChange={(checked) =>
                setShowFastResponse(checked as boolean)
              }
            />
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                빠른응답
              </Badge>
              <span className="text-sm">빠른 응답 전문가</span>
            </div>
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          필터 초기화
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              홈
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          <p className="text-muted-foreground">{category.description}</p>
        </div>
      </div>

      {/* Main Category Tabs */}
      <div className="border-b bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {allCategories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`}>
                <Badge
                  variant={cat.id === category.id ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                >
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Desktop Sidebar Filter */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-36">
              <h2 className="font-semibold mb-4">필터</h2>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {filteredAndSortedServices.length}
                  </span>
                  개의 서비스
                </p>

                {/* Active Filters */}
                {activeFiltersCount > 0 && (
                  <div className="hidden sm:flex items-center gap-2">
                    {showPrimeOnly && (
                      <Badge variant="secondary" className="gap-1">
                        프라임
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setShowPrimeOnly(false)}
                        />
                      </Badge>
                    )}
                    {showMasterOnly && (
                      <Badge variant="secondary" className="gap-1">
                        마스터
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setShowMasterOnly(false)}
                        />
                      </Badge>
                    )}
                    {showFastResponse && (
                      <Badge variant="secondary" className="gap-1">
                        빠른응답
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setShowFastResponse(false)}
                        />
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      필터
                      {activeFiltersCount > 0 && (
                        <Badge className="h-5 w-5 p-0 flex items-center justify-center">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>필터</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Select */}
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                >
                  <SelectTrigger className="w-36">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">인기순</SelectItem>
                    <SelectItem value="latest">최신순</SelectItem>
                    <SelectItem value="rating">평점순</SelectItem>
                    <SelectItem value="price-low">낮은 가격순</SelectItem>
                    <SelectItem value="price-high">높은 가격순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Service Grid */}
            {filteredAndSortedServices.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAndSortedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    expert={expertMap[service.expertId]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  조건에 맞는 서비스가 없습니다
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  필터 초기화
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
