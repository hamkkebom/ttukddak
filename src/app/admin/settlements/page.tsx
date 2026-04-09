"use client";

import { useState, useEffect } from "react";
import { Search, DollarSign, CheckCircle, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrdersClient } from "@/lib/db-client";
import type { Order } from "@/types";

const statusColors: Record<string, string> = {
  "정산완료": "bg-green-100 text-green-700",
  "정산예정": "bg-blue-100 text-blue-700",
  "정산보류": "bg-red-100 text-red-700",
};

interface Settlement {
  id: string;
  expert: string;
  expertId: string;
  total: number;
  fee: number;
  amount: number;
  status: string;
  date: string;
  paidDate: string;
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  useEffect(() => {
    getOrdersClient({ status: "completed" }).then((orders: Order[]) => {
      const derived: Settlement[] = orders.map((o, idx) => {
        const fee = Math.round(o.price * 0.1);
        const net = o.price - fee;
        return {
          id: `STL-${String(idx + 1).padStart(3, "0")}`,
          expert: o.expertName || o.expertId.slice(0, 8),
          expertId: o.expertId,
          total: o.price,
          fee,
          amount: net,
          status: "정산완료",
          date: o.createdAt?.split("T")[0] || "-",
          paidDate: o.updatedAt?.split("T")[0] || "-",
        };
      });
      setSettlements(derived);
      setLoading(false);
    });
  }, []);

  const totalPaid = settlements.filter((s) => s.status === "정산완료").reduce((sum, s) => sum + s.amount, 0);
  const totalPending = settlements.filter((s) => s.status === "정산예정").reduce((sum, s) => sum + s.amount, 0);
  const totalFee = settlements.reduce((sum, s) => sum + s.fee, 0);

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
          <h1 className="text-2xl font-bold">정산 관리</h1>
          <p className="text-muted-foreground text-sm">전문가 수수료 및 정산 내역</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" /> 내보내기</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-5"><div className="flex items-center gap-3 mb-2"><CheckCircle className="h-5 w-5 text-green-600" /><span className="text-sm text-muted-foreground">정산 완료</span></div><p className="text-2xl font-bold">{fmt(totalPaid)}원</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-3 mb-2"><Clock className="h-5 w-5 text-blue-600" /><span className="text-sm text-muted-foreground">정산 예정</span></div><p className="text-2xl font-bold">{fmt(totalPending)}원</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center gap-3 mb-2"><DollarSign className="h-5 w-5 text-primary" /><span className="text-sm text-muted-foreground">누적 수수료</span></div><p className="text-2xl font-bold">{fmt(totalFee)}원</p></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="전문가 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">정산번호</th>
              <th className="text-left p-4 font-medium">전문가</th>
              <th className="text-right p-4 font-medium">거래액</th>
              <th className="text-right p-4 font-medium">수수료(10%)</th>
              <th className="text-right p-4 font-medium">정산액</th>
              <th className="text-center p-4 font-medium">상태</th>
              <th className="text-left p-4 font-medium">정산일</th>
            </tr></thead>
            <tbody>
              {settlements.filter((s) => !search || s.expert.includes(search)).map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-mono text-xs">{s.id}</td>
                  <td className="p-4 font-medium">{s.expert}</td>
                  <td className="p-4 text-right">{fmt(s.total)}</td>
                  <td className="p-4 text-right text-muted-foreground">{fmt(s.fee)}</td>
                  <td className="p-4 text-right font-medium">{fmt(s.amount)}</td>
                  <td className="p-4 text-center"><Badge variant="secondary" className={statusColors[s.status]}>{s.status}</Badge></td>
                  <td className="p-4 text-muted-foreground text-xs">{s.paidDate || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
