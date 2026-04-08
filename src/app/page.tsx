import Link from "next/link";
import Image from "next/image";
import {
  Search, Sparkles, ArrowRight, Star, Play, ChevronRight, ChevronLeft,
  Zap, Layers, Box, ShoppingBag, Building, Music, Heart, GraduationCap,
  Shield, CheckCircle, TrendingUp, Trophy, Award, ExternalLink,
  Wand2, UserCircle, Mic, Film, Flame, Palette, Captions,
  Smartphone, Share2, ShoppingCart, Building2, Sparkle,
  Gamepad2, Brush, LayoutGrid, FileText, Volume2, ImageIcon
} from "lucide-react";
import { categories } from "@/data/categories";
import { services } from "@/data/services";
import { getExpertById } from "@/data/experts";
import { ServiceCard } from "@/components/ServiceCard";
import { HorizontalScrollRow } from "@/components/HorizontalScrollRow";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Zap, Layers, Box, Play, ShoppingBag, Building, Music, Heart, GraduationCap,
  Wand2, UserCircle, Mic, Film, Flame, Palette, Captions,
  Smartphone, Share2, ShoppingCart, Sparkle,
  Gamepad2, Brush, LayoutGrid, FileText, Volume2,
  Home: Building2, Image: ImageIcon, ImageIcon,
};

const popularSearches = [
  "AI 영상 생성", "립싱크", "유튜브 편집", "숏폼", "모션그래픽",
  "제품 광고", "AI 아바타", "3D 렌더링",
];

// 추천 전문가 데이터 (실제 프리랜서)
const featuredExperts = [
  { name: "새론", specialty: "AI 영상 · 운세 콘텐츠", rating: 4.9, reviews: 59, completionRate: 99, responseTime: "1시간", color: "from-orange-500 to-red-500", image: "photo-1536240478700-b869070f9279", service: "AI 힐링·운세 영상 제작", price: 150000, portfolioImages: ["photo-1535016120720-40c646be5580", "photo-1550745165-9bc0b252726f", "photo-1611532736597-de2d4265fba3"], badge: "TOP" },
  { name: "버들", specialty: "AI 영상 · 힐링 콘텐츠", rating: 4.8, reviews: 41, completionRate: 99, responseTime: "1시간", color: "from-violet-500 to-purple-600", image: "photo-1574717024653-61fd2cf4d44d", service: "힐링 기도 영상 제작", price: 120000, portfolioImages: ["photo-1536240478700-b869070f9279", "photo-1492691527719-9d1e07e534b4", "photo-1598488035139-bdbb2231ce04"], badge: "HOT" },
  { name: "아이", specialty: "AI 영상 · 힐링 콘텐츠", rating: 4.9, reviews: 38, completionRate: 97, responseTime: "2시간", color: "from-cyan-500 to-blue-600", image: "photo-1492691527719-9d1e07e534b4", service: "AI 꿈꿈·소개 영상 패키지", price: 100000, portfolioImages: ["photo-1505739998589-00fc191ce01d", "photo-1574717024653-61fd2cf4d44d", "photo-1677442136019-21780ecad995"], badge: "FAST" },
  { name: "산다라", specialty: "AI 영상 · 상담 콘텐츠", rating: 4.8, reviews: 31, completionRate: 96, responseTime: "1시간", color: "from-emerald-500 to-teal-600", image: "photo-1505739998589-00fc191ce01d", service: "상담 콘텐츠 영상 제작", price: 130000, portfolioImages: ["photo-1536240478700-b869070f9279", "photo-1535016120720-40c646be5580", "photo-1550745165-9bc0b252726f"], badge: "PRO" },
];

