"use client";

import { useState } from "react";
import { Search, MessageCircle, CheckCircle, Clock, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const tickets = [
  { id: "TK-501", user: "김의뢰", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=tk1", subject: "결제 후 서비스가 시작되지 않습니다", category: "주문", status: "대기", priority: "높음", date: "2024-03-18 14:30", messages: 2 },
  { id: "TK-500", user: "박고객", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=tk2", subject: "환불 절차가 궁금합니다", category: "환불", status: "대기", priority: "보통", date: "2024-03-18 11:20", messages: 1 },
  { id: "TK-499", user: "이모션", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert2", subject: "정산 지연 관련 문의", category: "정산", status: "처리중", priority: "높음", date: "2024-03-17 16:45", messages: 4 },
  { id: "TK-498", user: "최신규", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=tk4", subject: "서비스 신고 이후 처리 안내 요청", category: "신고", status: "처리중", priority: "보통", date: "2024-03-17 10:00", messages: 3 },
  { id: "TK-497", user: "한재주", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=tk5", subject: "회원 등급 변경 요청", category: "계정", status: "완료", priority: "낮음", date: "2024-03-16 09:15", messages: 5 },
  { id: "TK-496", user: "정감사", userImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=tk6", subject: "세금계산서 발행 요청", category: "결제", status: "완료", priority: "보통", date: "2024-03-15 14:00", messages: 2 },
];

const statusColors: Record<string, string> = { "대기": "bg-red-100 text-red-700", "처리중": "bg-amber-100 text-amber-700", "완료": "bg-green-100 text-green-700" };
const priorityColors: Record<string, string> = { "높음": "text-red-600", "보통": "text-amber-600", "낮음": "text-slate-500" };

export default function AdminSupportPage() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>("TK-501");
  const [reply, setReply] = useState("");
  const selected = tickets.find((t) => t.id === selectedTicket);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">고객문의 관리</h1>
        <p className="text-muted-foreground text-sm">
          미답변 {tickets.filter((t) => t.status === "대기").length}건
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6" style={{ height: "calc(100vh - 200px)" }}>
        {/* Ticket List */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardContent className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="문의 검색" className="pl-9 h-9" />
            </div>
          </CardContent>
          <div className="flex-1 overflow-y-auto">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket.id)}
                className={cn(
                  "w-full text-left p-4 border-b hover:bg-muted/50 transition-colors",
                  selectedTicket === ticket.id && "bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={statusColors[ticket.status] + " text-[10px]"}>{ticket.status}</Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">{ticket.id}</span>
                  </div>
                  <span className={`text-[10px] font-medium ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
                </div>
                <p className="font-medium text-sm truncate">{ticket.subject}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{ticket.user} · {ticket.category}</span>
                  <span className="text-[10px] text-muted-foreground">{ticket.messages}개 메시지</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Detail */}
        <Card className="lg:col-span-3 flex flex-col">
          {selected ? (
            <>
              <CardHeader className="border-b py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={statusColors[selected.status]}>{selected.status}</Badge>
                      <Badge variant="outline">{selected.category}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
                    </div>
                    <CardTitle className="text-base">{selected.subject}</CardTitle>
                  </div>
                  {selected.status !== "완료" && (
                    <Button variant="outline" size="sm">
                      <CheckCircle className="h-4 w-4 mr-1" /> 완료 처리
                    </Button>
                  )}
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Customer message */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={selected.userImg} />
                    <AvatarFallback>{selected.user[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{selected.user}</span>
                      <span className="text-[10px] text-muted-foreground">{selected.date}</span>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      안녕하세요, {selected.subject.toLowerCase()} 관련하여 문의드립니다.
                      빠른 답변 부탁드립니다.
                    </div>
                  </div>
                </div>

                {selected.status !== "대기" && (
                  <div className="flex gap-3 justify-end">
                    <div>
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-[10px] text-muted-foreground">답변</span>
                        <span className="text-sm font-medium">관리자</span>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-3 text-sm">
                        안녕하세요, 문의해주셔서 감사합니다.
                        해당 건 확인 중이며, 빠른 시일 내 처리해드리겠습니다.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="답변을 입력하세요..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <Button><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>문의를 선택해주세요</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
