"use client";

import { useState, useEffect } from "react";
import { Download, TrendingUp, Users, ShoppingBag, DollarSign, Star, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServicesClient, getOrdersClient, getCategoriesClient, getProfilesClient } from "@/lib/db-client";
import type { Service, Order, Category, Profile } from "@/types";

export default function AdminReportsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getServicesClient(),
      getOrdersClient(),
      getCategoriesClient(),
      getProfilesClient(),
    ]).then(([s, o, c, p]) => {
      setServices(s);
      setOrders(o);
      setCategories(c);
      setProfiles(p);
      setLoading(false);
    });
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const totalRevenue = orders.reduce((sum, o) => sum + o.price, 0);
  const completedOrders = orders.filter((o) => o.status === "completed");
  const avgRating = services.length > 0
    ? (services.reduce((sum, s) => sum + s.rating, 0) / services.length).toFixed(2)
    : "0.00";

  // Build category stats from orders joined with services
  const categoryStats = categories.map((cat) => {
    const catServices = services.filter((s) => s.categoryId === cat.id);
    const catServiceIds = new Set(catServices.map((s) => s.id));
    const catOrders = orders.filter((o) => catServiceIds.has(o.serviceId));
    const catRevenue = catOrders.reduce((sum, o) => sum + o.price, 0);
    return { name: cat.name, orders: catOrders.length, revenue: catRevenue };
  }).filter((c) => c.orders > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  const totalCatRevenue = categoryStats.reduce((sum, c) => sum + c.revenue, 0);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">리포트</h1>
          <p className="text-muted-foreground text-sm">매출 및 운영 분석</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" /> PDF 내보내기</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: "누적 매출", value: `${(totalRevenue / 1000000).toFixed(1)}M`, sub: `완료 ${completedOrders.length}건` },
          { icon: ShoppingBag, label: "총 거래", value: `${orders.length}건`, sub: `완료 ${completedOrders.length}건` },
          { icon: Users, label: "총 회원", value: fmt(profiles.length), sub: `서비스 ${services.length}개` },
          { icon: Star, label: "평균 평점", value: avgRating, sub: "전체 서비스 기준" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-green-600 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> 주문 상태 현황</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "완료", status: "completed" },
                { label: "진행중", status: "in_progress" },
                { label: "검수중", status: "review" },
                { label: "결제완료", status: "paid" },
                { label: "취소/환불", status: "cancelled" },
              ].map((item) => {
                const count = orders.filter((o) => o.status === item.status || (item.status === "cancelled" && o.status === "refunded")).length;
                const pct = orders.length > 0 ? (count / orders.length) * 100 : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16">{item.label}</span>
                    <div className="flex-1 bg-muted rounded-full h-4">
                      <div className="bg-primary rounded-full h-4" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Share */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> 카테고리별 매출</CardTitle></CardHeader>
          <CardContent>
            {categoryStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">데이터가 없습니다</p>
            ) : (
              <div className="space-y-4">
                {categoryStats.map((cat) => {
                  const share = totalCatRevenue > 0 ? Math.round((cat.revenue / totalCatRevenue) * 100) : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{cat.name}</span>
                        <span className="text-muted-foreground">{share}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary rounded-full h-2.5" style={{ width: `${share}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Services */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top 서비스 (판매 기준)</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">순위</th>
              <th className="text-left p-4 font-medium">서비스</th>
              <th className="text-right p-4 font-medium">가격</th>
              <th className="text-right p-4 font-medium">판매수</th>
              <th className="text-right p-4 font-medium">평점</th>
            </tr></thead>
            <tbody>
              {services.slice(0, 10).map((s, i) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4"><Badge variant={i < 3 ? "default" : "secondary"}>{i + 1}</Badge></td>
                  <td className="p-4 font-medium max-w-[250px] truncate">{s.title}</td>
                  <td className="p-4 text-right">{fmt(s.price)}원</td>
                  <td className="p-4 text-right">{s.salesCount}건</td>
                  <td className="p-4 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{s.rating.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
