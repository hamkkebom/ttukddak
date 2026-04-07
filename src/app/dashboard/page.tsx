"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart3, Package, MessageCircle, Star, DollarSign,
  TrendingUp, Eye, ShoppingBag, Plus, ChevronRight,
  Calendar, Clock, Users, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const stats = [
  { label: "이번 달 수익", value: "1,250,000원", change: "+12.5%", up: true, icon: DollarSign },
  { label: "진행중 주문", value: "3건", change: "+1", up: true, icon: Package },
  { label: "총 조회수", value: "2,847", change: "+23.1%", up: true, icon: Eye },
  { label: "평균 평점", value: "4.9", change: "0.0", up: true, icon: Star },
];

const activeOrders = [
  {
    id: "ord-101",
    clientName: "김의뢰",
    serviceName: "AI 프리미엄 뮤직비디오",
    package: "스탠다드",
    price: 300000,
    status: "작업중",
    statusColor: "bg-blue-100 text-blue-700",
    deadline: "2024-03-25",
    progress: 60,
  },
  {
    id: "ord-102",
    clientName: "박고객",
    serviceName: "Runway 시네마틱 영상",
    package: "프리미엄",
    price: 700000,
    status: "검수 대기",
    statusColor: "bg-amber-100 text-amber-700",
    deadline: "2024-03-20",
    progress: 90,
  },
  {
    id: "ord-103",
    clientName: "최신규",
    serviceName: "AI 프리미엄 뮤직비디오",
    package: "베이직",
    price: 150000,
    status: "요구사항 확인",
    statusColor: "bg-purple-100 text-purple-700",
    deadline: "2024-03-30",
    progress: 10,
  },
];

const recentReviews = [
  { client: "이만족", rating: 5, text: "퀄리티가 기대 이상이었습니다!", date: "2일 전" },
  { client: "정감사", rating: 5, text: "소통이 정말 빠르고 친절해요.", date: "5일 전" },
  { client: "한재주", rating: 4, text: "좋았지만 색감 조정이 아쉬웠습니다.", date: "1주 전" },
];

const myServices = [
  { id: "svc-1", title: "AI로 만드는 프리미엄 뮤직비디오 & 광고 영상", views: 1245, orders: 234, rating: 4.9, active: true },
  { id: "svc-2", title: "Runway Gen-3 활용 시네마틱 AI 영상 제작", views: 892, orders: 178, rating: 4.85, active: true },
];

export default function DashboardPage() {
  const formatPrice = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">전문가 대시보드</h1>
            <p className="text-muted-foreground">안녕하세요, 김영상 전문가님!</p>
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
                <p className="text-2xl font-bold">{stat.value}</p>
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
                {activeOrders.map((order) => (
                  <Link key={order.id} href="/dashboard/orders" className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className={order.statusColor}>{order.status}</Badge>
                          <span className="text-xs text-muted-foreground">{order.id}</span>
                        </div>
                        <p className="font-medium text-sm">{order.serviceName}</p>
                        <p className="text-xs text-muted-foreground">{order.clientName} · {order.package} 패키지</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatPrice(order.price)}원</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" /> {order.deadline}
                        </p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">{order.progress}% 완료</p>
                  </Link>
                ))}
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
                {myServices.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{svc.title}</p>
                        <Badge variant={svc.active ? "default" : "secondary"} className="text-xs shrink-0">
                          {svc.active ? "활성" : "비활성"}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{svc.views}</span>
                        <span className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" />{svc.orders}건</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" />{svc.rating}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild><Link href={`/dashboard/services/${svc.id}/edit`}>관리 <ChevronRight className="h-3 w-3 ml-1" /></Link></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Monthly Earnings Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> 월간 수익
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["1월", "2월", "3월"].map((month, i) => {
                    const values = [850000, 1100000, 1250000];
                    const maxVal = 1500000;
                    return (
                      <div key={month} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-8">{month}</span>
                        <div className="flex-1 bg-muted rounded-full h-3">
                          <div
                            className="bg-primary rounded-full h-3 transition-all"
                            style={{ width: `${(values[i] / maxVal) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-20 text-right">
                          {formatPrice(values[i])}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">누적 수익</span>
                  <span className="font-bold">3,200,000원</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">최근 리뷰</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentReviews.map((review, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{review.client}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: review.rating }).map((_, j) => (
                          <Star key={j} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{review.text}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">{review.date}</p>
                      <button className="text-[10px] text-primary hover:underline" onClick={() => toast.success("답글 기능은 준비 중입니다")}>답글 달기</button>
                    </div>
                    {i < recentReviews.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardContent className="p-4 space-y-2">
                {[
                  { icon: MessageCircle, label: "메시지", href: "/messages", badge: "2" },
                  { icon: Users, label: "견적 요청 확인", href: "/dashboard/quotes", badge: "3" },
                  { icon: Clock, label: "정산 내역", href: "/dashboard/earnings" },
                ].map((link) => (
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
