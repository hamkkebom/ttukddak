"use client";

import { useState } from "react";
import { Search, Eye, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const orders = [
  { id: "ORD-2487", buyer: "김의뢰", seller: "김영상", service: "AI 프리미엄 뮤직비디오", pkg: "스탠다드", amount: 300000, fee: 30000, status: "진행중", date: "2024-03-15", deadline: "2024-03-25" },
  { id: "ORD-2486", buyer: "박고객", seller: "이모션", service: "로고 모션그래픽", pkg: "프리미엄", amount: 350000, fee: 35000, status: "결제완료", date: "2024-03-15", deadline: "2024-03-25" },
  { id: "ORD-2485", buyer: "최신규", seller: "정유튜", service: "유튜브 편집", pkg: "스탠다드", amount: 100000, fee: 10000, status: "검수중", date: "2024-03-14", deadline: "2024-03-19" },
  { id: "ORD-2484", buyer: "한재주", seller: "최삼디", service: "3D 제품 렌더링", pkg: "스탠다드", amount: 500000, fee: 50000, status: "완료", date: "2024-03-12", deadline: "2024-03-27" },
  { id: "ORD-2483", buyer: "오만족", seller: "김영상", service: "Runway 시네마틱", pkg: "프리미엄", amount: 700000, fee: 70000, status: "환불요청", date: "2024-03-10", deadline: "2024-03-28" },
  { id: "ORD-2482", buyer: "정감사", seller: "박애니", service: "캐릭터 애니메이션", pkg: "베이직", amount: 180000, fee: 18000, status: "완료", date: "2024-03-08", deadline: "2024-03-18" },
  { id: "ORD-2481", buyer: "강교수", seller: "강교육", service: "교육 콘텐츠 영상", pkg: "스탠다드", amount: 300000, fee: 30000, status: "완료", date: "2024-03-05", deadline: "2024-03-15" },
];

const statusColors: Record<string, string> = {
  "결제완료": "bg-blue-100 text-blue-700", "진행중": "bg-cyan-100 text-cyan-700",
  "검수중": "bg-amber-100 text-amber-700", "완료": "bg-green-100 text-green-700",
  "환불요청": "bg-red-100 text-red-700", "환불완료": "bg-slate-100 text-slate-700",
};

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.id.includes(search) || o.buyer.includes(search) || o.seller.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((s, o) => s + o.amount, 0);
  const totalFee = filtered.reduce((s, o) => s + o.fee, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <p className="text-muted-foreground text-sm">총 {orders.length}건</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "총 거래액", value: `${fmt(totalAmount)}원` },
          { label: "총 수수료", value: `${fmt(totalFee)}원` },
          { label: "진행중", value: `${orders.filter((o) => ["결제완료","진행중","검수중"].includes(o.status)).length}건` },
          { label: "환불요청", value: `${orders.filter((o) => o.status === "환불요청").length}건` },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4 text-center"><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="주문번호, 구매자, 판매자 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="결제완료">결제완료</SelectItem>
              <SelectItem value="진행중">진행중</SelectItem>
              <SelectItem value="검수중">검수중</SelectItem>
              <SelectItem value="완료">완료</SelectItem>
              <SelectItem value="환불요청">환불요청</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium">주문번호</th>
              <th className="text-left p-4 font-medium">구매자</th>
              <th className="text-left p-4 font-medium">판매자</th>
              <th className="text-left p-4 font-medium">서비스</th>
              <th className="text-right p-4 font-medium">금액</th>
              <th className="text-right p-4 font-medium">수수료</th>
              <th className="text-center p-4 font-medium">상태</th>
              <th className="text-left p-4 font-medium">주문일</th>
              <th className="text-center p-4 font-medium">관리</th>
            </tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-mono text-xs">{o.id}</td>
                  <td className="p-4">{o.buyer}</td>
                  <td className="p-4">{o.seller}</td>
                  <td className="p-4 max-w-[150px] truncate">{o.service}</td>
                  <td className="p-4 text-right font-medium">{fmt(o.amount)}</td>
                  <td className="p-4 text-right text-muted-foreground">{fmt(o.fee)}</td>
                  <td className="p-4 text-center"><Badge variant="secondary" className={statusColors[o.status]}>{o.status}</Badge></td>
                  <td className="p-4 text-muted-foreground text-xs">{o.date}</td>
                  <td className="p-4 text-center"><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
