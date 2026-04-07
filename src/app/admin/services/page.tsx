"use client";

import { useState } from "react";
import { Search, Eye, CheckCircle, XCircle, MoreVertical, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { services } from "@/data/services";
import { getExpertById } from "@/data/experts";
import { getCategoryById } from "@/data/categories";

const serviceStatuses = [
  { id: "svc-1", status: "활성" as const },
  { id: "svc-2", status: "활성" as const },
  { id: "svc-3", status: "활성" as const },
  { id: "svc-4", status: "승인대기" as const },
  { id: "svc-5", status: "활성" as const },
  { id: "svc-6", status: "활성" as const },
  { id: "svc-7", status: "신고접수" as const },
  { id: "svc-8", status: "활성" as const },
  { id: "svc-9", status: "승인대기" as const },
  { id: "svc-10", status: "활성" as const },
  { id: "svc-11", status: "활성" as const },
  { id: "svc-12", status: "비활성" as const },
];

type ServiceStatus = "활성" | "승인대기" | "비활성" | "신고접수";

const statusColors: Record<ServiceStatus, string> = {
  "활성": "bg-green-100 text-green-700",
  "승인대기": "bg-amber-100 text-amber-700",
  "비활성": "bg-slate-100 text-slate-700",
  "신고접수": "bg-red-100 text-red-700",
};

export default function AdminServicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const enriched = services.map((s) => ({
    ...s,
    expert: getExpertById(s.expertId),
    category: getCategoryById(s.categoryId),
    adminStatus: (serviceStatuses.find((ss) => ss.id === s.id)?.status || "활성") as ServiceStatus,
  }));

  const filtered = enriched.filter((s) => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.adminStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">서비스 관리</h1>
        <p className="text-muted-foreground text-sm">총 {services.length}개 서비스</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "활성", count: enriched.filter((s) => s.adminStatus === "활성").length, color: "text-green-600" },
          { label: "승인대기", count: enriched.filter((s) => s.adminStatus === "승인대기").length, color: "text-amber-600" },
          { label: "신고접수", count: enriched.filter((s) => s.adminStatus === "신고접수").length, color: "text-red-600" },
          { label: "비활성", count: enriched.filter((s) => s.adminStatus === "비활성").length, color: "text-slate-500" },
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
              <SelectItem value="신고접수">신고접수</SelectItem>
              <SelectItem value="비활성">비활성</SelectItem>
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
                  <th className="text-left p-4 font-medium">전문가</th>
                  <th className="text-left p-4 font-medium">카테고리</th>
                  <th className="text-right p-4 font-medium">가격</th>
                  <th className="text-right p-4 font-medium">판매</th>
                  <th className="text-center p-4 font-medium">상태</th>
                  <th className="text-center p-4 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((svc) => (
                  <tr key={svc.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 max-w-[250px]">
                      <p className="font-medium truncate">{svc.title}</p>
                      <p className="text-xs text-muted-foreground">{svc.id}</p>
                    </td>
                    <td className="p-4 text-muted-foreground">{svc.expert?.name}</td>
                    <td className="p-4"><Badge variant="secondary" className="text-xs">{svc.category?.name}</Badge></td>
                    <td className="p-4 text-right">{fmt(svc.price)}원</td>
                    <td className="p-4 text-right">{svc.salesCount}건</td>
                    <td className="p-4 text-center">
                      <Badge variant="secondary" className={statusColors[svc.adminStatus]}>{svc.adminStatus}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {svc.adminStatus === "승인대기" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600"><CheckCircle className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><XCircle className="h-4 w-4" /></Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
