"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart3, Package, MessageCircle, Star, DollarSign,
  TrendingUp, Eye, ShoppingBag, Plus, ChevronRight,
  Calendar, Clock, Users, ArrowUpRight, ArrowDownRight, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import {
  getOrdersClient,
  getServicesByExpertClient,
  getReviewsClient,
} from "@/lib/db-client";
import type { Order, Service, Review } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "요구사항 확인",
  paid: "요구사항 확인",
  in_progress: "작업중",
  review: "검수 대기",
  completed: "완료",
  cancelled: "취소",
  refunded: "환불",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-purple-100 text-purple-700",
  paid: "bg-purple-100 text-purple-700",
  in_progress: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-slate-100 text-slate-700",
  refunded: "bg-red-100 text-red-700",
};

const PROGRESS_BY_STATUS: Record<string, number> = {
  pending: 10, paid: 15, in_progress: 60, review: 90, completed: 100, cancelled: 0, refunded: 0,
};

export default function DashboardPage() {
  const formatPrice = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("전문가");
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const displayName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "전문가";
        setUserName(displayName);

        const [fetchedOrders, fetchedServices] = await Promise.all([
          getOrdersClient({ expertId: user.id }),
          getServicesByExpertClient(user.id),
        ]);
        setOrders(fetchedOrders);
        setServices(fetchedServices);

        if (fetchedServices.length > 0) {
          const reviewPromises = fetchedServices.map((s) =>
            getReviewsClient({ serviceId: s.id })
          );
          const allReviews = (await Promise.all(reviewPromises)).flat();
          setReviews(allReviews);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Calculate stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthRevenue = orders
    .filter((o) => o.status === "completed" && o.createdAt.startsWith(thisMonth))
    .reduce((s, o) => s + o.price, 0);

  const activeOrders = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled" && o.status !== "refunded"
  );

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  // Monthly earnings for chart (last 3 months)
  const now = new Date();
  const last3Months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
    return {
      label: `${d.getMonth() + 1}월`,
      key: d.toISOString().slice(0, 7),
    };
  });

  const monthlyValues = last3Months.map((m) =>
    orders
      .filter((o) => o.status === "completed" && o.createdAt.startsWith(m.key))
      .reduce((s, o) => s + o.price, 0)
  );
  const maxMonthly = Math.max(...monthlyValues, 1);

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + o.price, 0);

  const recentReviews = reviews.slice(0, 3);

  const stats = [
    {
      label: "이번 달 수익",
      value: `${formatPrice(thisMonthRevenue)}원`,
      change: "+0%",
      up: true,
      icon: DollarSign,
    },
    {
      label: "진행중 주문",
      value: `${activeOrders.length}건`,
      change: "+0",
      up: true,
      icon: Package,
    },
    {
      label: "총 조회수",
      value: String(services.reduce((s, sv) => s + (sv.viewCount || 0), 0)),
      change: "+0%",
      up: true,
      icon: Eye,
    },
    {
      label: "평균 평점",
      value: avgRating,
      change: "0.0",
      up: true,
      icon: Star,
    },
  ];

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyContent.trim()) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("답글이 등록되었습니다");
      setReplyingId(null);
      setReplyContent("");
    } catch {
      toast.error("답글 등록에 실패했습니다");
    }
  };

  const getRelativeDate = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "오늘";
    if (days === 1) return "1일 전";
    if (days < 7) return `${days}일 전`;
    if (days < 14) return "1주 전";
    return `${Math.floor(days / 7)}주 전`;
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">전문가 대시보드</h1>
            <p className="text-muted-foreground">안녕하세요, {userName} 전문가님!</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/services/new">
              <Plus className="h-4 w-4 mr-2" /> 새 서비스 등록
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.up ? "text-green-600" : "text-red-500"}`}>
                    {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-bold">{loading ? "..." : stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Orders & Services */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">진행중 주문</CardTitle>
                  <Badge>{activeOrders.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">불러오는 중...</p>
                ) : activeOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">진행중인 주문이 없습니다</p>
                ) : (
                  activeOrders.slice(0, 5).map((order) => {
                    const statusLabel = STATUS_LABEL[order.status] || order.status;
                    const statusColor = STATUS_COLOR[order.status] || "bg-gray-100 text-gray-700";
                    const progress = PROGRESS_BY_STATUS[order.status] || 0;
                    const deadline = order.createdAt.split("T")[0];
                    return (
                      <Link key={order.id} href="/dashboard/orders" className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className={statusColor}>{statusLabel}</Badge>
                              <span className="text-xs text-muted-foreground">{order.id.slice(0, 8)}</span>
                            </div>
                            <p className="font-medium text-sm">{order.serviceName || "서비스"}</p>
                            <p className="text-xs text-muted-foreground">{order.buyerName || "의뢰인"} · {order.packageName} 패키지</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatPrice(order.price)}원</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Calendar className="h-3 w-3" /> {deadline}
                            </p>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">{progress}% 완료</p>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* My Services */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">내 서비스</CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/services/new">
                      <Plus className="h-3 w-3 mr-1" /> 추가
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">불러오는 중...</p>
                ) : services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">등록된 서비스가 없습니다</p>
                ) : (
                  services.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{svc.title}</p>
                          <Badge variant="default" className="text-xs shrink-0">활성</Badge>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{svc.viewCount || 0}</span>
                          <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{svc.salesCount}건</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3" />{svc.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/services/${svc.id}/edit`}>관리 <ChevronRight className="h-3 w-3 ml-1" /></Link>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Monthly Earnings Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> 월간 수익
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {last3Months.map((m, i) => (
                    <div key={m.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-8">{m.label}</span>
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div
                          className="bg-primary rounded-full h-3 transition-all"
                          style={{ width: loading ? "0%" : `${(monthlyValues[i] / maxMonthly) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-20 text-right">
                        {loading ? "..." : formatPrice(monthlyValues[i])}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">누적 수익</span>
                  <span className="font-bold">{loading ? "..." : `${formatPrice(totalRevenue)}원`}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">최근 리뷰</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">불러오는 중...</p>
                ) : recentReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">아직 리뷰가 없습니다</p>
                ) : (
                  recentReviews.map((review, i) => (
                    <div key={review.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{review.userName}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, j) => (
                            <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{review.content}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">{getRelativeDate(review.createdAt)}</p>
                        <button
                          className="text-[10px] text-primary hover:underline"
                          onClick={() => {
                            setReplyingId(replyingId === review.id ? null : review.id);
                            setReplyContent("");
                          }}
                        >
                          {replyingId === review.id ? "취소" : "답글 달기"}
                        </button>
                      </div>
                      {replyingId === review.id && (
                        <div className="flex gap-2 mt-2">
                          <input
                            className="flex-1 text-xs rounded border border-input bg-background px-2 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="답글을 입력하세요..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleReplySubmit(review.id); }}
                          />
                          <button
                            className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            disabled={!replyContent.trim()}
                            onClick={() => handleReplySubmit(review.id)}
                          >
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {i < recentReviews.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardContent className="p-4 space-y-2">
                {(
                  [
                    { icon: MessageCircle, label: "메시지", href: "/messages", badge: null as string | null },
                    { icon: Users, label: "견적 요청 확인", href: "/dashboard/quotes", badge: null as string | null },
                    { icon: Clock, label: "정산 내역", href: "/dashboard/earnings", badge: null as string | null },
                  ] as { icon: React.ElementType; label: string; href: string; badge: string | null }[]
                ).map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{link.label}</span>
                    </div>
                    {link.badge && <Badge className="text-xs">{link.badge}</Badge>}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
