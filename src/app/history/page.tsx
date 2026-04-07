"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, X, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { services } from "@/data/services";
import { getExpertById } from "@/data/experts";
import { getCategoryById } from "@/data/categories";

// 최근 본 서비스 (실제로는 localStorage 등에서 관리)
const recentlyViewed = services.slice(0, 8).map((s, i) => ({
  ...s,
  viewedAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

export default function HistoryPage() {
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
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-1" /> 전체 삭제
            </Button>
          </div>

          {/* List */}
          <div className="space-y-3">
            {recentlyViewed.map((service) => {
              const expert = getExpertById(service.expertId);
              const category = getCategoryById(service.categoryId);
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
                        onClick={(e) => { e.preventDefault(); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
