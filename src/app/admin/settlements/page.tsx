"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, DollarSign, CheckCircle, Clock, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Settlement } from "@/types";

const statusColors: Record<Settlement["status"], string> = {
  completed: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  held: "bg-red-100 text-red-700",
};

const statusLabels: Record<Settlement["status"], string> = {
  completed: "정산완료",
  scheduled: "정산예정",
  pending: "대기중",
  held: "정산보류",
};

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Settlement["status"] | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settlements");
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setSettlements(json.data ?? []);
    } catch {
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleStatusChange = async (settlementId: string, newStatus: Settlement["status"]) => {
    setUpdating(settlementId);
    try {
      const completedDate = newStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined;
      const res = await fetch("/api/admin/settlements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlementId, status: newStatus, completedDate }),
      });
      if (res.ok) {
        setSettlements((prev) =>
          prev.map((s) =>
            s.id === settlementId
              ? { ...s, status: newStatus, completedDate }
              : s
          )
        );
      }
    } finally {
      setUpdating(null);
    }
  };

  const filtered = settlements.filter((s) => {
    const nameMatch = !search || (s.expertName ?? "").toLowerCase().includes(search.toLowerCase()) || (s.serviceName ?? "").toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || s.status === statusFilter;
    return nameMatch && statusMatch;
  });

  const totalCompleted = settlements.filter((s) => s.status === "completed").reduce((sum, s) => sum + s.settlementAmount, 0);
  const totalScheduled = settlements.filter((s) => s.status === "scheduled").reduce((sum, s) => sum + s.settlementAmount, 0);
  const totalFee = settlements.reduce((sum, s) => sum + s.feeAmount, 0);

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

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">정산 완료</span>
            </div>
            <p className="text-2xl font-bold">{fmt(totalCompleted)}원</p>
            <p className="text-xs text-muted-foreground mt-1">{settlements.filter((s) => s.status === "completed").length}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">정산 예정</span>
            </div>
            <p className="text-2xl font-bold">{fmt(totalScheduled)}원</p>
            <p className="text-xs text-muted-foreground mt-1">{settlements.filter((s) => s.status === "scheduled").length}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">누적 수수료</span>
            </div>
            <p className="text-2xl font-bold">{fmt(totalFee)}원</p>
            <p className="text-xs text-muted-foreground mt-1">플랫폼 수수료 10%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="전문가 또는 서비스 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "completed", "scheduled", "pending", "held"] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "전체" : statusLabels[s]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">정산 내역이 없습니다</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">주문 ID</th>
                  <th className="text-left p-4 font-medium">전문가</th>
                  <th className="text-left p-4 font-medium">서비스</th>
                  <th className="text-right p-4 font-medium">거래액</th>
                  <th className="text-right p-4 font-medium">수수료(10%)</th>
                  <th className="text-right p-4 font-medium">정산액</th>
                  <th className="text-center p-4 font-medium">상태</th>
                  <th className="text-left p-4 font-medium">정산예정일</th>
                  <th className="text-left p-4 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-mono text-xs text-muted-foreground">{s.orderId.slice(0, 8)}…</td>
                    <td className="p-4 font-medium">{s.expertName ?? s.expertId.slice(0, 8)}</td>
                    <td className="p-4 max-w-[180px] truncate text-muted-foreground text-xs">{s.serviceName ?? "-"}</td>
                    <td className="p-4 text-right">{fmt(s.orderAmount)}</td>
                    <td className="p-4 text-right text-muted-foreground">{fmt(s.feeAmount)}</td>
                    <td className="p-4 text-right font-medium">{fmt(s.settlementAmount)}</td>
                    <td className="p-4 text-center">
                      <Badge variant="secondary" className={statusColors[s.status]}>
                        {statusLabels[s.status]}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{s.scheduledDate ?? "-"}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {s.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            disabled={updating === s.id}
                            onClick={() => handleStatusChange(s.id, "completed")}
                          >
                            완료처리
                          </Button>
                        )}
                        {s.status !== "held" && s.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                            disabled={updating === s.id}
                            onClick={() => handleStatusChange(s.id, "held")}
                          >
                            보류
                          </Button>
                        )}
                        {s.status === "held" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 text-blue-600 border-blue-200 hover:bg-blue-50"
                            disabled={updating === s.id}
                            onClick={() => handleStatusChange(s.id, "scheduled")}
                          >
                            재개
                          </Button>
                        )}
                      </div>
                    </td>
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
