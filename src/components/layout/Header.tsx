"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search, Sparkles, Menu, User, ChevronDown, ChevronRight,
  Heart, Bell, MessageCircle, LayoutDashboard, Settings, LogOut, ShoppingBag
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { categories } from "@/data/categories";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; image: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setIsLoggedIn(true);
        setUser({
          name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "사용자",
          email: authUser.email || "",
          image: authUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
        });
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUser({
          name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "사용자",
          email: session.user.email || "",
          image: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
        });
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const logout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleAIRecommend = () => {
    // AI 추천 기능 - 검색어 기반으로 추천 페이지로 이동
    window.location.href = `/search?ai=true${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`;
  };

  return (
    <header 
      className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm"
      role="banner"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group"
            aria-label="뚝딱 홈으로 이동"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="hidden font-bold text-xl sm:inline-block bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              뚝딱
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form 
            onSubmit={handleSearch}
            className="hidden flex-1 max-w-xl md:flex items-center gap-2"
            role="search"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
              <Input
                type="text"
                placeholder="어떤 영상 전문가가 필요하세요?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-full border-slate-200 bg-slate-50 focus:bg-white focus:border-primary/50 transition-all"
                aria-label="서비스 검색"
              />
            </div>
            {/* AI 추천 버튼 분리 */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAIRecommend}
              className="h-11 px-4 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-white gap-1.5 transition-all"
              aria-label="AI 추천 서비스 보기"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">AI 추천</span>
            </Button>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="메인 네비게이션">
            {/* Categories Dropdown - 전체 카테고리 표시 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="gap-1 text-slate-700"
                  aria-haspopup="true"
                  aria-label="카테고리 메뉴 열기"
                >
                  카테고리
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* 인기 카테고리 */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">인기 카테고리</p>
                </div>
                {categories.slice(0, 4).map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link href={`/category/${category.slug}`} className="cursor-pointer flex justify-between">
                      <span>{category.name}</span>
                      <Badge variant="secondary" className="text-xs">{category.serviceCount}</Badge>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {/* 나머지 카테고리 */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">전체</p>
                </div>
                {categories.slice(4).map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link href={`/category/${category.slug}`} className="cursor-pointer flex justify-between">
                      <span>{category.name}</span>
                      <Badge variant="secondary" className="text-xs">{category.serviceCount}</Badge>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/categories" className="cursor-pointer text-primary font-medium flex items-center gap-1">
                    전체 카테고리 보기
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" asChild className="text-slate-700">
              <Link href="/expert/register">전문가 등록</Link>
            </Button>
            {!isLoggedIn && (
              <span></span>
            )}

            <div className="w-px h-6 bg-slate-200 mx-2" aria-hidden="true" />

            {isLoggedIn && user ? (
              <>
                <Button variant="ghost" size="icon" asChild className="text-slate-600 relative">
                  <Link href="/favorites" aria-label="찜 목록">
                    <Heart className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="text-slate-600 relative">
                  <Link href="/notifications" aria-label="알림">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="text-slate-600">
                  <Link href="/messages" aria-label="메시지">
                    <MessageCircle className="h-4 w-4" />
                  </Link>
                </Button>

                {/* User Avatar Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 ml-1 cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/mypage" className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" /> 마이페이지
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="cursor-pointer">
                        <Heart className="h-4 w-4 mr-2" /> 찜 목록
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/history" className="cursor-pointer">
                        <ShoppingBag className="h-4 w-4 mr-2" /> 주문 내역
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="h-4 w-4 mr-2" /> 전문가 대시보드
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" /> 설정
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-red-500" onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" /> 로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-slate-700">
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild className="rounded-full px-6 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 shadow-md shadow-primary/25">
                  <Link href="/signup">회원가입</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className="text-slate-600"
              aria-label="검색 페이지로 이동"
            >
              <Link href="/search">
                <Search className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-600"
                  aria-label="메뉴 열기"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="p-6 bg-gradient-to-br from-primary to-orange-500">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        {isLoggedIn && user ? (
                          <span className="text-white font-bold text-lg">{user.name[0]}</span>
                        ) : (
                          <User className="h-6 w-6 text-white" aria-hidden="true" />
                        )}
                      </div>
                      <div className="text-white">
                        {isLoggedIn && user ? (
                          <>
                            <p className="font-medium">{user.name}님</p>
                            <p className="text-sm text-white/80">{user.email}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">환영합니다!</p>
                            <p className="text-sm text-white/80">로그인이 필요합니다</p>
                          </>
                        )}
                      </div>
                    </div>
                    {isLoggedIn ? (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="secondary" className="flex-1 bg-white text-primary hover:bg-white/90" asChild>
                          <Link href="/mypage" onClick={() => setIsOpen(false)}>마이페이지</Link>
                        </Button>
                        <Button size="sm" className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30" variant="outline" asChild>
                          <Link href="/dashboard" onClick={() => setIsOpen(false)}>대시보드</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="secondary" className="flex-1 bg-white text-primary hover:bg-white/90" asChild>
                          <Link href="/login" onClick={() => setIsOpen(false)}>로그인</Link>
                        </Button>
                        <Button size="sm" className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30" variant="outline" asChild>
                          <Link href="/signup" onClick={() => setIsOpen(false)}>회원가입</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Navigation */}
                  <nav className="flex-1 overflow-y-auto p-4" aria-label="모바일 네비게이션">
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" className="justify-start h-12" asChild>
                        <Link href="/expert/register" onClick={() => setIsOpen(false)}>
                          <Sparkles className="h-4 w-4 mr-3 text-primary" aria-hidden="true" />
                          전문가 등록
                        </Link>
                      </Button>
                    </div>

                    <div className="mt-6">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">카테고리</p>
                      <div className="flex flex-col gap-0.5">
                        {categories.map((category) => (
                          <Button
                            key={category.id}
                            variant="ghost"
                            className="justify-start h-10 text-sm font-normal text-slate-700"
                            asChild
                          >
                            <Link 
                              href={`/category/${category.slug}`}
                              onClick={() => setIsOpen(false)}
                            >
                              {category.name}
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {category.serviceCount}
                              </Badge>
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </nav>

                   {/* Mobile Footer */}
                   <div className="p-4 border-t bg-slate-50">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex gap-4 text-xs text-slate-500">
                         <Link href="/guide" onClick={() => setIsOpen(false)} className="hover:text-primary">이용가이드</Link>
                         <Link href="/faq" onClick={() => setIsOpen(false)} className="hover:text-primary">FAQ</Link>
                         <Link href="/about" onClick={() => setIsOpen(false)} className="hover:text-primary">회사소개</Link>
                       </div>
                     </div>
                   </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
