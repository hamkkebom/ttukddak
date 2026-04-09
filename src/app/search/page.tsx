"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, Sparkles, X, SlidersHorizontal, ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">로딩중...</p></div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const isAI = searchParams.get("ai") === "true";

  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expertMap, setExpertMap] = useState<Record<string, Expert>>({});
  const [loading, setLoading] = useState(true);

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
    setSubmittedQuery(query);
  };

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
    setSubmittedQuery(keyword);
  };

  const results = useMemo(() => {
    let filtered = [...activeServices];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.categoryId === selectedCategory);
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
  }, [activeServices, sortBy, selectedCategory]);

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

  return (
    <div className="min-h-screen">
      {/* Search Header */}
      <section className="border-b bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="어떤 영상 서비스를 찾고 계세요?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 pr-24 h-14 rounded-2xl text-lg border-2 focus:border-primary"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setQuery("");
                      setSubmittedQuery("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button type="submit" size="sm" className="rounded-xl h-10 px-4">
                  검색
                </Button>
              </div>
            </div>
          </form>

          {/* Popular Keywords */}
          {!submittedQuery && (
            <div className="max-w-2xl mx-auto mt-4">
              <p className="text-sm text-muted-foreground mb-2">인기 검색어</p>
              <div className="flex flex-wrap gap-2">
                {popularKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleKeywordClick(keyword)}
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* AI Recommendation Banner */}
      {isAI && (
        <div className="border-b bg-gradient-to-r from-primary/5 to-orange-500/5">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">AI 추천 결과</p>
                <p className="text-xs text-muted-foreground">
                  {submittedQuery
                    ? `"${submittedQuery}"에 대한 AI 추천 서비스입니다`
                    : "회원님에게 맞는 서비스를 추천해드립니다"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        {submittedQuery && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">
              &quot;{submittedQuery}&quot; 검색 결과
            </h1>
            <p className="text-muted-foreground">
              서비스 {results.length}개
              {matchedExperts.length > 0 && `, 전문가 ${matchedExperts.length}명`}
            </p>
          </div>
        )}

        {/* Expert Results */}
        {matchedExperts.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold mb-4">전문가</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {matchedExperts.map((expert) => (
                <Link key={expert.id} href={`/expert/${expert.id}`}>
                  <Card className="w-48 shrink-0 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={expert.profileImage}
                        alt={expert.name}
                        className="w-16 h-16 rounded-full mx-auto mb-3 bg-muted"
                      />
                      <p className="font-semibold text-sm">{expert.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {expert.title}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <span className="text-xs font-medium">
                          {expert.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({expert.reviewCount})
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory("all")}
            >
              전체
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger className="w-36 shrink-0 ml-4">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">관련도순</SelectItem>
              <SelectItem value="popular">인기순</SelectItem>
              <SelectItem value="rating">평점순</SelectItem>
              <SelectItem value="price-low">낮은 가격순</SelectItem>
              <SelectItem value="price-high">높은 가격순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Service Results */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">로딩중...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {results.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                expert={expertMap[service.expertId]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">검색 결과가 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              다른 키워드로 검색해보시거나 카테고리를 둘러보세요
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setSubmittedQuery("");
                  setSelectedCategory("all");
                }}
              >
                검색 초기화
              </Button>
              <Button asChild>
                <Link href="/categories">카테고리 둘러보기</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
