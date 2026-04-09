"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle, Send, Search, ArrowLeft, Paperclip,
  Image as ImageIcon, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getConversationsClient, getMessagesClient, sendMessageClient } from "@/lib/db-client";
import type { Conversation, Message } from "@/types";

interface ConvDisplay {
  id: string;
  otherUserId: string;
  otherName: string;
  otherAvatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConvDisplay[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);

      const convs = await getConversationsClient(user.id);

      // Fetch other participant profiles
      const convDisplays: ConvDisplay[] = await Promise.all(
        convs.map(async (c) => {
          const otherId = c.participant1 === user.id ? c.participant2 : c.participant1;
          const { data: profile } = await sb.from("profiles").select("name, avatar_url").eq("id", otherId).maybeSingle();
          return {
            id: c.id,
            otherUserId: otherId,
            otherName: profile?.name || "사용자",
            otherAvatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`,
            lastMessage: c.lastMessage || "",
            lastTime: formatRelativeTime(c.lastMessageAt),
            unread: 0,
          };
        })
      );

      setConversations(convDisplays);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    setMessagesLoading(true);
    getMessagesClient(selectedConv).then((msgs) => {
      setMessages(msgs);
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
          const newMsg = payload.new as any;
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
              },
            ]);
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
          const updated = payload.new as any;
          // Check if current user is a participant
          if (updated.participant_1 === currentUserId || updated.participant_2 === currentUserId) {
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
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">로딩 중...</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
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
                          : "bg-background border rounded-bl-md"
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
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
              <Button type="button" variant="ghost" size="icon" className="shrink-0">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="shrink-0">
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
