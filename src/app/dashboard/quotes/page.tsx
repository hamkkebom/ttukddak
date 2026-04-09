"use client";

import { useEffect, useState } from "react";
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
import { getQuoteRequestsClient } from "@/lib/db-client";
import type { QuoteRequest } from "@/types";

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  matched: "bg-blue-100 text-blue-700",
  closed: "bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  open: "신규",
  matched: "견적 발송",
  closed: "마감",
};

export default function DashboardQuotesPage() {
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getQuoteRequestsClient();
        setQuoteRequests(data);
        if (data.length > 0) setSelectedQuoteId(data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selected = quoteRequests.find((q) => q.id === selectedQuoteId);

  const handleSendQuote = async () => {
    if (!selectedQuoteId) return;
    if (!quoteAmount) { toast.error("견적 금액을 입력해주세요"); return; }
    if (!quoteMessage) { toast.error("견적 설명을 입력해주세요"); return; }
    if (!estimatedDays) { toast.error("작업 예상 기간을 입력해주세요"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/quote-requests/${selectedQuoteId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(quoteAmount),
          message: quoteMessage,
          estimatedDays: Number(estimatedDays),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "견적 전송에 실패했습니다");
        return;
      }

      toast.success("견적이 전송되었습니다!", { description: "고객에게 견적을 성공적으로 보냈습니다." });
      setQuoteAmount("");
      setQuoteMessage("");
      setEstimatedDays("");

      // Refresh list and mark the request as matched
      setQuoteRequests((prev) =>
        prev.map((q) =>
          q.id === selectedQuoteId ? { ...q, status: "matched" as const } : q
        )
      );
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const formatBudget = (q: QuoteRequest) => {
    if (q.budgetMin && q.budgetMax) {
      return `${new Intl.NumberFormat("ko-KR").format(q.budgetMin)}~${new Intl.NumberFormat("ko-KR").format(q.budgetMax)}원`;
    }
    if (q.budgetMin) return `${new Intl.NumberFormat("ko-KR").format(q.budgetMin)}원 이상`;
    if (q.budgetMax) return `${new Intl.NumberFormat("ko-KR").format(q.budgetMax)}원 이하`;
    return "미정";
  };

  const getStatusLabel = (status: string) => STATUS_LABEL[status] || status;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">견적 요청</h1>
        <p className="text-muted-foreground text-sm">
          고객이 보낸 견적 요청 {quoteRequests.filter((q) => q.status === "open").length}건 대기 중
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6" style={{ minHeight: "600px" }}>
        {/* List */}
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">불러오는 중...</p>
          ) : quoteRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">견적 요청이 없습니다</p>
          ) : (
            quoteRequests.map((q) => (
              <Card
                key={q.id}
                className={cn("cursor-pointer transition-all hover:shadow-md", selectedQuoteId === q.id && "ring-2 ring-primary")}
                onClick={() => setSelectedQuoteId(q.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className={statusColors[q.status] || ""}>{getStatusLabel(q.status)}</Badge>
                    <span className="text-[10px] text-muted-foreground">{q.createdAt.split("T")[0]}</span>
                  </div>
                  <p className="font-medium text-sm truncate mb-1">{q.title}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={q.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${q.userId}`} />
                        <AvatarFallback className="text-[8px]">{(q.userName || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{q.userName || "의뢰인"}</span>
                    </div>
                    <span className="text-xs font-medium">{formatBudget(q)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail */}
        <Card className="lg:col-span-3 flex flex-col">
          {selected ? (
            <CardContent className="p-6 flex flex-col h-full">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className={statusColors[selected.status] || ""}>{getStatusLabel(selected.status)}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">{selected.id.slice(0, 8)}</span>
                  {selected.category && (
                    <Badge variant="outline" className="text-xs">{selected.category}</Badge>
                  )}
                </div>
                <h2 className="text-lg font-bold">{selected.title}</h2>
              </div>

              {/* Client */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selected.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selected.userId}`} />
                    <AvatarFallback>{(selected.userName || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selected.userName || "의뢰인"}</p>
                    <p className="text-xs text-muted-foreground">의뢰인</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/messages"><MessageCircle className="h-4 w-4 mr-1" /> 대화</Link>
                </Button>
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6 flex-1">
                {selected.description && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">프로젝트 설명</h3>
                    <div className="p-4 bg-muted/50 rounded-lg text-sm">{selected.description}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">예산</p>
                    <p className="text-sm font-medium">{formatBudget(selected)}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">납기</p>
                    <p className="text-sm font-medium">{selected.deadline || "미정"}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <MessageCircle className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">카테고리</p>
                    <p className="text-sm font-medium">{selected.category || "미분류"}</p>
                  </div>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Quote Form */}
              {selected.status === "open" && (
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
                        disabled={submitting}
                      />
                    </div>
                    <div className="relative w-36">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="작업 기간 (일)"
                        value={estimatedDays}
                        onChange={(e) => setEstimatedDays(e.target.value)}
                        className="pl-9"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <textarea
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    placeholder="견적 설명 (작업 범위, 포함 사항, 일정 등)"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    disabled={submitting}
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleSendQuote} disabled={submitting}>
                      <Send className="h-4 w-4 mr-1" /> {submitting ? "전송 중..." : "견적 보내기"}
                    </Button>
                  </div>
                </div>
              )}
              {selected.status === "matched" && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  견적을 이미 전송했습니다. 고객의 응답을 기다리고 있습니다.
                </div>
              )}
            </CardContent>
          ) : (
            <CardContent className="p-6 flex items-center justify-center h-full text-muted-foreground">
              {loading ? "불러오는 중..." : "견적 요청을 선택해주세요"}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
