"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, CheckCircle, FileText, Upload,
  MessageCircle, Star, Package, CreditCard, Eye, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getOrderByIdClient, getServiceByIdClient, getExpertByIdClient } from "@/lib/db-client";
import type { Order, Service, Expert } from "@/types";
import { toast } from "sonner";

interface OrderDelivery {
  id: string;
  order_id: string;
  expert_id: string;
  message: string;
  files: string[];
  version: number;
  created_at: string;
}

function getOrderSteps(status: string) {
  const statusMap: Record<string, number> = {
    pending: 0, paid: 1, in_progress: 3, review: 4, completed: 7,
  };
  const currentStep = statusMap[status] ?? 0;

  const steps = [
    { id: 1, label: "결제 완료", icon: CreditCard },
    { id: 2, label: "요구사항 전달", icon: FileText },
    { id: 3, label: "작업 시작", icon: Package },
    { id: 4, label: "중간 시안 전달", icon: Eye },
    { id: 5, label: "수정 반영", icon: Upload },
    { id: 6, label: "최종 납품", icon: CheckCircle },
    { id: 7, label: "구매 확정", icon: Star },
  ];

  return steps.map((s) => ({
    ...s,
    status: s.id < currentStep ? "completed" as const
      : s.id === currentStep ? "current" as const
      : "upcoming" as const,
    date: "",
  }));
}

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<OrderDelivery[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");

  useEffect(() => {
    getOrderByIdClient(id).then(async (o) => {
      if (o) {
        setOrder(o);
        const [svc, exp] = await Promise.all([
          getServiceByIdClient(o.serviceId),
          getExpertByIdClient(o.expertId),
        ]);
        setService(svc);
        setExpert(exp);
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    fetch(`/api/orders/${id}/deliveries`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setDeliveries(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [id]);

  async function handleConfirm() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}/confirm`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "구매 확정에 실패했습니다");
        return;
      }
      toast.success("구매가 확정되었습니다");
      router.push(`/order/${id}/review`);
    } catch {
      toast.error("오류가 발생했습니다");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevision() {
    if (!revisionReason.trim()) {
      toast.error("수정 요청 사유를 입력해주세요");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}/revision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revisionReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "수정 요청에 실패했습니다");
        return;
      }
      toast.success("수정 요청이 전달되었습니다");
      setShowRevisionModal(false);
      setRevisionReason("");
      setOrder((prev) => prev ? { ...prev, status: "in_progress" } : prev);
    } catch {
      toast.error("오류가 발생했습니다");
    } finally {
      setActionLoading(false);
    }
  }

  const orderSteps = getOrderSteps(order?.status || "pending");
  const currentStepIndex = orderSteps.findIndex((s) => s.status === "current");
  const progressPercent = currentStepIndex >= 0 ? Math.round((currentStepIndex / (orderSteps.length - 1)) * 100) : 0;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">로딩 중...</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Breadcrumb */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/mypage" className="text-muted-foreground hover:text-foreground">마이페이지</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">주문 상태</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">주문 상태 추적</h1>
          <p className="text-muted-foreground mb-8">주문번호: {id}</p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main: Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold">진행률</h2>
                    <Badge variant="secondary">{progressPercent}%</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 mb-2">
                    <div
                      className="bg-primary rounded-full h-3 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    현재 단계: {orderSteps[currentStepIndex]?.label}
                  </p>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader><CardTitle className="text-base">주문 타임라인</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {orderSteps.map((step, i) => (
                      <div key={step.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all",
                            step.status === "completed" && "bg-green-500 border-green-500 text-white",
                            step.status === "current" && "bg-primary border-primary text-primary-foreground",
                            step.status === "upcoming" && "border-muted-foreground/30 text-muted-foreground"
                          )}>
                            {step.status === "completed" ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <step.icon className="h-5 w-5" />
                            )}
                          </div>
                          {i < orderSteps.length - 1 && (
                            <div className={cn(
                              "w-0.5 h-12",
                              step.status === "completed" ? "bg-green-500" : "bg-muted-foreground/20"
                            )} />
                          )}
                        </div>
                        <div className="pb-8">
                          <p className={cn(
                            "font-medium text-sm",
                            step.status === "upcoming" && "text-muted-foreground"
                          )}>
                            {step.label}
                          </p>
                          {step.date && (
                            <p className="text-xs text-muted-foreground mt-0.5">{step.date}</p>
                          )}
                          {step.status === "current" && (
                            <Badge className="mt-2 text-xs" variant="secondary">진행중</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Deliveries */}
              <Card>
                <CardHeader><CardTitle className="text-base">납품물</CardTitle></CardHeader>
                <CardContent>
                  {deliveries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      아직 납품물이 없습니다
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {deliveries.map((delivery) => (
                        <div key={delivery.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">버전 {delivery.version}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(delivery.created_at).toLocaleString("ko-KR")}
                            </span>
                          </div>
                          {delivery.message && (
                            <p className="text-sm">{delivery.message}</p>
                          )}
                          {delivery.files && delivery.files.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground font-medium">첨부 파일</p>
                              {delivery.files.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Download className="h-3 w-3" />
                                  {url.split("/").pop() || `파일 ${i + 1}`}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {order?.status === "delivered" && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={handleConfirm}
                        disabled={actionLoading}
                      >
                        구매 확정
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowRevisionModal(true)}
                        disabled={actionLoading}
                      >
                        수정 요청
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revision Request Modal */}
              {showRevisionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-background rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4">
                    <h3 className="font-semibold text-lg">수정 요청</h3>
                    <p className="text-sm text-muted-foreground">수정이 필요한 사항을 구체적으로 설명해주세요.</p>
                    <textarea
                      className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={5}
                      placeholder="수정 요청 사유를 입력하세요"
                      value={revisionReason}
                      onChange={(e) => setRevisionReason(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => { setShowRevisionModal(false); setRevisionReason(""); }}
                        disabled={actionLoading}
                      >
                        취소
                      </Button>
                      <Button onClick={handleRevision} disabled={actionLoading}>
                        수정 요청 전송
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Expert */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={expert?.profileImage} />
                      <AvatarFallback>{expert?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{expert?.name || "전문가"}</p>
                      <p className="text-xs text-muted-foreground">{expert?.title || ""}</p>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/messages?order=${id}`}>
                      <MessageCircle className="h-4 w-4 mr-2" /> 메시지 보내기
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader><CardTitle className="text-sm">주문 정보</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">서비스</span>
                    <span className="font-medium text-right text-xs max-w-[140px] truncate">{service?.title || order?.serviceName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">패키지</span>
                    <span className="font-medium">{order?.packageName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">결제 금액</span>
                    <span className="font-medium">{order ? new Intl.NumberFormat("ko-KR").format(order.price) + "원" : "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">주문일</span>
                    <span className="font-medium">{order?.createdAt?.split("T")[0] || "-"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">납품 횟수</span>
                    <Badge variant="secondary">{deliveries.length}회</Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={handleConfirm}
                  disabled={actionLoading || order?.status !== "delivered"}
                >
                  구매 확정 & 리뷰 작성
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => setShowRevisionModal(true)}
                  disabled={actionLoading || order?.status !== "delivered"}
                >
                  수정 요청
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
