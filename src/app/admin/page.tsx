"use client";

import { useState, useEffect } from "react";
import {
  Users, Package, ShoppingBag, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, Star, Clock, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProfilesClient, getServicesClient, getOrdersClient } from "@/lib/db-client";
import type { Order, Profile, Service } from "@/types";

const pendingItems = [
  { type: "서비스 승인 대기", count: 8, color: "text-amber-600 bg-amber-100" },
  { type: "전문가 승인 대기", count: 3, color: "text-blue-600 bg-blue-100" },
  { type: "신고 처리 대기", count: 2, color: "text-red-600 bg-red-100" },
  { type: "환불 요청", count: 1, color: "text-purple-600 bg-purple-100" },
  { type: "1:1 문의 미답변", count: 5, color: "text-green-600 bg-green-100" },
];

const monthlyRevenue = [
  { month: "10월", value: 32000000 },
  { month: "11월", value: 35000000 },
  { month: "12월", value: 41000000 },
  { month: "1월", value: 38000000 },
  { month: "2월", value: 42000000 },
  { month: "3월", value: 45200000 },
];

const statusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  in_progress: "bg-cyan-100 text-cyan-700",
  review: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "결제완료",
  paid: "결제완료",
  in_progress: "진행중",
  review: "검수중",
  completed: "완료",
  cancelled: "취소",
  refunded: "환불",
};

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProfilesClient(),
      getServicesClient(),
      getOrdersClient(),
    ]).then(([p, s, o]) => {
      setProfiles(p);
      setServices(s);
      setOrders(o);
      setLoading(false);
    });
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.value));

  const totalRevenue = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const thisMonthOrders = orders.length;

  const kpiCards = [
    { label: "총 회원수", value: loading ? "..." : profiles.length.toLocaleString(), change: "", up: true, icon: Users },
    { label: "등록 서비스", value: loading ? "..." : services.length.toLocaleString(), change: "", up: true, icon: Package },
    { label: "총 거래", value: loading ? "..." : `${thisMonthOrders}건`, change: "", up: true, icon: ShoppingBag },
    { label: "누적 매출", value: loading ? "..." : `${(totalRevenue / 1000000).toFixed(1)}M`, change: "", up: true, icon: DollarSign },
  ];

  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground text-sm">뚝딱 운영 현황</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
                {kpi.change && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${kpi.up ? "text-green-600" : "text-red-500"}`}>
                    {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.change}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> 월간 매출 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {monthlyRevenue.map((m) => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-10">{m.month}</span>
                    <div className="flex-1 bg-muted rounded-full h-4">
                      <div
                        className="bg-primary rounded-full h-4 transition-all"
                        style={{ width: `${(m.value / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-16 text-right">
                      {(m.value / 1000000).toFixed(1)}M
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">최근 거래</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">거래 내역이 없습니다</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 font-medium">주문번호</th>
                        <th className="text-left py-2 font-medium">구매자</th>
                        <th className="text-left py-2 font-medium">서비스</th>
                        <th className="text-right py-2 font-medium">금액</th>
                        <th className="text-center py-2 font-medium">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                          <td className="py-3">{order.buyerName || order.buyerId.slice(0, 8)}</td>
                          <td className="py-3 max-w-[150px] truncate">{order.serviceName || "-"}</td>
                          <td className="py-3 text-right font-medium">{fmt(order.price)}</td>
                          <td className="py-3 text-center">
                            <Badge variant="secondary" className={statusColors[order.status] || ""}>
                              {statusLabels[order.status] || order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Pending */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" /> 처리 필요
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingItems.map((item) => (
                <div key={item.type} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">{item.type}</span>
                  <Badge variant="secondary" className={item.color}>{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader><CardTitle className="text-base">현황</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "총 회원수", value: `${profiles.length}명` },
                { label: "총 서비스", value: `${services.length}개` },
                { label: "총 주문", value: `${orders.length}건` },
                { label: "완료 거래", value: `${orders.filter((o) => o.status === "completed").length}건` },
                { label: "진행중 거래", value: `${orders.filter((o) => o.status === "in_progress").length}건` },
              ].map((s) => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{s.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