// 공모전 출품작 데이터
const contestEntries = [
  { id: 1, title: "네온시티 체이스", author: "김영상", image: "photo-1536240478700-b869070f9279", category: "AI 영상" },
  { id: 2, title: "사이버 워리어", author: "이모션", image: "photo-1535016120720-40c646be5580", category: "모션그래픽" },
  { id: 3, title: "미래도시", author: "박프로", image: "photo-1550745165-9bc0b252726f", category: "3D 렌더링" },
  { id: 4, title: "일상 속 마법", author: "최아트", image: "photo-1574717024653-61fd2cf4d44d", category: "숏폼" },
  { id: 5, title: "코스믹 댄스", author: "정크리", image: "photo-1492691527719-9d1e07e534b4", category: "AI 영상" },
  { id: 6, title: "도시의 빛", author: "한비주", image: "photo-1505739998589-00fc191ce01d", category: "광고 영상" },
  { id: 7, title: "자연의 숨결", author: "윤감독", image: "photo-1598488035139-bdbb2231ce04", category: "드론 촬영" },
  { id: 8, title: "디지털 블룸", author: "송피디", image: "photo-1611532736597-de2d4265fba3", category: "모션그래픽" },
  { id: 9, title: "스틸 라이프", author: "강작가", image: "photo-1677442136019-21780ecad995", category: "AI 이미지" },
];


