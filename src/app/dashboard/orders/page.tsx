"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search, Upload, MessageCircle, CheckCircle, Clock, Eye,
  FileText, Package, Calendar, ChevronRight, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getOrdersClient } from "@/lib/db-client";
import type { Order } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  pending: "요구사항 확인",
  paid: "요구사항 확인",
  in_progress: "작업중",
  review: "검수 대기",
  completed: "완료",
  cancelled: "취소",
  refunded: "환불",
};

const statusColors: Record<string, string> = {
  "요구사항 확인": "bg-purple-100 text-purple-700",
  "작업중": "bg-blue-100 text-blue-700",
  "검수 대기": "bg-amber-100 text-amber-700",
  "수정 요청": "bg-red-100 text-red-700",
  "완료": "bg-green-100 text-green-700",
  "취소": "bg-slate-100 text-slate-700",
  "환불": "bg-red-100 text-red-700",
};

const PROGRESS_BY_STATUS: Record<string, number> = {
  pending: 10, paid: 15, in_progress: 60, review: 90, completed: 100, cancelled: 0, refunded: 0,
};

export default function DashboardOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  useEffect(() => {
    async function load() {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        const data = await getOrdersClient({ expertId: user.id });
        setOrders(data);
        if (data.length > 0) setSelectedOrderId(data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getLabel = (status: string) => STATUS_LABEL[status] || status;

  const filtered = orders.filter((o) => {
    if (statusFilter === "all") return true;
    return getLabel(o.status) === statusFilter;
  });

  const selected = orders.find((o) => o.id === selectedOrderId);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Order["status"] } : o));
      toast.success("상태가 변경되었습니다");
    } catch {
      toast.error("상태 변경에 실패했습니다");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <p className="text-muted-foreground text-sm">내 서비스 주문 현황</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "요구사항 확인", count: orders.filter((o) => getLabel(o.status) === "요구사항 확인").length, icon: FileText, color: "text-purple-600" },
          { label: "작업중", count: orders.filter((o) => getLabel(o.status) === "작업중").length, icon: Package, color: "text-blue-600" },
          { label: "검수 대기", count: orders.filter((o) => getLabel(o.status) === "검수 대기").length, icon: Eye, color: "text-amber-600" },
          { label: "완료", count: orders.filter((o) => getLabel(o.status) === "완료").length, icon: CheckCircle, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(s.label === statusFilter ? "all" : s.label)}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{loading ? "-" : s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-6" style={{ minHeight: "500px" }}>
        {/* Order List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">주문이 없습니다</p>
          ) : (
            filtered.map((order) => {
              const label = getLabel(order.status);
              const color = statusColors[label] || "bg-gray-100 text-gray-700";
              const progress = PROGRESS_BY_STATUS[order.status] || 0;
              return (
                <Card
                  key={order.id}
                  className={cn("cursor-pointer transition-all hover:shadow-md", selectedOrderId === order.id && "ring-2 ring-primary")}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className={color}>{label}</Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">{order.id.slice(0, 8)}</span>
                    </div>
                    <p className="font-medium text-sm truncate">{order.serviceName || "서비스"}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={order.buyerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.buyerName}`} />
                          <AvatarFallback className="text-[8px]">{(order.buyerName || "?")[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{order.buyerName || "의뢰인"}</span>
                      </div>
                      <span className="text-xs font-medium">{fmt(order.price)}원</span>
                    </div>
                    {/* Progress */}
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-primary rounded-full h-1.5" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Order Detail */}
        <Card className="lg:col-span-3">
          {selected ? (
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={statusColors[getLabel(selected.status)] || ""}>{getLabel(selected.status)}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{selected.id.slice(0, 8)}</span>
                  </div>
                  <h2 className="text-lg font-bold">{selected.serviceName || "서비스"}</h2>
                  <p className="text-sm text-muted-foreground">{selected.packageName} 패키지</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{fmt(selected.price)}원</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end mt-1">
                    <Calendar className="h-3 w-3" /> 납기: {selected.createdAt.split("T")[0]}
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Client Info */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selected.buyerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selected.buyerName}`} />
                    <AvatarFallback>{(selected.buyerName || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selected.buyerName || "의뢰인"}</p>
                    <p className="text-xs text-muted-foreground">의뢰인</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/messages"><MessageCircle className="h-4 w-4 mr-1" /> 메시지</Link>
                </Button>
              </div>

              {/* Requirements */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2">요구사항</h3>
                <div className="p-4 bg-muted/50 rounded-lg text-sm">
                  {selected.requirements || "아직 상세 요구사항 미전달"}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">진행률</h3>
                  <span className="text-sm font-medium">{PROGRESS_BY_STATUS[selected.status] || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${PROGRESS_BY_STATUS[selected.status] || 0}%` }} />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {(selected.status === "in_progress") && (
                  <>
                    <input
                      type="file"
                      id="draft-upload"
                      className="hidden"
                      accept="video/*,image/*,.zip,.pdf"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          toast.success(`${e.target.files[0].name} 업로드 준비 완료`, { description: "Supabase Storage에 업로드됩니다." });
                        }
                      }}
                    />
                    <Button className="w-full" onClick={() => document.getElementById("draft-upload")?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> 시안 전달하기
                    </Button>
                  </>
                )}
                {(selected.status === "pending" || selected.status === "paid") && (
                  <Button className="w-full" onClick={() => handleStatusChange(selected.id, "in_progress")}>
                    <Package className="h-4 w-4 mr-2" /> 작업 시작하기
                  </Button>
                )}
                {selected.status === "review" && (
                  <div className="p-4 bg-amber-50 rounded-lg text-sm text-amber-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    고객이 검수 중입니다. 수정 요청이 오면 알려드립니다.
                  </div>
                )}
                {selected.status !== "completed" && selected.status !== "cancelled" && selected.status !== "refunded" && (
                  <Button variant="outline" className="w-full" onClick={() => handleStatusChange(selected.id, "review")}>
                    <Upload className="h-4 w-4 mr-2" /> 최종 납품물 업로드
                  </Button>
                )}
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-6 flex items-center justify-center h-full text-muted-foreground">
              {loading ? "불러오는 중..." : "주문을 선택해주세요"}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
