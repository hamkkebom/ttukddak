"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell, MessageCircle, ShoppingBag, Star, CreditCard,
  CheckCheck, Trash2, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type NotifType = "order" | "message" | "review" | "payment" | "system";
type FilterCategory = "all" | NotifType;

interface DbNotification {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const filterTabs: { value: FilterCategory; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "order", label: "주문" },
  { value: "message", label: "메시지" },
  { value: "review", label: "리뷰" },
  { value: "payment", label: "정산" },
];

function getIconConfig(type: NotifType): {
  Icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
} {
  switch (type) {
    case "order":
      return { Icon: ShoppingBag, colorClass: "text-blue-600 bg-blue-100" };
    case "message":
      return { Icon: MessageCircle, colorClass: "text-green-600 bg-green-100" };
    case "review":
      return { Icon: Star, colorClass: "text-amber-600 bg-amber-100" };
    case "payment":
      return { Icon: CreditCard, colorClass: "text-purple-600 bg-purple-100" };
    case "system":
    default:
      return { Icon: Bell, colorClass: "text-primary bg-primary/10" };
  }
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay === 1) return "어제";
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications?limit=50");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime inserts for the current user
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel("notifications-page")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as DbNotification, ...prev]);
          }
        )
        .subscribe();

      return channel;
    };

    let channelRef: ReturnType<typeof supabase.channel> | undefined;
    setupRealtime().then((ch) => { channelRef = ch; });

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, [fetchNotifications, supabase]);

  const filtered = notifications.filter(
    (n) => activeFilter === "all" || n.type === activeFilter
  );
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await fetch("/api/notifications/read", { method: "PATCH", body: JSON.stringify({}) });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.is_read) return;
    await fetch("/api/notifications/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

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
                const { Icon, colorClass } = getIconConfig(notif.type);
                const Wrapper = notif.link ? Link : "div";
                const wrapperProps = notif.link ? { href: notif.link } : {};
                return (
                  <Card
                    key={notif.id}
                    className={cn(
                      "transition-colors",
                      !notif.is_read && "border-primary/30 bg-primary/[0.02]"
                    )}
                  >
                    <Wrapper {...(wrapperProps as any)} onClick={() => markRead(notif.id)}>
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", colorClass)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn("text-sm", !notif.is_read && "font-semibold")}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                            {!notif.is_read && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {formatTime(notif.created_at)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
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
