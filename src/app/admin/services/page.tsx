"use client";

import { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, Trash2, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllServicesAdminClient } from "@/lib/db-client";
import { toast } from "sonner";
import type { Service } from "@/types";

type AdminStatus = "활성" | "승인대기" | "반려" | "정지" | "임시저장";

const DB_TO_ADMIN_STATUS: Record<string, AdminStatus> = {
  active: "활성",
  pending_review: "승인대기",
  rejected: "반려",
  suspended: "정지",
  draft: "임시저장",
};

const statusColors: Record<AdminStatus, string> = {
  "활성": "bg-green-100 text-green-700",
  "승인대기": "bg-amber-100 text-amber-700",
  "반려": "bg-red-100 text-red-700",
  "정지": "bg-slate-100 text-slate-700",
  "임시저장": "bg-blue-100 text-blue-700",
};

interface EnrichedService extends Service {
  adminStatus: AdminStatus;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<EnrichedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  useEffect(() => {
    getAllServicesAdminClient().then((data) => {
      const enriched: EnrichedService[] = data.map((s) => ({
        ...s,
        adminStatus: DB_TO_ADMIN_STATUS[s.status || "active"] || "활성",
      }));
      setServices(enriched);
      setLoading(false);
    });
  }, []);

  const handleApprove = async (svcId: string) => {
    const res = await fetch(`/api/admin/services/${svcId}/approve`, { method: "POST" });
    if (res.ok) {
      setServices((prev) => prev.map((s) => s.id === svcId ? { ...s, adminStatus: "활성", status: "active" } : s));
      toast.success("서비스가 승인되었습니다");
    } else {
      toast.error("승인에 실패했습니다");
    }
  };

  const openRejectDialog = (svcId: string) => {
    setRejectTargetId(svcId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectTargetId) return;
    setRejectSubmitting(true);
    const res = await fetch(`/api/admin/services/${rejectTargetId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setRejectSubmitting(false);
    if (res.ok) {
      setServices((prev) => prev.map((s) =>
        s.id === rejectTargetId
          ? { ...s, adminStatus: "반려", status: "rejected", rejectionReason: rejectReason }
          : s
      ));
      toast.success("서비스가 반려되었습니다");
      setRejectDialogOpen(false);
    } else {
      toast.error("반려 처리에 실패했습니다");
    }
  };

  const handleSuspend = async (svcId: string) => {
    const res = await fetch(`/api/services/${svcId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "suspended" }),
    });
    if (res.ok) {
      setServices((prev) => prev.map((s) => s.id === svcId ? { ...s, adminStatus: "정지", status: "suspended" } : s));
      toast.success("서비스가 정지되었습니다");
    } else {
      toast.error("정지 처리에 실패했습니다");
    }
  };

  const handleDeleteService = async (svcId: string) => {
    if (!confirm("이 서비스를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/services/${svcId}`, { method: "DELETE" });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== svcId));
      toast.success("서비스가 삭제되었습니다");
    } else {
      toast.error("삭제에 실패했습니다");
    }
  };

  const filtered = services.filter((s) => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.adminStatus === statusFilter;
    return matchSearch && matchStatus;
  });

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
        <h1 className="text-2xl font-bold">서비스 관리</h1>
        <p className="text-muted-foreground text-sm">총 {services.length}개 서비스</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: "활성", count: services.filter((s) => s.adminStatus === "활성").length, color: "text-green-600" },
          { label: "승인대기", count: services.filter((s) => s.adminStatus === "승인대기").length, color: "text-amber-600" },
          { label: "반려", count: services.filter((s) => s.adminStatus === "반려").length, color: "text-red-600" },
          { label: "정지", count: services.filter((s) => s.adminStatus === "정지").length, color: "text-slate-500" },
          { label: "임시저장", count: services.filter((s) => s.adminStatus === "임시저장").length, color: "text-blue-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4 flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="서비스명 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="활성">활성</SelectItem>
              <SelectItem value="승인대기">승인대기</SelectItem>
              <SelectItem value="반려">반려</SelectItem>
              <SelectItem value="정지">정지</SelectItem>
              <SelectItem value="임시저장">임시저장</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">서비스</th>
                  <th className="text-right p-4 font-medium">가격</th>
                  <th className="text-right p-4 font-medium">판매</th>
                  <th className="text-center p-4 font-medium">상태</th>
                  <th className="text-center p-4 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((svc) => (
                  <tr key={svc.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 max-w-[280px]">
                      <p className="font-medium truncate">{svc.title}</p>
                      <p className="text-xs text-muted-foreground">{svc.id.slice(0, 8)}</p>
                      {svc.adminStatus === "반려" && svc.rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">반려사유: {svc.rejectionReason}</p>
                      )}
                    </td>
                    <td className="p-4 text-right">{fmt(svc.price)}원</td>
                    <td className="p-4 text-right">{svc.salesCount}건</td>
                    <td className="p-4 text-center">
                      <Badge variant="secondary" className={statusColors[svc.adminStatus]}>{svc.adminStatus}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {svc.adminStatus === "승인대기" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600"
                              title="승인"
                              onClick={() => handleApprove(svc.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500"
                              title="반려"
                              onClick={() => openRejectDialog(svc.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {svc.adminStatus === "활성" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-amber-500"
                            title="정지"
                            onClick={() => handleSuspend(svc.id)}
                          >
                            <PauseCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500"
                          title="삭제"
                          onClick={() => handleDeleteService(svc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Modal */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setRejectDialogOpen(false)} />
          <div className="relative bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold mb-4">서비스 반려</h2>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1.5 block">반려 사유</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="전문가에게 전달할 반려 사유를 입력하세요"
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>취소</Button>
              <Button variant="destructive" onClick={handleRejectSubmit} disabled={rejectSubmitting}>
                {rejectSubmitting ? "처리 중..." : "반려하기"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
