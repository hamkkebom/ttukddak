"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Package, ShoppingBag, CreditCard,
  Star, Layers, Megaphone, Headphones, BarChart3, Sparkles, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: LayoutDashboard, label: "대시보드", href: "/admin" },
  { icon: Users, label: "회원 관리", href: "/admin/users" },
  { icon: Package, label: "서비스 관리", href: "/admin/services" },
  { icon: ShoppingBag, label: "주문 관리", href: "/admin/orders" },
  { icon: CreditCard, label: "정산 관리", href: "/admin/settlements" },
  { icon: Star, label: "리뷰 관리", href: "/admin/reviews" },
  { icon: Layers, label: "카테고리 관리", href: "/admin/categories" },
  { icon: Megaphone, label: "이벤트 관리", href: "/admin/events" },
  { icon: Headphones, label: "고객문의", href: "/admin/support" },
  { icon: BarChart3, label: "리포트", href: "/admin/reports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm">뚝딱</span>
              <span className="block text-[10px] text-slate-400">관리자</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            사이트로 돌아가기
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
