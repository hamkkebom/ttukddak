"use client";

import { use } from "react";
import Link from "next/link";
import {
  ChevronRight, CheckCircle, Clock, FileText, Upload,
  MessageCircle, Star, Package, CreditCard, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const orderSteps = [
  { id: 1, label: "결제 완료", icon: CreditCard, status: "completed" as const, date: "2024-03-15 14:30" },
  { id: 2, label: "요구사항 전달", icon: FileText, status: "completed" as const, date: "2024-03-15 15:00" },
  { id: 3, label: "작업 시작", icon: Package, status: "completed" as const, date: "2024-03-16 10:00" },
  { id: 4, label: "중간 시안 전달", icon: Eye, status: "current" as const, date: "예정: 2024-03-20" },
  { id: 5, label: "수정 반영", icon: Upload, status: "upcoming" as const, date: "" },
  { id: 6, label: "최종 납품", icon: CheckCircle, status: "upcoming" as const, date: "" },
  { id: 7, label: "구매 확정", icon: Star, status: "upcoming" as const, date: "" },
];

const deliveries = [
  {
    id: "del-1",
    type: "중간 시안",
    date: "2024-03-19",
    files: [
      { name: "중간시안_v1.mp4", size: "45.2 MB" },
      { name: "시안_설명.pdf", size: "1.2 MB" },
    ],
    message: "요청하신 방향으로 중간 시안 보내드립니다. 색감과 전반적인 느낌 확인 부탁드립니다.",
  },
];

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const currentStepIndex = orderSteps.findIndex((s) => s.status === "current");
  const progressPercent = Math.round(((currentStepIndex) / (orderSteps.length - 1)) * 100);

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
              {deliveries.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">납품물</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {deliveries.map((del) => (
                      <div key={del.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary">{del.type}</Badge>
                          <span className="text-xs text-muted-foreground">{del.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{del.message}</p>
                        <div className="space-y-2">
                          {del.files.map((file) => (
                            <div key={file.name} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-muted-foreground">{file.size}</span>
                              </div>
                              <Button variant="ghost" size="sm">다운로드</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Expert */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=expert1" />
                      <AvatarFallback>김</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">김영상</p>
                      <p className="text-xs text-muted-foreground">AI 영상 크리에이터</p>
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
                    <span className="font-medium text-right text-xs max-w-[140px] truncate">AI 프리미엄 뮤직비디오</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">패키지</span>
                    <span className="font-medium">스탠다드</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">결제 금액</span>
                    <span className="font-medium">315,000원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">예상 납기</span>
                    <span className="font-medium">2024-03-25</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">남은 수정</span>
                    <Badge variant="secondary">3회 중 3회</Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Button className="w-full" size="sm" asChild>
                  <Link href={`/order/${id}/review`}>구매 확정 & 리뷰 작성</Link>
                </Button>
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/messages">수정 요청</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
