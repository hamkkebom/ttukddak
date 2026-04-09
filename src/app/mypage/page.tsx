"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  User, Settings, Heart, ShoppingBag, MessageCircle,
  Bell, Star, ChevronRight, LogOut, FileText, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useFavorites } from "@/contexts/FavoritesContext";

const menuItems = [
  {
    group: "주문 관리",
    items: [
      { icon: ShoppingBag, label: "주문 내역", href: "/history", badge: "" },
      { icon: FileText, label: "진행중 프로젝트", href: "/dashboard", badge: "" },
      { icon: Star, label: "리뷰 관리", href: "/history" },
    ],
  },
  {
    group: "나의 활동",
    items: [
      { icon: Heart, label: "찜 목록", href: "/favorites" },
      { icon: MessageCircle, label: "메시지", href: "/messages" },
      { icon: Bell, label: "알림", href: "/notifications" },
    ],
  },
  {
    group: "결제/정산",
    items: [
      { icon: CreditCard, label: "결제 수단 관리", href: "/settings" },
      { icon: FileText, label: "결제 내역", href: "/history" },
    ],
  },
  {
    group: "설정",
    items: [
      { icon: User, label: "프로필 수정", href: "/settings" },
      { icon: Settings, label: "계정 설정", href: "/settings" },
    ],
  },
];

const recentOrders = [
  {
    id: "ord-1",
    serviceName: "AI로 만드는 프리미엄 뮤직비디오 & 광고 영상",
    expertName: "김영상",
    status: "진행중",
    statusColor: "bg-blue-100 text-blue-700",
    date: "2024-03-15",
    price: 300000,
  },
  {
    id: "ord-2",
    serviceName: "유튜브 영상 편집 (자막+효과+썸네일)",
    expertName: "정유튜",
    status: "완료",
    statusColor: "bg-green-100 text-green-700",
    date: "2024-03-10",
    price: 100000,
  },
  {
    id: "ord-3",
    serviceName: "브랜드 인트로 & 로고 모션그래픽 제작",
    expertName: "이모션",
    status: "검수중",
    statusColor: "bg-amber-100 text-amber-700",
    date: "2024-03-08",
    price: 200000,
  },
];

export default function MyPage() {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [userInitial, setUserInitial] = useState("U");
  const [couponCount, setCouponCount] = useState(0);
  const { favorites } = useFavorites();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = user.user_metadata || {};
        const name = meta.full_name || meta.name || user.email?.split("@")[0] || "사용자";
        const email = user.email || "";
        const avatar = meta.avatar_url || meta.picture || "";
        setUserName(name);
        setUserEmail(email);
        setUserAvatar(avatar);
        setUserInitial(name[0] || "U");
      }
    });

    fetch("/api/coupons/user")
      .then((res) => res.ok ? res.json() : null)
      .then((result) => {
        if (result?.data) {
          const unused = (result.data as Array<{ isUsed: boolean }>).filter((uc) => !uc.isUsed).length;
          setCouponCount(unused);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ko-KR").format(price);

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6 text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    {userAvatar && <AvatarImage src={userAvatar} />}
                    <AvatarFallback className="text-xl">{userInitial}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-lg font-bold">{userName || "로딩중..."}</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {userEmail}
                  </p>
                  <Badge variant="secondary">일반 회원</Badge>
                </CardContent>
              </Card>

              {/* Menu */}
              <Card>
                <CardContent className="p-2">
                  {menuItems.map((group, gi) => (
                    <div key={gi}>
                      {gi > 0 && <Separator className="my-2" />}
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
                        {group.group}
                      </p>
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  ))}

                  <Separator className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors w-full text-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">로그아웃</span>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "진행중 주문", value: "0", color: "text-blue-600" },
                { label: "완료된 주문", value: "0", color: "text-green-600" },
                { label: "찜한 서비스", value: String(favorites.length), color: "text-red-500" },
                { label: "받은 쿠폰", value: String(couponCount), color: "text-primary" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardContent className="p-5 text-center">
                    <p className={`text-3xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>최근 주문</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/history">전체보기 <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/order/${order.id}/tracking`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={order.statusColor}
                        >
                          {order.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {order.date}
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate">
                        {order.serviceName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.expertName} 전문가
                      </p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold">
                        {formatPrice(order.price)}원
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">메시지</h3>
                      <p className="text-sm text-muted-foreground">
                        전문가에게 문의하기
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/messages">메시지 확인하기</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">찜한 서비스</h3>
                      <p className="text-sm text-muted-foreground">
                        {favorites.length}개의 서비스를 찜했습니다
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/favorites">찜 목록 보기</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
