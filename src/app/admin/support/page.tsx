"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, MessageCircle, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Ticket = {
  id: string;
  user_name: string | null;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  message: string | null;
  admin_response: string | null;
};

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-slate-100 text-slate-700",
};

const statusLabels: Record<string, string> = {
  open: "대기",
  in_progress: "처리중",
  resolved: "완료",
  closed: "종료",
};

const priorityColors: Record<string, string> = {
  urgent: "text-red-600",
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-slate-500",
};

const priorityLabels: Record<string, string> = {
  urgent: "긴급",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

function formatDate(d: string) {
  return d.replace("T", " ").slice(0, 16);
}

export default function AdminSupportPage() {
  const [ticketList, setTicketList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      const tickets: Ticket[] = json.data ?? [];
      setTicketList(tickets);
      if (tickets.length > 0 && !selectedId) {
        setSelectedId(tickets[0].id);
      }
    } catch {
      toast.error("문의 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { fetchTickets(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = ticketList.find((t) => t.id === selectedId);

  const filtered = search.trim()
    ? ticketList.filter((t) =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        (t.user_name ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : ticketList;

  const handleComplete = async (ticketId: string) => {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status: "resolved" }),
      });
      if (!res.ok) throw new Error("업데이트 실패");
      setTicketList((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: "resolved" } : t));
      toast.success("문의가 완료 처리되었습니다");
    } catch {
      toast.error("상태 변경에 실패했습니다");
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, adminResponse: reply }),
      });
      if (!res.ok) throw new Error("답변 전송 실패");
      const json = await res.json();
      setTicketList((prev) => prev.map((t) => t.id === selectedId ? { ...t, ...json.data } : t));
      setReply("");
      toast.success("답변이 전송되었습니다");
    } catch {
      toast.error("답변 전송에 실패했습니다");
    } finally {
      setSending(false);
    }
  };

  const pendingCount = ticketList.filter((t) => t.status === "open").length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">고객문의 관리</h1>
        <p className="text-muted-foreground text-sm">
          {loading ? "불러오는 중..." : `미답변 ${pendingCount}건`}
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6" style={{ height: "calc(100vh - 200px)" }}>
        {/* Ticket List */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardContent className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="문의 검색"
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">문의가 없습니다</div>
            ) : (
              filtered.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedId(ticket.id)}
                  className={cn(
                    "w-full text-left p-4 border-b hover:bg-muted/50 transition-colors",
                    selectedId === ticket.id && "bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn(statusColors[ticket.status], "text-[10px]")}>
                        {statusLabels[ticket.status] ?? ticket.status}
                      </Badge>
                      <span className="font-mono text-[10px] text-muted-foreground">{ticket.id.slice(0, 8)}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${priorityColors[ticket.priority] ?? ""}`}>
                      {priorityLabels[ticket.priority] ?? ticket.priority}
                    </span>
                  </div>
                  <p className="font-medium text-sm truncate">{ticket.subject}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {ticket.user_name ?? "익명"} · {ticket.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(ticket.created_at)}</span>
                  </div>
                </button>
              ))
            )}
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
                      <Badge variant="secondary" className={statusColors[selected.status]}>
                        {statusLabels[selected.status] ?? selected.status}
                      </Badge>
                      <Badge variant="outline">{selected.category}</Badge>
                      <span className="font-mono text-xs text-muted-foreground">{selected.id.slice(0, 8)}</span>
                    </div>
                    <CardTitle className="text-base">{selected.subject}</CardTitle>
                  </div>
                  {selected.status !== "resolved" && selected.status !== "closed" && (
                    <Button variant="outline" size="sm" onClick={() => handleComplete(selected.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> 완료 처리
                    </Button>
                  )}
                </div>
              </CardHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Customer message */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback>{(selected.user_name ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{selected.user_name ?? "익명"}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(selected.created_at)}</span>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      {selected.message ?? selected.subject}
                    </div>
                  </div>
                </div>

                {selected.admin_response && (
                  <div className="flex gap-3 justify-end">
                    <div>
                      <div className="flex items-center gap-2 mb-1 justify-end">
                        <span className="text-[10px] text-muted-foreground">답변</span>
                        <span className="text-sm font-medium">관리자</span>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-3 text-sm">
                        {selected.admin_response}
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
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  />
                  <Button onClick={handleSendReply} disabled={sending || !reply.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
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
