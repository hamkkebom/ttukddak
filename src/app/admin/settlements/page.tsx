"use client";

import { useState } from "react";
import { Search, DollarSign, CheckCircle, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const settlements = [
  { id: "STL-301", expert: "김영상", bank: "신한 ****1234", amount: 270000, fee: 30000, total: 300000, status: "정산완료", date: "2024-03-18", paidDate: "2024-03-20" },
  { id: "STL-300", expert: "이모션", bank: "국민 ****5678", amount: 180000, fee: 20000, total: 200000, status: "정산완료", date: "2024-03-17", paidDate: "2024-03-19" },
  { id: "STL-299", expert: "정유튜", bank: "우리 ****9012", amount: 90000, fee: 10000, total: 100000, status: "정산예정", date: "2024-03-16", paidDate: "" },
  { id: "STL-298", expert: "최삼디", bank: "하나 ****3456", amount: 450000, fee: 50000, total: 500000, status: "정산예정", date: "2024-03-15", paidDate: "" },
  { id: "STL-297", expert: "김영상", bank: "신한 ****1234", amount: 630000, fee: 70000, total: 700000, status: "정산보류", date: "2024-03-14", paidDate: "" },
  { id: "STL-296", expert: "한광고", bank: "기업 ****7890", amount: 360000, fee: 40000, total: 400000, status: "정산완료", date: "2024-03-12", paidDate: "2024-03-14" },
];

const statusColors: Record<string, string> = {
  "정산완료": "bg-green-100 text-green-700",
  "정산예정": "bg-blue-100 text-blue-700",
  "정산보류": "bg-red-100 text-red-700",
};

export default function AdminSettlementsPage() {
  const [search, setSearch] = useState("");
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const totalPaid = settlements.filter((s) => s.status === "정산완료").reduce((sum, s) => sum + s.amount, 0);
  const totalPending = settlements.filter((s) => s.status === "정산예정").reduce((sum, s) => sum + s.amount, 0);
  const totalFee = settlements.reduce((sum, s) => sum + s.fee, 0);

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
              <th className="text-left p-4 font-medium">계좌</th>
              <th className="text-right p-4 font-medium">거래액</th>
              <th className="text-right p-4 font-medium">수수료</th>
              <th className="text-right p-4 font-medium">정산액</th>
              <th className="text-center p-4 font-medium">상태</th>
              <th className="text-left p-4 font-medium">정산일</th>
            </tr></thead>
            <tbody>
              {settlements.filter((s) => !search || s.expert.includes(search)).map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-mono text-xs">{s.id}</td>
                  <td className="p-4 font-medium">{s.expert}</td>
                  <td className="p-4 text-muted-foreground text-xs">{s.bank}</td>
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
