"use client";

import { useEffect, useState } from "react";
import { Download, DollarSign, TrendingUp, CheckCircle, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { getOrdersClient } from "@/lib/db-client";
import type { Order } from "@/types";

const statusColors: Record<string, string> = {
  "정산완료": "bg-green-100 text-green-700",
  "정산예정": "bg-blue-100 text-blue-700",
};

interface EarningRow {
  id: string;
  service: string;
  client: string;
  pkg: string;
  gross: number;
  fee: number;
  net: number;
  status: string;
  orderDate: string;
  paidDate: string;
}

export default function DashboardEarningsPage() {
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<{ month: string; gross: number; net: number }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;

        const orders = await getOrdersClient({ expertId: user.id });
        const completedOrders = orders.filter((o) => o.status === "completed" || o.status === "paid" || o.status === "review" || o.status === "in_progress");

        const rows: EarningRow[] = completedOrders.map((o) => {
          const gross = o.price;
          const fee = Math.round(gross * 0.1);
          const net = gross - fee;
          const isSettled = o.status === "completed";
          return {
            id: `STL-${o.id.slice(0, 6).toUpperCase()}`,
            service: o.serviceName || "서비스",
            client: o.buyerName || "의뢰인",
            pkg: o.packageName,
            gross,
            fee,
            net,
            status: isSettled ? "정산완료" : "정산예정",
            orderDate: o.createdAt.split("T")[0],
            paidDate: isSettled ? o.updatedAt.split("T")[0] : "",
          };
        });
        setEarnings(rows);

        // Monthly grouping (last 3 months)
        const now = new Date();
        const monthly = Array.from({ length: 3 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
          const key = d.toISOString().slice(0, 7);
          const label = `${d.getMonth() + 1}월`;
          const monthOrders = completedOrders.filter((o) => o.createdAt.startsWith(key));
          const gross = monthOrders.reduce((s, o) => s + o.price, 0);
          const net = Math.round(gross * 0.9);
          return { month: label, gross, net };
        });
        setMonthlyEarnings(monthly);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalNet = earnings.filter((e) => e.status === "정산완료").reduce((s, e) => s + e.net, 0);
  const pendingNet = earnings.filter((e) => e.status === "정산예정").reduce((s, e) => s + e.net, 0);
  const totalFee = earnings.reduce((s, e) => s + e.fee, 0);
  const maxMonthly = Math.max(...monthlyEarnings.map((m) => m.net), 1);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">수익 & 정산</h1>
          <p className="text-muted-foreground text-sm">정산 내역 및 수익 현황</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" /> 내보내기</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">정산 완료</span>
            </div>
            <p className="text-2xl font-bold">{loading ? "..." : `${fmt(totalNet)}원`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">정산 예정</span>
            </div>
            <p className="text-2xl font-bold">{loading ? "..." : `${fmt(pendingNet)}원`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">누적 수수료</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">{loading ? "..." : `${fmt(totalFee)}원`}</p>
            <p className="text-xs text-muted-foreground mt-1">수수료율 10%</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card className="mb-8">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> 월별 수익</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyEarnings.map((m) => (
              <div key={m.month} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-10">{m.month}</span>
                <div className="flex-1">
                  <div className="w-full bg-muted rounded-full h-4">
                    <div className="bg-primary rounded-full h-4" style={{ width: loading ? "0%" : `${(m.net / maxMonthly) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right w-24">
                  <p className="text-sm font-medium">{loading ? "..." : fmt(m.net)}</p>
                  <p className="text-[10px] text-muted-foreground">총 {loading ? "..." : fmt(m.gross)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settlement List */}
      <Card>
        <CardHeader><CardTitle className="text-base">정산 내역</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">불러오는 중...</p>
          ) : earnings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">정산 내역이 없습니다</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium">정산번호</th>
                <th className="text-left p-4 font-medium">서비스</th>
                <th className="text-left p-4 font-medium">의뢰인</th>
                <th className="text-right p-4 font-medium">거래액</th>
                <th className="text-right p-4 font-medium">수수료</th>
                <th className="text-right p-4 font-medium">정산액</th>
                <th className="text-center p-4 font-medium">상태</th>
                <th className="text-left p-4 font-medium">정산일</th>
              </tr></thead>
              <tbody>
                {earnings.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-mono text-xs">{e.id}</td>
                    <td className="p-4 max-w-[180px] truncate">{e.service}</td>
                    <td className="p-4 text-muted-foreground">{e.client}</td>
                    <td className="p-4 text-right">{fmt(e.gross)}</td>
                    <td className="p-4 text-right text-muted-foreground">-{fmt(e.fee)}</td>
                    <td className="p-4 text-right font-medium">{fmt(e.net)}</td>
                    <td className="p-4 text-center"><Badge variant="secondary" className={statusColors[e.status]}>{e.status}</Badge></td>
                    <td className="p-4 text-muted-foreground text-xs">{e.paidDate || "예정"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
