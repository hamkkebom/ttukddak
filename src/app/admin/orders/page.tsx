"use client";

import { useState, useEffect } from "react";
import { Search, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getOrdersClient } from "@/lib/db-client";
import type { Order } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700",
  paid: "bg-blue-100 text-blue-700",
  in_progress: "bg-cyan-100 text-cyan-700",
  review: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-slate-100 text-slate-700",
  refunded: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  pending: "결제완료",
  paid: "결제완료",
  in_progress: "진행중",
  review: "검수중",
  completed: "완료",
  cancelled: "취소",
  refunded: "환불완료",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const handleUpdateStatus = async (orderId: string, status: Order["status"], label: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      toast.success(`주문 상태가 "${label}"(으)로 변경되었습니다`);
    } else {
      toast.error("상태 변경에 실패했습니다");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("이 주문을 취소하시겠습니까?")) return;
    const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
      toast.success("주문이 취소되었습니다");
    } else {
      toast.error("취소에 실패했습니다");
    }
  };

  useEffect(() => {
    getOrdersClient().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.id.includes(search) || (o.buyerName || "").includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((s, o) => s + o.price, 0);
  const totalFee = Math.round(totalAmount * 0.1);

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
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <p className="text-muted-foreground text-sm">총 {orders.length}건</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "총 거래액", value: `${fmt(totalAmount)}원` },
          { label: "총 수수료", value: `${fmt(totalFee)}원` },
          { label: "진행중", value: `${orders.filter((o) => ["pending", "paid", "in_progress", "review"].includes(o.status)).length}건` },
          { label: "환불요청", value: `${orders.filter((o) => o.status === "refunded").length}건` },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4 text-center"><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="주문번호, 구매자 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="paid">결제완료</SelectItem>
              <SelectItem value="in_progress">진행중</SelectItem>
              <SelectItem value="review">검수중</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="refunded">환불</SelectItem>
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
              <th className="text-left p-4 font-medium">서비스</th>
              <th className="text-left p-4 font-medium">패키지</th>
              <th className="text-right p-4 font-medium">금액</th>
              <th className="text-right p-4 font-medium">수수료</th>
              <th className="text-center p-4 font-medium">상태</th>
              <th className="text-left p-4 font-medium">주문일</th>
              <th className="text-center p-4 font-medium">관리</th>
            </tr></thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="p-4">{o.buyerName || o.buyerId.slice(0, 8)}</td>
                  <td className="p-4 max-w-[150px] truncate">{o.serviceName || "-"}</td>
                  <td className="p-4 text-muted-foreground">{o.packageName || "-"}</td>
                  <td className="p-4 text-right font-medium">{fmt(o.price)}</td>
                  <td className="p-4 text-right text-muted-foreground">{fmt(Math.round(o.price * 0.1))}</td>
                  <td className="p-4 text-center"><Badge variant="secondary" className={statusColors[o.status] || ""}>{statusLabels[o.status] || o.status}</Badge></td>
                  <td className="p-4 text-muted-foreground text-xs">{o.createdAt?.split("T")[0] || "-"}</td>
                  <td className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateStatus(o.id, "in_progress", "진행중")}>진행중으로 변경</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(o.id, "review", "검수중")}>검수중으로 변경</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(o.id, "completed", "완료")}>완료 처리</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleCancelOrder(o.id)}>주문 취소</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
