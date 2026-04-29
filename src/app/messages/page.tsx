"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  MessageCircle, Send, Search, ArrowLeft, Paperclip,
  Image as ImageIcon, MoreVertical, Handshake, ReceiptText,
  CheckCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getConversationsClient, getMessagesClient, getServicesByExpertClient, sendMessageClient } from "@/lib/db-client";
import { uploadFile } from "@/lib/storage";
import type { DealOffer, Message, Service } from "@/types";

interface ConvDisplay {
  id: string;
  participant1: string;
  participant2: string;
  otherUserId: string;
  otherName: string;
  otherAvatar: string;
  serviceId?: string;
  serviceTitle?: string;
  quoteRequestId?: string;
  quoteRequestTitle?: string;
  orderId?: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

type RealtimeMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  message_type?: Message["messageType"];
  file_url?: string | null;
};

type RealtimeConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message?: string | null;
};

function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `오늘`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "어제";
  return `${days}일 전`;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConvDisplay[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [dealOffers, setDealOffers] = useState<DealOffer[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerActionId, setOfferActionId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState({
    serviceId: "",
    title: "",
    scope: "",
    amount: "",
    deliveryDays: "",
    revisions: "1",
    memo: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);

      const [convs, services] = await Promise.all([
        getConversationsClient(user.id),
        getServicesByExpertClient(user.id),
      ]);
      setMyServices(services);

      // Fetch other participant profiles
      const convDisplays: ConvDisplay[] = await Promise.all(
        convs.map(async (c) => {
          const otherId = c.participant1 === user.id ? c.participant2 : c.participant1;
          const [profileResult, serviceResult, quoteResult] = await Promise.all([
            sb.from("profiles").select("name, avatar_url").eq("id", otherId).maybeSingle(),
            c.serviceId
              ? sb.from("services").select("title").eq("id", c.serviceId).maybeSingle()
              : Promise.resolve({ data: null }),
            c.quoteRequestId
              ? sb.from("quote_requests").select("title").eq("id", c.quoteRequestId).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);
          const profile = profileResult.data;
          return {
            id: c.id,
            participant1: c.participant1,
            participant2: c.participant2,
            otherUserId: otherId,
            otherName: profile?.name || "사용자",
            otherAvatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`,
            serviceId: c.serviceId,
            serviceTitle: serviceResult.data?.title,
            quoteRequestId: c.quoteRequestId,
            quoteRequestTitle: quoteResult.data?.title,
            orderId: c.orderId,
            lastMessage: c.lastMessage || "",
            lastTime: formatRelativeTime(c.lastMessageAt),
            unread: 0,
          };
        })
      );

      setConversations(convDisplays);
      const requestedConversationId = searchParams.get("conversationId");
      const requestedOrderId = searchParams.get("order");
      if (requestedConversationId && convDisplays.some((c) => c.id === requestedConversationId)) {
        setSelectedConv(requestedConversationId);
      } else if (requestedOrderId) {
        const orderConversation = convDisplays.find((c) => c.orderId === requestedOrderId);
        if (orderConversation) setSelectedConv(orderConversation.id);
      }
      setLoading(false);
    };
    init();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedConv) return;
    setMessagesLoading(true);
    setOfferFormOpen(false);
    Promise.all([
      getMessagesClient(selectedConv),
      fetch(`/api/deal-offers?conversationId=${encodeURIComponent(selectedConv)}`).then((res) => res.ok ? res.json() : []),
    ]).then(([msgs, offers]) => {
      setMessages(msgs);
      setDealOffers(offers);
      setMessagesLoading(false);
    }).catch(() => {
      setMessagesLoading(false);
    });
  }, [selectedConv]);

  // Realtime subscription for current conversation messages
  useEffect(() => {
    if (!selectedConv || !currentUserId) return;

    const sb = createClient();
    const channel = sb
      .channel(`messages:${selectedConv}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConv}`,
        },
        (payload) => {
          const newMsg = payload.new as RealtimeMessageRow;
          // Only add if not sent by current user (already added optimistically)
          if (newMsg.sender_id !== currentUserId) {
            setMessages((prev) => [
              ...prev,
              {
                id: newMsg.id,
                conversationId: newMsg.conversation_id,
                senderId: newMsg.sender_id,
                content: newMsg.content,
                isRead: newMsg.is_read,
                createdAt: newMsg.created_at,
                messageType: newMsg.message_type,
                fileUrl: newMsg.file_url || undefined,
              },
            ]);
          }
          if (newMsg.message_type === "deal_offer" || newMsg.message_type === "system") {
            fetch(`/api/deal-offers?conversationId=${encodeURIComponent(selectedConv)}`)
              .then((res) => res.ok ? res.json() : [])
              .then((offers) => setDealOffers(offers))
              .catch(() => {});
          }
        }
      )
      .subscribe();

    // Mark unread messages as read
    sb.from("messages")
      .update({ is_read: true })
      .eq("conversation_id", selectedConv)
      .neq("sender_id", currentUserId)
      .eq("is_read", false)
      .then(() => {});

    return () => {
      sb.removeChannel(channel);
    };
  }, [selectedConv, currentUserId]);

  // Realtime subscription for conversation list updates
  useEffect(() => {
    if (!currentUserId) return;

    const sb = createClient();
    const channel = sb
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const updated = payload.new as RealtimeConversationRow;
          // Check if current user is a participant
          if (updated.buyer_id === currentUserId || updated.seller_id === currentUserId) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === updated.id
                  ? { ...c, lastMessage: updated.last_message || c.lastMessage, lastTime: "방금" }
                  : c
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [currentUserId]);

  const selectedConversation = conversations.find((c) => c.id === selectedConv);
  const isSeller = !!selectedConversation && selectedConversation.participant2 === currentUserId;
  const isBuyer = !!selectedConversation && selectedConversation.participant1 === currentUserId;

  const refreshDealOffers = async (conversationId = selectedConv) => {
    if (!conversationId) return;
    const res = await fetch(`/api/deal-offers?conversationId=${encodeURIComponent(conversationId)}`);
    if (res.ok) setDealOffers(await res.json());
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !selectedConversation) return;
    const serviceId = selectedConversation.serviceId || offerForm.serviceId || myServices[0]?.id;
    if (!serviceId) {
      toast.error("견적을 연결할 서비스를 먼저 등록해주세요");
      return;
    }
    if (!offerForm.title.trim() || !offerForm.scope.trim() || !offerForm.amount || !offerForm.deliveryDays) {
      toast.error("제목, 작업 범위, 금액, 납기를 입력해주세요");
      return;
    }

    setOfferSubmitting(true);
    try {
      const res = await fetch("/api/deal-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConv,
          serviceId,
          quoteRequestId: selectedConversation.quoteRequestId,
          title: offerForm.title,
          scope: offerForm.scope,
          amount: Number(offerForm.amount),
          deliveryDays: Number(offerForm.deliveryDays),
          revisions: Number(offerForm.revisions || 1),
          memo: offerForm.memo,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "합의견적을 보내지 못했습니다");
        return;
      }
      toast.success("합의견적을 보냈습니다");
      setOfferForm({
        serviceId: "",
        title: "",
        scope: "",
        amount: "",
        deliveryDays: "",
        revisions: "1",
        memo: "",
      });
      setOfferFormOpen(false);
      await refreshDealOffers(selectedConv);
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleOfferAction = async (offerId: string, action: "accept" | "reject") => {
    setOfferActionId(offerId);
    try {
      const res = await fetch(`/api/deal-offers/${offerId}/${action}`, { method: "PATCH" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || "합의견적 처리에 실패했습니다");
        return;
      }
      toast.success(action === "accept" ? "합의견적을 수락했습니다" : "합의견적을 거절했습니다");
      await refreshDealOffers();
      if (action === "accept" && json.orderId) {
        setConversations((prev) =>
          prev.map((c) => c.id === selectedConv ? { ...c, orderId: json.orderId } : c)
        );
        router.push(`/order/${json.orderId}`);
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다");
    } finally {
      setOfferActionId(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !currentUserId) return;
    const content = newMessage;
    setNewMessage("");
    const msg = await sendMessageClient(selectedConv, currentUserId, content);
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) => c.id === selectedConv ? { ...c, lastMessage: content, lastTime: "방금" } : c)
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "file" | "image") => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv || !currentUserId) return;
    e.target.value = "";
    try {
      const result = await uploadFile("attachments", file, `messages/${selectedConv}`);
      const messageType = type === "image" ? "image" : "file";
      const content = file.name;
      const msg = await sendMessageClient(selectedConv, currentUserId, content, { messageType, fileUrl: result.url });
      if (msg) {
        setMessages((prev) => [...prev, msg]);
        const display = type === "image" ? "이미지" : "파일";
        setConversations((prev) =>
          prev.map((c) => c.id === selectedConv ? { ...c, lastMessage: display, lastTime: "방금" } : c)
        );
      }
    } catch {
      alert("파일 업로드에 실패했습니다.");
    }
  };

  const filteredConvs = conversations.filter((c) =>
    !searchQuery || c.otherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
          <Button asChild><Link href="/login">로그인</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Sidebar - Conversation List */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r flex flex-col bg-background",
          selectedConv && "hidden md:flex"
        )}
      >
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold mb-3">메시지</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="대화 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">아직 대화가 없습니다</p>
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b",
                  selectedConv === conv.id && "bg-muted/50"
                )}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={conv.otherAvatar} alt={conv.otherName} />
                  <AvatarFallback>{conv.otherName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm">{conv.otherName}</span>
                    <span className="text-xs text-muted-foreground">{conv.lastTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-xs ml-2 shrink-0">{conv.unread}</Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConv && selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedConv(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarImage src={selectedConversation.otherAvatar} alt={selectedConversation.otherName} />
                <AvatarFallback>{selectedConversation.otherName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{selectedConversation.otherName}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedConversation.serviceTitle && (
                    <Badge variant="secondary" className="h-5 text-[10px]">
                      {selectedConversation.serviceTitle}
                    </Badge>
                  )}
                  {selectedConversation.quoteRequestTitle && (
                    <Badge variant="outline" className="h-5 text-[10px]">
                      {selectedConversation.quoteRequestTitle}
                    </Badge>
                  )}
                  {selectedConversation.orderId && (
                    <Badge variant="outline" className="h-5 text-[10px]">
                      주문 연결됨
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {selectedConversation.orderId && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/order/${selectedConversation.orderId}/tracking`}>
                    <ReceiptText className="h-4 w-4 mr-1" />
                    주문
                  </Link>
                </Button>
              )}
              {isSeller && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOfferForm((prev) => ({
                      ...prev,
                      serviceId: selectedConversation.serviceId || prev.serviceId || myServices[0]?.id || "",
                    }));
                    setOfferFormOpen((open) => !open);
                  }}
                >
                  <Handshake className="h-4 w-4 mr-1" />
                  합의견적
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => {
                if (confirm("이 대화방을 나가시겠습니까?")) {
                  setConversations((prev) => prev.filter((c) => c.id !== selectedConv));
                  setSelectedConv(null);
                  setMessages([]);
                }
              }}>
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {offerFormOpen && isSeller && (
            <form onSubmit={handleOfferSubmit} className="border-b bg-amber-50/60 p-4">
              <div className="grid gap-3 md:grid-cols-4">
                {!selectedConversation.serviceId && (
                  <select
                    value={offerForm.serviceId}
                    onChange={(e) => setOfferForm((prev) => ({ ...prev, serviceId: e.target.value }))}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
                    disabled={offerSubmitting}
                  >
                    <option value="">서비스 선택</option>
                    {myServices.map((service) => (
                      <option key={service.id} value={service.id}>{service.title}</option>
                    ))}
                  </select>
                )}
                <Input
                  value={offerForm.title}
                  onChange={(e) => setOfferForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="견적 제목"
                  className={selectedConversation.serviceId ? "md:col-span-2" : ""}
                  disabled={offerSubmitting}
                />
                <Input
                  type="number"
                  value={offerForm.amount}
                  onChange={(e) => setOfferForm((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="금액"
                  disabled={offerSubmitting}
                />
                <Input
                  type="number"
                  value={offerForm.deliveryDays}
                  onChange={(e) => setOfferForm((prev) => ({ ...prev, deliveryDays: e.target.value }))}
                  placeholder="납기(일)"
                  disabled={offerSubmitting}
                />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px]">
                <textarea
                  value={offerForm.scope}
                  onChange={(e) => setOfferForm((prev) => ({ ...prev, scope: e.target.value }))}
                  placeholder="작업 범위, 포함 산출물, 제외 조건을 적어주세요"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={offerSubmitting}
                />
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={offerForm.revisions}
                    onChange={(e) => setOfferForm((prev) => ({ ...prev, revisions: e.target.value }))}
                    placeholder="수정 횟수"
                    disabled={offerSubmitting}
                  />
                  <Button className="w-full" type="submit" disabled={offerSubmitting}>
                    {offerSubmitting ? "전송 중..." : "제안 보내기"}
                  </Button>
                </div>
              </div>
              <Input
                value={offerForm.memo}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, memo: e.target.value }))}
                placeholder="추가 메모"
                className="mt-3"
                disabled={offerSubmitting}
              />
            </form>
          )}

          {dealOffers.length > 0 && (
            <div className="border-b bg-background p-3">
              <div className="flex gap-2 overflow-x-auto">
                {dealOffers.slice(0, 4).map((offer) => (
                  <div
                    key={offer.id}
                    className={cn(
                      "min-w-[280px] rounded-lg border p-3 text-sm",
                      offer.status === "accepted" && "border-green-300 bg-green-50",
                      offer.status === "pending" && "border-amber-300 bg-amber-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">{offer.title}</p>
                      <Badge variant={offer.status === "accepted" ? "default" : "secondary"} className="text-[10px]">
                        {offer.status}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{offer.scope}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold">{offer.amount.toLocaleString("ko-KR")}원</span>
                      <span className="text-xs text-muted-foreground">
                        {offer.deliveryDays}일 · 수정 {offer.revisions}회
                      </span>
                    </div>
                    {offer.status === "pending" && isBuyer && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={offerActionId === offer.id}
                          onClick={() => handleOfferAction(offer.id, "reject")}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          거절
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={offerActionId === offer.id}
                          onClick={() => handleOfferAction(offer.id, "accept")}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          수락
                        </Button>
                      </div>
                    )}
                    {offer.status === "accepted" && offer.orderId && (
                      <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
                        <Link href={`/order/${offer.orderId}`}>주문/결제 보기</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">로딩 중...</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                if (msg.messageType === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <p className="max-w-[80%] rounded-full bg-background px-3 py-1 text-center text-xs text-muted-foreground shadow-sm">
                        {msg.content}
                      </p>
                    </div>
                  );
                }
                return (
                  <div
                    key={msg.id}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-background border rounded-bl-md",
                        msg.messageType === "deal_offer" && "border-amber-300 bg-amber-50 text-foreground"
                      )}
                    >
                      {msg.messageType === "image" && msg.fileUrl ? (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                          <img src={msg.fileUrl} alt={msg.content} className="max-w-[200px] rounded" />
                        </a>
                      ) : msg.messageType === "file" && msg.fileUrl ? (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />{msg.content}
                        </a>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <div className="border-t p-4 bg-background">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.zip,.doc,.docx,.txt,.mp4" onChange={(e) => handleFileUpload(e, "file")} />
              <input ref={imageInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} />
              <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => imageInputRef.current?.click()}>
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Input
                placeholder="메시지를 입력하세요..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">메시지</h3>
            <p className="text-muted-foreground text-sm">대화를 선택해주세요</p>
          </div>
        </div>
      )}
    </div>
  );
}
