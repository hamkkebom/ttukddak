"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell, MessageCircle, ShoppingBag, Star, CreditCard,
  Megaphone, Check, CheckCheck, Trash2, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NotifCategory = "all" | "order" | "message" | "review" | "payment" | "promo";

interface Notification {
  id: string;
  category: NotifCategory;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

const initialNotifications: Notification[] = [
  {
    id: "n1", category: "order", icon: ShoppingBag, iconColor: "text-blue-600 bg-blue-100",
    title: "새 주문이 접수되었습니다",
    description: "김의뢰님이 'AI 프리미엄 뮤직비디오' 스탠다드 패키지를 주문했습니다.",
    time: "10분 전", read: false, link: "/dashboard",
  },
  {
    id: "n2", category: "message", icon: MessageCircle, iconColor: "text-green-600 bg-green-100",
    title: "새 메시지가 도착했습니다",
    description: "박고객님: '중간 시안 확인했습니다. 색감을 조금 더 따뜻하게...'",
    time: "30분 전", read: false, link: "/messages",
  },
  {
    id: "n3", category: "review", icon: Star, iconColor: "text-amber-600 bg-amber-100",
    title: "새 리뷰가 등록되었습니다",
    description: "이만족님이 별점 5점 리뷰를 남겼습니다: '퀄리티가 기대 이상이었습니다!'",
    time: "2시간 전", read: false, link: "/dashboard",
  },
  {
    id: "n4", category: "payment", icon: CreditCard, iconColor: "text-purple-600 bg-purple-100",
    title: "정산이 완료되었습니다",
    description: "300,000원이 등록된 계좌로 입금되었습니다.",
    time: "어제", read: true,
  },
  {
    id: "n5", category: "order", icon: ShoppingBag, iconColor: "text-blue-600 bg-blue-100",
    title: "주문 상태가 변경되었습니다",
    description: "'Runway 시네마틱 영상' 주문이 검수 대기 상태로 변경되었습니다.",
    time: "어제", read: true, link: "/dashboard",
  },
  {
    id: "n6", category: "promo", icon: Megaphone, iconColor: "text-primary bg-primary/10",
    title: "봄맞이 프로모션 안내",
    description: "신규 서비스 등록 시 수수료 50% 할인 이벤트를 진행합니다!",
    time: "3일 전", read: true, link: "/event",
  },
  {
    id: "n7", category: "message", icon: MessageCircle, iconColor: "text-green-600 bg-green-100",
    title: "견적 요청이 도착했습니다",
    description: "최신규님이 'AI 영상 생성' 카테고리에서 견적을 요청했습니다.",
    time: "3일 전", read: true, link: "/request",
  },
];

const filterTabs: { value: NotifCategory; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "order", label: "주문" },
  { value: "message", label: "메시지" },
  { value: "review", label: "리뷰" },
  { value: "payment", label: "정산" },
  { value: "promo", label: "프로모션" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<NotifCategory>("all");

  const filtered = notifications.filter(
    (n) => activeFilter === "all" || n.category === activeFilter
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">알림</h1>
              {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
                <CheckCheck className="h-4 w-4 mr-1" /> 모두 읽음
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/settings"><Settings className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {filterTabs.map((tab) => (
              <Badge
                key={tab.value}
                variant={activeFilter === tab.value ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap px-4 py-1.5"
                onClick={() => setActiveFilter(tab.value)}
              >
                {tab.label}
              </Badge>
            ))}
          </div>

          {/* Notification List */}
          <div className="space-y-2">
            {filtered.length > 0 ? (
              filtered.map((notif) => {
                const Wrapper = notif.link ? Link : "div";
                const wrapperProps = notif.link ? { href: notif.link } : {};
                return (
                  <Card
                    key={notif.id}
                    className={cn(
                      "transition-colors",
                      !notif.read && "border-primary/30 bg-primary/[0.02]"
                    )}
                  >
                    <Wrapper {...(wrapperProps as any)} onClick={() => markRead(notif.id)}>
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", notif.iconColor)}>
                          <notif.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn("text-sm", !notif.read && "font-semibold")}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notif.description}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">{notif.time}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotification(notif.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Wrapper>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-16">
                <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">알림이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
