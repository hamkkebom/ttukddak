import Link from "next/link";
import {
  Search, Sparkles, ArrowRight, Star, Play, ChevronRight,
  Zap, Layers, Box, ShoppingBag, Building, Music, Heart, GraduationCap,
  Shield, Clock, CheckCircle, TrendingUp,
  Wand2, UserCircle, Mic, Film, Flame, Palette, Captions,
  Smartphone, Share2, ShoppingCart, Building2, Microscope, Sparkle,
  Gamepad2, Brush, LayoutGrid, FileText, Volume2, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/data/categories";
import { services } from "@/data/services";
import { getExpertById } from "@/data/experts";
import { ServiceCard } from "@/components/ServiceCard";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Zap, Layers, Box, Play, ShoppingBag, Building, Music, Heart, GraduationCap,
  Wand2, UserCircle, Mic, Film, Flame, Palette, Captions,
  Smartphone, Share2, ShoppingCart, Microscope, Sparkle,
  Gamepad2, Brush, LayoutGrid, FileText, Volume2,
  Home: Building2, Image: ImageIcon,
};

const popularSearches = [
  "AI 영상 생성", "립싱크", "유튜브 편집", "숏폼", "모션그래픽",
  "제품 광고", "AI 아바타", "3D 렌더링", "자막 번역", "썸네일",
];

const trustedBy = ["삼성", "현대", "네이버", "카카오", "LG", "SK"];

export default function HomePage() {
  const popularServices = [...services]
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 8);

  const topRatedServices = [...services]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  const recentServices = [...services]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="min-h-screen">

      {/* ===== HERO: 검색 중심 ===== */}
      <section className="relative overflow-hidden bg-slate-900 py-16 md:py-24">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              영상, <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">뚝딱</span> 만들어드려요
            </h1>
            <p className="text-lg text-slate-400 mb-10">
              300명 이상의 검증된 AI 영상 전문가가 기다리고 있습니다
            </p>

            {/* 검색창 - 히어로의 주인공 */}
            <form action="/search" className="relative max-w-2xl mx-auto mb-6">
              <div className="flex items-center bg-white rounded-full shadow-2xl shadow-black/20 overflow-hidden">
                <div className="flex items-center flex-1 px-6 py-4">
                  <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
                  <input
                    type="text"
                    name="q"
                    placeholder="어떤 영상이 필요하세요?"
                    className="flex-1 text-lg text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 text-base transition-colors shrink-0"
                >
                  검색
                </button>
              </div>
            </form>

            {/* 인기 검색어 태그 */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm text-slate-500">인기:</span>
              {popularSearches.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-400 rounded-full px-3 py-1 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 카테고리 바 ===== */}
      <section className="border-b bg-white dark:bg-background sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon] || Sparkles;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-muted transition-colors shrink-0 group"
                >
                  <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground whitespace-nowrap font-medium">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 인기 서비스 ===== */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">인기 서비스</h2>
            </div>
            <Link href="/categories" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
              전체보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {popularServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                expert={getExpertById(service.expertId)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 카테고리 탐색 (비주얼) ===== */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">카테고리 탐색</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat, i) => {
              const Icon = iconMap[cat.icon] || Sparkles;
              const gradients = [
                "from-orange-500 to-red-500",
                "from-violet-500 to-purple-600",
                "from-cyan-500 to-blue-600",
                "from-emerald-500 to-teal-600",
                "from-red-500 to-rose-600",
                "from-amber-500 to-orange-600",
                "from-slate-600 to-slate-800",
                "from-violet-500 to-purple-600",
                "from-pink-400 to-rose-500",
                "from-blue-500 to-indigo-600",
              ];
              return (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <div className={`relative h-32 rounded-2xl bg-gradient-to-br ${gradients[i]} p-5 flex flex-col justify-between group overflow-hidden hover:shadow-lg transition-shadow`}>
                    <Icon className="h-7 w-7 text-white/80" />
                    <div>
                      <p className="text-white font-semibold text-sm">{cat.name}</p>
                      <p className="text-white/60 text-xs">{cat.serviceCount}개 서비스</p>
                    </div>
                    {/* Hover arrow */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 높은 평점 서비스 ===== */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              <h2 className="text-xl font-bold">최고 평점</h2>
            </div>
            <Link href="/search?sort=rating" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
              더보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
            {topRatedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                expert={getExpertById(service.expertId)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 이용 방법 (심플) ===== */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-10">이용 방법</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", icon: Search, title: "서비스 검색", desc: "원하는 영상 서비스를 찾으세요" },
              { step: "2", icon: CheckCircle, title: "전문가 선택", desc: "포트폴리오와 리뷰를 확인하세요" },
              { step: "3", icon: Shield, title: "안전 결제", desc: "에스크로로 안전하게 결제하세요" },
              { step: "4", icon: Play, title: "결과물 수령", desc: "고품질 영상을 받아보세요" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 신규 서비스 ===== */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">새로 등록된 서비스</h2>
            </div>
          </div>
          <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
            {recentServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                expert={getExpertById(service.expertId)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 전문가 등록 CTA ===== */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              영상 전문가이신가요?
            </h2>
            <p className="text-slate-400 mb-8">
              뚝딱에서 재능을 판매하고 수익을 창출하세요.<br/>
              300명 이상의 전문가가 이미 활동 중입니다.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild className="rounded-full px-8 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 shadow-xl shadow-primary/25">
                <Link href="/expert/register">
                  전문가로 시작하기 <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full px-8 border-white/20 text-white hover:bg-white/10">
                <Link href="/guide">이용 가이드</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 mt-12">
              <div className="text-center">
                <p className="text-2xl font-bold text-white font-number">300+</p>
                <p className="text-xs text-slate-500">전문가</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white font-number">10K+</p>
                <p className="text-xs text-slate-500">프로젝트</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white font-number">4.9</p>
                <p className="text-xs text-slate-500">평균 평점</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
