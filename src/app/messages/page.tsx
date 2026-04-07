"use client";

import { useState } from "react";
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

interface Conversation {
  id: string;
  expertName: string;
  expertImage: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  serviceName: string;
}

interface Message {
  id: string;
  sender: "me" | "expert";
  content: string;
  time: string;
}

const conversations: Conversation[] = [
  {
    id: "conv-1",
    expertName: "김영상",
    expertImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert1",
    lastMessage: "네, 말씀하신 방향으로 수정 진행하겠습니다!",
    lastTime: "오후 2:30",
    unread: 2,
    serviceName: "AI로 만드는 프리미엄 뮤직비디오",
  },
  {
    id: "conv-2",
    expertName: "정유튜",
    expertImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert5",
    lastMessage: "편집본 보내드렸습니다. 확인 부탁드립니다.",
    lastTime: "어제",
    unread: 0,
    serviceName: "유튜브 영상 편집",
  },
  {
    id: "conv-3",
    expertName: "이모션",
    expertImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert2",
    lastMessage: "안녕하세요! 프로젝트 관련 문의 감사합니다.",
    lastTime: "3일 전",
    unread: 0,
    serviceName: "브랜드 인트로 모션그래픽",
  },
];

const sampleMessages: Message[] = [
  {
    id: "msg-1",
    sender: "me",
    content: "안녕하세요! AI 영상 제작 의뢰드리고 싶습니다.",
    time: "오후 1:00",
  },
  {
    id: "msg-2",
    sender: "expert",
    content:
      "안녕하세요! 문의 감사합니다. 어떤 종류의 영상을 원하시나요? 구체적인 요구사항을 말씀해주시면 더 정확한 견적을 드릴 수 있습니다.",
    time: "오후 1:15",
  },
  {
    id: "msg-3",
    sender: "me",
    content:
      "30초 정도의 제품 소개 영상인데요, AI 영상 생성 도구를 활용해서 시네마틱한 느낌으로 만들고 싶어요.",
    time: "오후 1:20",
  },
  {
    id: "msg-4",
    sender: "expert",
    content:
      "충분히 가능합니다! Sora와 Runway를 조합해서 작업하면 좋을 것 같습니다. 스탠다드 패키지로 진행하면 4K 화질에 사운드 디자인까지 포함됩니다.",
    time: "오후 1:35",
  },
  {
    id: "msg-5",
    sender: "me",
    content: "좋아요! 중간에 색감을 좀 더 따뜻하게 수정해주실 수 있나요?",
    time: "오후 2:00",
  },
  {
    id: "msg-6",
    sender: "expert",
    content: "네, 말씀하신 방향으로 수정 진행하겠습니다!",
    time: "오후 2:30",
  },
];

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState<string | null>("conv-1");
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState(sampleMessages);

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConv
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: "me",
        content: newMessage,
        time: "방금",
      },
    ]);
    setNewMessage("");
  };

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
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv.id)}
              className={cn(
                "w-full flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b",
                selectedConv === conv.id && "bg-muted/50"
              )}
            >
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={conv.expertImage} alt={conv.expertName} />
                <AvatarFallback>{conv.expertName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm">
                    {conv.expertName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {conv.lastTime}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1 truncate">
                  {conv.serviceName}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage}
                  </p>
                  {conv.unread > 0 && (
                    <Badge className="h-5 min-w-5 px-1.5 text-xs ml-2 shrink-0">
                      {conv.unread}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
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
                <AvatarImage
                  src={selectedConversation.expertImage}
                  alt={selectedConversation.expertName}
                />
                <AvatarFallback>
                  {selectedConversation.expertName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">
                  {selectedConversation.expertName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.serviceName}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.sender === "me" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2.5",
                    msg.sender === "me"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-background border rounded-bl-md"
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      msg.sender === "me"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
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
            <p className="text-muted-foreground text-sm">
              대화를 선택해주세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
