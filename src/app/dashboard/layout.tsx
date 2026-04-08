"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, DollarSign, FileText,
  MessageCircle, Settings, Sparkles, LogOut, Bell, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  { icon: LayoutDashboard, label: "대시보드", href: "/dashboard", badge: "" },
  { icon: Package, label: "내 서비스", href: "/dashboard", badge: "" },
  { icon: ShoppingBag, label: "주문 관리", href: "/dashboard/orders", badge: "3" },
  { icon: FileText, label: "견적 요청", href: "/dashboard/quotes", badge: "2" },
  { icon: DollarSign, label: "수익/정산", href: "/dashboard/earnings", badge: "" },
  { icon: MessageCircle, label: "메시지", href: "/messages", badge: "2" },
  { icon: Bell, label: "알림", href: "/notifications", badge: "" },
  { icon: Settings, label: "설정", href: "/dashboard/settings", badge: "" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm block">뚝딱</span>
              <span className="text-[10px] text-muted-foreground">전문가 센터</span>
            </div>
          </Link>
        </div>

        {/* Quick Action */}
        <div className="p-3">
          <Link
            href="/dashboard/services/new"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> 새 서비스 등록
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </div>
                {item.badge && (
                  <Badge className="h-5 min-w-5 px-1.5 text-[10px]">{item.badge}</Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t space-y-1">
          <Link
            href="/mypage"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            마이페이지
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" /> 사이트로
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
