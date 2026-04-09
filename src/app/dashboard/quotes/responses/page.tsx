"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DollarSign, Calendar, Clock, CheckCircle, XCircle, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import type { QuoteRequest, QuoteResponse } from "@/types";

const requestStatusColors: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  matched: "bg-blue-100 text-blue-700",
  closed: "bg-slate-100 text-slate-700",
};

const requestStatusLabel: Record<string, string> = {
  open: "대기 중",
  matched: "견적 받음",
  closed: "마감",
};

const responseStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-slate-100 text-slate-500",
};

const responseStatusLabel: Record<string, string> = {
  pending: "검토 중",
  accepted: "수락됨",
  rejected: "거절됨",
};

interface RequestWithResponses {
  request: QuoteRequest;
  responses: QuoteResponse[];
}

export default function QuoteResponsesPage() {
  const [items, setItems] = useState<RequestWithResponses[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }

      const res = await fetch(`/api/quote-requests?userId=${user.id}`);
      if (!res.ok) { setLoading(false); return; }

      const requests: QuoteRequest[] = await res.json();

      // Fetch responses for each request in parallel
      const withResponses = await Promise.all(
        requests.map(async (request) => {
          const rRes = await fetch(`/api/quote-requests/${request.id}/responses`);
          const responses: QuoteResponse[] = rRes.ok ? await rRes.json() : [];
          return { request, responses };
        })
      );

      setItems(withResponses);
      setLoading(false);
    }
    load();
  }, []);

  const handleAction = async (
    requestId: string,
    responseId: string,
    action: "accepted" | "rejected"
  ) => {
    setActing(responseId);
    try {
      const res = await fetch(
        `/api/quote-requests/${requestId}/responses/${responseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        }
      );

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "처리에 실패했습니다");
        return;
      }

      toast.success(action === "accepted" ? "견적을 수락했습니다!" : "견적을 거절했습니다");

      // Update local state
      setItems((prev) =>
        prev.map(({ request, responses }) => {
          if (request.id !== requestId) return { request, responses };

          const updatedResponses = responses.map((r) => {
            if (r.id === responseId) return { ...r, status: action };
            if (action === "accepted" && r.status === "pending") return { ...r, status: "rejected" as const };
            return r;
          });

          const updatedRequest =
            action === "accepted"
              ? { ...request, status: "closed" as const }
              : request;

          return { request: updatedRequest, responses: updatedResponses };
        })
      );
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setActing(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ko-KR").format(price) + "원";

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  const itemsWithResponses = items.filter((i) => i.responses.length > 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">받은 견적</h1>
        <p className="text-muted-foreground text-sm">
          내 견적 요청에 전문가가 보낸 견적 목록입니다
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            아직 견적 요청이 없습니다.
          </CardContent>
        </Card>
      ) : itemsWithResponses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            아직 받은 견적이 없습니다. 전문가가 견적을 보내면 여기서 확인할 수 있습니다.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {itemsWithResponses.map(({ request, responses }) => (
            <div key={request.id}>
              {/* Request header */}
              <div className="flex items-center gap-3 mb-3">
                <Badge
                  variant="secondary"
                  className={requestStatusColors[request.status] || ""}
                >
                  {requestStatusLabel[request.status] || request.status}
                </Badge>
                {request.category && (
                  <Badge variant="outline" className="text-xs">
                    {request.category}
                  </Badge>
                )}
                <h2 className="font-semibold text-base">{request.title}</h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {request.createdAt.split("T")[0]}
                </span>
              </div>

              {/* Response cards */}
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {responses.map((response) => (
                  <Card
                    key={response.id}
                    className={
                      response.status === "accepted"
                        ? "ring-2 ring-green-500"
                        : response.status === "rejected"
                        ? "opacity-60"
                        : ""
                    }
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                response.expertAvatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${response.expertId}`
                              }
                            />
                            <AvatarFallback className="text-xs">
                              {(response.expertName || "전")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none">
                              {response.expertName || "전문가"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">전문가</p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={responseStatusColors[response.status] || ""}
                        >
                          {responseStatusLabel[response.status] || response.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold">{formatPrice(response.price)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{response.estimatedDays}일 소요</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {response.message}
                      </p>

                      {response.status === "pending" && request.status !== "closed" && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={acting === response.id}
                            onClick={() => handleAction(request.id, response.id, "rejected")}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            거절
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            disabled={acting === response.id}
                            onClick={() => handleAction(request.id, response.id, "accepted")}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            {acting === response.id ? "처리 중..." : "수락"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
