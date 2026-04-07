"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FileText, MessageCircle, Clock, DollarSign, Calendar,
  ChevronRight, Send, Eye, X, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const quoteRequests = [
  {
    id: "QR-101", client: "김의뢰", clientImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=qr1",
    title: "AI 기반 30초 제품 소개 영상", category: "AI 영상 생성",
    description: "자사 스킨케어 제품의 30초 소개 영상을 AI 도구로 제작하고 싶습니다. 시네마틱한 느낌에 고급스러운 색감을 원합니다. 참고 영상 있습니다.",
    budget: "50~100만원", deadline: "2주 이내", contactMethod: "플랫폼 메시지",
    status: "신규", date: "2024-03-18 14:30", referenceLinks: ["https://youtube.com/watch?v=example"],
  },
  {
    id: "QR-100", client: "박고객", clientImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=qr2",
    title: "유튜브 채널 인트로 영상 제작", category: "AI 영상 생성",
    description: "기술 리뷰 유튜브 채널 인트로 5~10초 영상을 만들고 싶습니다. 미래적이고 테크한 느낌으로요.",
    budget: "50만원 미만", deadline: "1주일 이내", contactMethod: "모두 가능",
    status: "견적 발송", date: "2024-03-17 10:00", referenceLinks: [],
  },
  {
    id: "QR-099", client: "최신규", clientImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=qr3",
    title: "기업 IR 발표용 1분 영상", category: "AI 영상 생성",
    description: "투자 유치를 위한 기업 소개 영상 1분 분량. 데이터 시각화와 인포그래픽 포함. 프로페셔널한 톤 필요.",
    budget: "100~300만원", deadline: "1개월 이내", contactMethod: "전화 상담",
    status: "대화중", date: "2024-03-15 09:00", referenceLinks: [],
  },
];

const statusColors: Record<string, string> = {
  "신규": "bg-red-100 text-red-700",
  "견적 발송": "bg-blue-100 text-blue-700",
  "대화중": "bg-amber-100 text-amber-700",
  "성사": "bg-green-100 text-green-700",
  "거절": "bg-slate-100 text-slate-700",
};

export default function DashboardQuotesPage() {
  const [selectedQuote, setSelectedQuote] = useState<string | null>(quoteRequests[0].id);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");

  const selected = quoteRequests.find((q) => q.id === selectedQuote);

  const handleSendQuote = () => {
    if (!quoteAmount) { toast.error("견적 금액을 입력해주세요"); return; }
    toast.success("견적이 전송되었습니다!", { description: `${selected?.client}님에게 견적을 보냈습니다.` });
    setQuoteAmount("");
    setQuoteMessage("");
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">견적 요청</h1>
        <p className="text-muted-foreground text-sm">
          고객이 보낸 견적 요청 {quoteRequests.filter((q) => q.status === "신규").length}건 대기 중
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6" style={{ minHeight: "600px" }}>
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {quoteRequests.map((q) => (
            <Card
              key={q.id}
              className={cn("cursor-pointer transition-all hover:shadow-md", selectedQuote === q.id && "ring-2 ring-primary")}
              onClick={() => setSelectedQuote(q.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className={statusColors[q.status]}>{q.status}</Badge>
                  <span className="text-[10px] text-muted-foreground">{q.date}</span>
                </div>
                <p className="font-medium text-sm truncate mb-1">{q.title}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={q.clientImg} />
                      <AvatarFallback className="text-[8px]">{q.client[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{q.client}</span>
                  </div>
                  <span className="text-xs font-medium">{q.budget}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail */}
        <Card className="lg:col-span-3 flex flex-col">
          {selected ? (
            <CardContent className="p-6 flex flex-col h-full">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className={statusColors[selected.status]}>{selected.status}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
                  <Badge variant="outline" className="text-xs">{selected.category}</Badge>
                </div>
                <h2 className="text-lg font-bold">{selected.title}</h2>
              </div>

              {/* Client */}
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
                  <Link href="/messages"><MessageCircle className="h-4 w-4 mr-1" /> 대화</Link>
                </Button>
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6 flex-1">
                <div>
                  <h3 className="text-sm font-semibold mb-2">프로젝트 설명</h3>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm">{selected.description}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">예산</p>
                    <p className="text-sm font-medium">{selected.budget}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">납기</p>
                    <p className="text-sm font-medium">{selected.deadline}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <MessageCircle className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">연락방법</p>
                    <p className="text-sm font-medium">{selected.contactMethod}</p>
                  </div>
                </div>

                {selected.referenceLinks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">참고 자료</h3>
                    {selected.referenceLinks.map((link, i) => (
                      <p key={i} className="text-sm text-primary truncate">{link}</p>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="mb-4" />

              {/* Quote Form */}
              {selected.status === "신규" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">견적 보내기</h3>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="견적 금액 (원)"
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <textarea
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    placeholder="견적 설명 (작업 범위, 포함 사항, 일정 등)"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <X className="h-4 w-4 mr-1" /> 거절
                    </Button>
                    <Button className="flex-1" onClick={handleSendQuote}>
                      <Send className="h-4 w-4 mr-1" /> 견적 보내기
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          ) : (
            <CardContent className="p-6 flex items-center justify-center h-full text-muted-foreground">
              견적 요청을 선택해주세요
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
