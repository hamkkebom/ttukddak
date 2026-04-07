"use client";

import { useState } from "react";
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

const orders = [
  {
    id: "ORD-2487", client: "김의뢰", clientImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=c1",
    service: "AI 프리미엄 뮤직비디오", pkg: "스탠다드", amount: 270000, status: "작업중",
    date: "2024-03-15", deadline: "2024-03-25", progress: 60,
    requirements: "30초 제품 소개 영상, 시네마틱 느낌, 따뜻한 색감",
  },
  {
    id: "ORD-2486", client: "박고객", clientImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=c2",
    service: "Runway 시네마틱 영상", pkg: "프리미엄", amount: 630000, status: "검수 대기",
    date: "2024-03-14", deadline: "2024-03-28", progress: 90,
    requirements: "1분 브랜드 영상, 4K, AI + 실사 믹스",
  },
  {
    id: "ORD-2485", client: "최신규", clientImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=c3",
    service: "AI 프리미엄 뮤직비디오", pkg: "베이직", amount: 135000, status: "요구사항 확인",
    date: "2024-03-18", deadline: "2024-03-25", progress: 10,
    requirements: "아직 상세 요구사항 미전달",
  },
  {
    id: "ORD-2480", client: "오만족", clientImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=c4",
    service: "AI 프리미엄 뮤직비디오", pkg: "스탠다드", amount: 270000, status: "완료",
    date: "2024-03-05", deadline: "2024-03-15", progress: 100,
    requirements: "유튜브 인트로 영상 30초",
  },
];

const statusColors: Record<string, string> = {
  "요구사항 확인": "bg-purple-100 text-purple-700",
  "작업중": "bg-blue-100 text-blue-700",
  "검수 대기": "bg-amber-100 text-amber-700",
  "수정 요청": "bg-red-100 text-red-700",
  "완료": "bg-green-100 text-green-700",
};

export default function DashboardOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(orders[0].id);
  const fmt = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

  const filtered = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);
  const selected = orders.find((o) => o.id === selectedOrder);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <p className="text-muted-foreground text-sm">내 서비스 주문 현황</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "요구사항 확인", count: orders.filter((o) => o.status === "요구사항 확인").length, icon: FileText, color: "text-purple-600" },
          { label: "작업중", count: orders.filter((o) => o.status === "작업중").length, icon: Package, color: "text-blue-600" },
          { label: "검수 대기", count: orders.filter((o) => o.status === "검수 대기").length, icon: Eye, color: "text-amber-600" },
          { label: "완료", count: orders.filter((o) => o.status === "완료").length, icon: CheckCircle, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(s.label === statusFilter ? "all" : s.label)}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-6" style={{ minHeight: "500px" }}>
        {/* Order List */}
        <div className="lg:col-span-2 space-y-2">
          {filtered.map((order) => (
            <Card
              key={order.id}
              className={cn("cursor-pointer transition-all hover:shadow-md", selectedOrder === order.id && "ring-2 ring-primary")}
              onClick={() => setSelectedOrder(order.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className={statusColors[order.status]}>{order.status}</Badge>
                  <span className="font-mono text-[10px] text-muted-foreground">{order.id}</span>
                </div>
                <p className="font-medium text-sm truncate">{order.service}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={order.clientImg} />
                      <AvatarFallback className="text-[8px]">{order.client[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{order.client}</span>
                  </div>
                  <span className="text-xs font-medium">{fmt(order.amount)}원</span>
                </div>
                {/* Progress */}
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary rounded-full h-1.5" style={{ width: `${order.progress}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Detail */}
        <Card className="lg:col-span-3">
          {selected ? (
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={statusColors[selected.status]}>{selected.status}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
                  </div>
                  <h2 className="text-lg font-bold">{selected.service}</h2>
                  <p className="text-sm text-muted-foreground">{selected.pkg} 패키지</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{fmt(selected.amount)}원</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end mt-1">
                    <Calendar className="h-3 w-3" /> 납기: {selected.deadline}
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Client Info */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selected.clientImg} />
                    <AvatarFallback>{selected.client[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selected.client}</p>
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
                <div className="p-4 bg-muted/50 rounded-lg text-sm">{selected.requirements}</div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">진행률</h3>
                  <span className="text-sm font-medium">{selected.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${selected.progress}%` }} />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {selected.status === "작업중" && (
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
                {selected.status === "요구사항 확인" && (
                  <Button className="w-full" onClick={() => toast.success("작업이 시작되었습니다")}>
                    <Package className="h-4 w-4 mr-2" /> 작업 시작하기
                  </Button>
                )}
                {selected.status === "검수 대기" && (
                  <div className="p-4 bg-amber-50 rounded-lg text-sm text-amber-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    고객이 검수 중입니다. 수정 요청이 오면 알려드립니다.
                  </div>
                )}
                {selected.status !== "완료" && (
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" /> 최종 납품물 업로드
                  </Button>
                )}
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-6 flex items-center justify-center h-full text-muted-foreground">
              주문을 선택해주세요
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