export default function HomePage() {
  const popularServices = [...services]
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  const topRatedServices = [...services]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const latestServices = [...services]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-white">

      {/* ===== HERO — 넷플릭스 시네마틱 + 크몽 검색 ===== */}
      <section className="relative h-[480px] md:h-[520px] overflow-hidden">
        {/* 배경 이미지 */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1920&h=800&fit=crop"
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        </div>

        <div className="container mx-auto px-4 relative h-full flex flex-col justify-center">
          <div className="max-w-2xl">
            {/* 배지 */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-5 border border-white/15">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs text-white/90 font-medium">300+ 검증된 영상 전문가</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.1] tracking-tight">
              영상이 필요한 순간,{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">뚝딱</span>
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
              AI 영상 · 모션그래픽 · 유튜브 편집 · 숏폼까지
              <br className="hidden md:block" />
              전문가에게 맡기고 결과만 받으세요
            </p>

            {/* 검색창 — 크몽 스타일 */}
            <form action="/search" className="relative max-w-xl mb-5">
              <div className="flex items-center bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
                <div className="flex items-center flex-1 px-5 py-4">
                  <Search className="h-5 w-5 text-slate-300 mr-3 shrink-0" />
                  <input
                    type="text"
                    name="q"
                    placeholder="어떤 영상이 필요하세요?"
                    className="flex-1 text-base text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 text-sm transition-colors shrink-0 m-1.5 rounded-xl"
                >
                  검색
                </button>
              </div>
            </form>

            {/* 인기 검색어 */}
            <div className="flex flex-wrap gap-1.5">
              {popularSearches.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="text-xs text-white/50 hover:text-white border border-white/15 hover:border-white/40 rounded-full px-3 py-1 transition-all hover:bg-white/10"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 지금 인기있는 서비스 — 넷플릭스 로우 ===== */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50">
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">지금 인기있는 서비스</h2>
            </div>
            <Link href="/categories" className="text-sm text-slate-400 hover:text-orange-500 flex items-center gap-0.5 transition-colors">
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <HorizontalScrollRow>
            {popularServices.map((service) => (
              <div key={service.id} className="min-w-[260px] max-w-[280px] snap-start shrink-0">
                <ServiceCard
                  service={service}
                  expert={getExpertById(service.expertId)}
                />
              </div>
            ))}
          </HorizontalScrollRow>
        </div>
      </section>

      {/* ===== 카테고리 탐색 — 2행 그리드 ===== */}
      <section className="py-10 md:py-14 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-50">
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">카테고리 탐색</h2>
          </div>

          {(() => {
            const homeCats = [
              // 1행 — 대분류 8개
              { name: "영상", slug: "video", icon: "Play", count: 342 },
              { name: "CG", slug: "cg", icon: "Zap", count: 156 },
              { name: "애니메이션", slug: "animation", icon: "Layers", count: 98 },
              { name: "AI 콘텐츠", slug: "ai-content", icon: "Sparkles", count: 124 },
              { name: "사진", slug: "photo", icon: "ImageIcon", count: 87 },
              { name: "음향", slug: "audio", icon: "Volume2", count: 93 },
              { name: "엔터테이너", slug: "entertainer", icon: "UserCircle", count: 45 },
              { name: "기타", slug: "etc", icon: "LayoutGrid", count: 38 },
              // 2행 — 인기 서브카테고리 8개
              { name: "숏폼", slug: "short-form", icon: "Smartphone", count: 68 },
              { name: "유튜브", slug: "youtube", icon: "Play", count: 56 },
              { name: "광고·홍보", slug: "ad-video", icon: "ShoppingBag", count: 52 },
              { name: "모션그래픽", slug: "motion-graphic", icon: "Wand2", count: 48 },
              { name: "제품 영상", slug: "product-video", icon: "Box", count: 41 },
              { name: "AI 영상", slug: "ai-video", icon: "Film", count: 67 },
              { name: "3D 모델링", slug: "3d-modeling", icon: "Gamepad2", count: 35 },
              { name: "성우·나레이션", slug: "voice-acting", icon: "Mic", count: 42 },
            ];
            const gradients = [
              "from-orange-500 to-red-500",
              "from-violet-600 to-purple-700",
              "from-sky-500 to-blue-600",
              "from-emerald-500 to-teal-600",
              "from-rose-500 to-pink-600",
              "from-amber-500 to-orange-600",
              "from-slate-600 to-slate-700",
              "from-indigo-500 to-violet-600",
              "from-pink-500 to-rose-600",
              "from-red-500 to-orange-500",
              "from-blue-500 to-indigo-600",
              "from-teal-500 to-cyan-600",
              "from-fuchsia-500 to-purple-600",
              "from-cyan-500 to-sky-600",
              "from-lime-600 to-emerald-600",
              "from-yellow-500 to-amber-600",
            ];
            return (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {homeCats.map((cat, i) => {
                  const Icon = iconMap[cat.icon] || Sparkles;
                  return (
                    <Link key={cat.slug} href={`/category/${cat.slug}`}>
                      <div className={`relative h-[100px] rounded-2xl bg-gradient-to-br ${gradients[i % gradients.length]} p-3 flex flex-col justify-between group overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
                        <Icon className="h-5 w-5 text-white/60" />
                        <div>
                          <p className="text-white font-bold text-xs leading-tight">{cat.name}</p>
                          <p className="text-white/50 text-[10px] mt-0.5">{cat.count}개</p>
                        </div>
                        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="h-3 w-3 text-white/80" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </section>

      {/* ===== 추천 전문가 — 시네마틱 포트폴리오 ===== */}
      <section className="py-10 md:py-14 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50">
                <Sparkles className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">추천 전문가</h2>
                <p className="text-xs text-slate-400 mt-0.5">뚝딱이 엄선한 최고의 크리에이터</p>
              </div>
            </div>
            <Link href="/experts" className="text-sm text-slate-400 hover:text-orange-500 flex items-center gap-0.5 transition-colors">
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredExperts.map((expert) => (
              <Link key={expert.name} href={`/experts/${expert.name}`} className="group">
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {/* 포트폴리오 썸네일 갤러리 */}
                  <div className="relative h-[200px] overflow-hidden">
                    {/* 메인 이미지 */}
                    <Image src={`https://images.unsplash.com/${expert.image}?w=500&h=300&fit=crop`} alt={expert.service} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* 배지 */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                        expert.badge === "TOP" ? "bg-orange-500 text-white" :
                        expert.badge === "HOT" ? "bg-rose-500 text-white" :
                        expert.badge === "FAST" ? "bg-emerald-500 text-white" :
                        "bg-violet-500 text-white"
                      }`}>
                        {expert.badge === "TOP" && <><TrendingUp className="h-3 w-3 mr-1" />TOP</>}
                        {expert.badge === "HOT" && <><Flame className="h-3 w-3 mr-1" />HOT</>}
                        {expert.badge === "FAST" && <><Zap className="h-3 w-3 mr-1" />FAST</>}
                        {expert.badge === "PRO" && <><Award className="h-3 w-3 mr-1" />PRO</>}
                      </span>
                    </div>

                    {/* 호버 재생 버튼 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* 미니 포트폴리오 갤러리 (하단) */}
                    <div className="absolute bottom-3 left-3 right-3 flex gap-1.5">
                      {expert.portfolioImages.map((img, i) => (
                        <div key={i} className="relative h-10 flex-1 rounded-lg overflow-hidden ring-1 ring-white/20">
                          <Image src={`https://images.unsplash.com/${img}?w=120&h=60&fit=crop`} alt="" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 카드 바디 */}
                  <div className="p-4">
                    {/* 프로필 + 평점 */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${expert.color} flex items-center justify-center shrink-0 ring-2 ring-white shadow-md`}>
                        <span className="text-white font-bold text-sm">{expert.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-slate-900">{expert.name}</p>
                          <Shield className="h-3.5 w-3.5 text-orange-500" />
                        </div>
                        <p className="text-xs text-slate-400 truncate">{expert.specialty}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-600">{expert.rating}</span>
                      </div>
                    </div>

                    {/* 대표 서비스 */}
                    <p className="text-sm text-slate-700 font-medium mb-3 line-clamp-1 group-hover:text-orange-600 transition-colors">{expert.service}</p>

                    {/* 하단 — 가격 + 통계 */}
                    <div className="flex items-end justify-between pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400">시작가</p>
                        <p className="text-lg font-bold text-slate-900">{new Intl.NumberFormat("ko-KR").format(expert.price)}<span className="text-xs font-normal text-slate-400">원~</span></p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>리뷰 <b className="text-slate-600">{expert.reviews}</b></span>
                        <span>응답 <b className="text-slate-600">{expert.responseTime}</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 공모전 출품작 — 벤토 그리드 ===== */}
      <section className="py-12 md:py-16 bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Award className="h-4.5 w-4.5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">공모전 출품작</h2>
                <p className="text-xs text-slate-500 mt-0.5">제1회 뚝딱 AI 영상 공모전 참가작</p>
              </div>
            </div>
            <Link href="/contest" className="text-sm text-slate-500 hover:text-amber-400 flex items-center gap-1 transition-colors">
              전체 보기 <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 벤토 그리드 — 왼쪽 대형 + 오른쪽 2x3 */}
          <div className="flex gap-2.5">
            {/* 대형 카드 */}
            <Link href={`/contest/${contestEntries[0].id}`} className="relative w-[400px] shrink-0 h-[340px] rounded-2xl overflow-hidden group">
              <Image src={`https://images.unsplash.com/${contestEntries[0].image}?w=600&h=400&fit=crop`} alt={contestEntries[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="inline-flex bg-orange-500 rounded-full px-2.5 py-0.5 mb-2">
                  <span className="text-white text-[10px] font-bold">대상</span>
                </div>
                <p className="text-white font-bold text-lg">{contestEntries[0].title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/60 text-xs">{contestEntries[0].author}</span>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="text-orange-400/80 text-xs">{contestEntries[0].category}</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            </Link>

            {/* 오른쪽 2행 3열 */}
            <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-2.5">
              {contestEntries.slice(1, 7).map((entry) => (
                <Link key={entry.id} href={`/contest/${entry.id}`} className="relative rounded-2xl overflow-hidden group">
                  <Image src={`https://images.unsplash.com/${entry.image}?w=400&h=200&fit=crop`} alt={entry.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white font-semibold text-sm">{entry.title}</p>
                    <span className="text-white/50 text-xs">{entry.author}</span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 공모전 참가 CTA */}
          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/contest/apply"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
            >
              <Trophy className="h-4 w-4" />
              제2회 공모전 참가하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 페르소나 큐레이션 — 유튜버 ===== */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50">
                <Play className="h-4 w-4 text-red-500 fill-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">유튜버가 많이 찾아요</h2>
                <p className="text-xs text-slate-400 mt-0.5">유튜브 채널 운영에 필요한 인기 서비스</p>
              </div>
            </div>
            <Link href="/search?q=유튜브" className="text-sm text-slate-400 hover:text-orange-500 flex items-center gap-0.5 transition-colors">
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <HorizontalScrollRow>
            {[...services]
              .filter((s) => s.tags.some((t) => ["유튜브", "편집", "숏폼", "썸네일", "인트로"].includes(t)))
              .sort((a, b) => b.salesCount - a.salesCount)
              .slice(0, 8)
              .map((service) => (
                <div key={service.id} className="min-w-[260px] max-w-[280px] snap-start shrink-0">
                  <ServiceCard
                    service={service}
                    expert={getExpertById(service.expertId)}
                  />
                </div>
              ))}
            {/* 데이터 부족 시 인기 서비스로 채움 */}
            {[...services]
              .filter((s) => s.tags.some((t) => ["유튜브", "편집", "숏폼", "썸네일", "인트로"].includes(t)))
              .length < 5 && popularServices.map((service) => (
                <div key={`yt-${service.id}`} className="min-w-[260px] max-w-[280px] snap-start shrink-0">
                  <ServiceCard
                    service={service}
                    expert={getExpertById(service.expertId)}
                  />
                </div>
              ))}
          </HorizontalScrollRow>
        </div>
      </section>

      {/* ===== 페르소나 큐레이션 — 스타트업 마케터 ===== */}
      <section className="py-10 md:py-14 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">스타트업 마케터가 많이 찾아요</h2>
                <p className="text-xs text-slate-400 mt-0.5">제품 홍보·광고에 많이 이용하는 서비스</p>
              </div>
            </div>
            <Link href="/search?q=광고" className="text-sm text-slate-400 hover:text-orange-500 flex items-center gap-0.5 transition-colors">
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <HorizontalScrollRow>
            {[...services]
              .filter((s) => s.tags.some((t) => ["광고", "홍보", "제품", "마케팅", "브랜드", "SNS"].includes(t)))
              .sort((a, b) => b.salesCount - a.salesCount)
              .slice(0, 8)
              .map((service) => (
                <div key={service.id} className="min-w-[260px] max-w-[280px] snap-start shrink-0">
                  <ServiceCard
                    service={service}
                    expert={getExpertById(service.expertId)}
                  />
                </div>
              ))}
            {[...services]
              .filter((s) => s.tags.some((t) => ["광고", "홍보", "제품", "마케팅", "브랜드", "SNS"].includes(t)))
              .length < 5 && topRatedServices.map((service) => (
                <div key={`mk-${service.id}`} className="min-w-[260px] max-w-[280px] snap-start shrink-0">
                  <ServiceCard
                    service={service}
                    expert={getExpertById(service.expertId)}
                  />
                </div>
              ))}
          </HorizontalScrollRow>
        </div>
      </section>

      {/* ===== 최고 평점 — 넷플릭스 로우 ===== */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">최고 평점 서비스</h2>
            </div>
            <Link href="/search?sort=rating" className="text-sm text-slate-400 hover:text-orange-500 flex items-center gap-0.5 transition-colors">
              더보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <HorizontalScrollRow>
            {topRatedServices.map((service) => (
              <div key={service.id} className="min-w-[260px] max-w-[280px] snap-start shrink-0">
                <ServiceCard
                  service={service}
                  expert={getExpertById(service.expertId)}
                />
              </div>
            ))}
          </HorizontalScrollRow>
        </div>
      </section>

      {/* ===== 새로 올라온 서비스 — 넷플릭스 로우 ===== */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50">
                <Zap className="h-4 w-4 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">새로 올라온 서비스</h2>
            </div>
            <Link href="/search?sort=latest" className="text-sm text-slate-400 hover:text-orange-500 flex items-center gap-0.5 transition-colors">
              더보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <HorizontalScrollRow>
            {latestServices.map((service) => (
              <div key={service.id} className="min-w-[260px] max-w-[280px] snap-start shrink-0">
                <ServiceCard
                  service={service}
                  expert={getExpertById(service.expertId)}
                />
              </div>
            ))}
          </HorizontalScrollRow>
        </div>
      </section>


      {/* ===== 전문가 등록 CTA — 넷플릭스 시네마틱 ===== */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&h=600&fit=crop"
            alt="CTA background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/60" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
              영상 전문가이신가요?
            </h2>
            <p className="text-slate-400 text-base mb-8 leading-relaxed">
              뚝딱에서 재능을 판매하고 수익을 창출하세요.
              <br />
              이미 300명 이상의 전문가가 활동하고 있습니다.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/expert/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold px-7 py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/25"
              >
                전문가로 시작하기 <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/guide"
                className="inline-flex items-center border border-white/20 text-white/80 px-7 py-3.5 rounded-xl text-sm hover:bg-white/10 hover:border-white/30 transition-all"
              >
                이용 가이드
              </Link>
            </div>

            <div className="flex gap-10">
              {[
                { value: "300+", label: "전문가" },
                { value: "10K+", label: "프로젝트" },
                { value: "4.9", label: "평균 평점" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-extrabold text-white font-number">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
