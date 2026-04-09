"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, X, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServiceByIdClient, getExpertByIdClient, getCategoryByIdClient } from "@/lib/db-client";
import type { Service, Expert, Category } from "@/types";

const STORAGE_KEY = "ttukddak_history";

interface RecentlyViewedItem extends Service {
  viewedAt: string;
}

function loadHistoryIds(): { id: string; viewedAt: string }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistoryIds(items: { id: string; viewedAt: string }[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export default function HistoryPage() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
  const [expertMap, setExpertMap] = useState<Record<string, Expert>>({});
  const [categoryMap, setCategoryMap] = useState<Record<string, Category>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const historyItems = loadHistoryIds();
    if (historyItems.length === 0) { setLoading(false); return; }

    Promise.all(
      historyItems.map(async ({ id, viewedAt }) => {
        const svc = await getServiceByIdClient(id);
        if (!svc) return null;
        return { ...svc, viewedAt };
      })
    ).then((results) => {
      const valid = results.filter((r): r is RecentlyViewedItem => r !== null);
      setRecentlyViewed(valid);

      const expertIds = [...new Set(valid.map((s) => s.expertId))];
      const categoryIds = [...new Set(valid.map((s) => s.categoryId))];

      Promise.all(expertIds.map((id) => getExpertByIdClient(id).then((e) => ({ id, expert: e })))).then(
        (results) => {
          const map: Record<string, Expert> = {};
          for (const { id, expert } of results) {
            if (expert) map[id] = expert;
          }
          setExpertMap(map);
        }
      );

      Promise.all(categoryIds.map((id) => getCategoryByIdClient(id).then((c) => ({ id, category: c })))).then(
        (results) => {
          const map: Record<string, Category> = {};
          for (const { id, category } of results) {
            if (category) map[id] = category;
          }
          setCategoryMap(map);
        }
      );

      setLoading(false);
    });
  }, []);

  const removeItem = (serviceId: string) => {
    const current = loadHistoryIds().filter((item) => item.id !== serviceId);
    saveHistoryIds(current);
    setRecentlyViewed((prev) => prev.filter((s) => s.id !== serviceId));
  };

  const clearAll = () => {
    saveHistoryIds([]);
    setRecentlyViewed([]);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ko-KR").format(price);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "방금 전";
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">최근 본 서비스</h1>
                <p className="text-sm text-muted-foreground">
                  {recentlyViewed.length}개의 서비스를 최근에 봤습니다
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={clearAll}
            >
              <Trash2 className="h-4 w-4 mr-1" /> 전체 삭제
            </Button>
          </div>

          {/* List */}
          {recentlyViewed.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">최근 본 서비스가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentlyViewed.map((service) => {
                const expert = expertMap[service.expertId];
                const category = categoryMap[service.categoryId];
                return (
                  <Link key={service.id} href={`/service/${service.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-32 h-24 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={service.thumbnail}
                            alt={service.title}
                            fill
                            className="object-cover"
                          />
                          {service.isPrime && (
                            <Badge className="absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0">
                              프라임
                            </Badge>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-[10px]">
                                {category?.name}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(service.viewedAt)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {service.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {expert?.name} 전문가
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-bold text-sm">
                              {formatPrice(service.price)}
                              <span className="text-xs font-normal text-muted-foreground">원~</span>
                            </p>
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-medium">{service.rating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">({service.reviewCount})</span>
                            </div>
                          </div>
                        </div>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground self-start"
                          onClick={(e) => { e.preventDefault(); removeItem(service.id); }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
