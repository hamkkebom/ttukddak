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
import { getCategories, getServices, getExperts } from "@/lib/db-server";
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

// 추천 전문가 데이터 (실제 프리랜서 + 로컬 썸네일)
const featuredExperts = [
  { name: "새론", specialty: "AI 제품광고 · 시네마틱 영상", rating: 4.9, reviews: 59, completionRate: 99, responseTime: "1시간", color: "from-orange-500 to-red-500", image: "/thumbnails/expert-saeron.jpg", service: "AI 제품광고 영상 제작", price: 150000, portfolioImages: ["/thumbnails/expert-saeron-p1.jpg", "/thumbnails/expert-saeron-p2.jpg", "/thumbnails/expert-saeron-p3.jpg"], badge: "TOP" },
  { name: "버들", specialty: "유튜브 편집 · 숏폼 제작", rating: 4.8, reviews: 41, completionRate: 99, responseTime: "1시간", color: "from-violet-500 to-purple-600", image: "/thumbnails/expert-beodeul.jpg", service: "유튜브 채널 편집 패키지", price: 120000, portfolioImages: ["/thumbnails/expert-beodeul-p1.jpg", "/thumbnails/expert-beodeul-p2.jpg", "/thumbnails/expert-beodeul-p3.jpg"], badge: "HOT" },
  { name: "아이", specialty: "모션그래픽 · 3D 렌더링", rating: 4.9, reviews: 38, completionRate: 97, responseTime: "2시간", color: "from-cyan-500 to-blue-600", image: "/thumbnails/expert-ai.jpg", service: "모션그래픽 인포 영상 제작", price: 100000, portfolioImages: ["/thumbnails/expert-ai-p1.jpg", "/thumbnails/expert-ai-p2.jpg", "/thumbnails/expert-ai-p3.jpg"], badge: "FAST" },
  { name: "산다라", specialty: "기업 홍보 · 브랜딩 영상", rating: 4.8, reviews: 31, completionRate: 96, responseTime: "1시간", color: "from-emerald-500 to-teal-600", image: "/thumbnails/expert-sandara.jpg", service: "기업 브랜딩 영상 제작", price: 130000, portfolioImages: ["/thumbnails/expert-sandara-p1.jpg", "/thumbnails/expert-sandara-p2.jpg", "/thumbnails/expert-sandara-p3.jpg"], badge: "PRO" },
];

// 크리에이터 작품 데이터 (AI 영상 공모전 출품작)
const contestEntries = [
  { id: 1, title: "AI 시네마틱 제품광고", author: "새론", image: "/thumbnails/contest-1.jpg", category: "제품광고" },
  { id: 2, title: "AI 브랜드 소개 영상", author: "박건우", image: "/thumbnails/contest-2.jpg", category: "기업홍보" },
  { id: 3, title: "AI 뮤직비디오", author: "여울", image: "/thumbnails/contest-3.jpg", category: "뮤직비디오" },
  { id: 4, title: "AI 모션그래픽 인포", author: "아이", image: "/thumbnails/contest-4.jpg", category: "모션그래픽" },
  { id: 5, title: "AI 숏폼 바이럴 영상", author: "버들", image: "/thumbnails/contest-5.jpg", category: "숏폼" },
  { id: 6, title: "AI 건축 시각화", author: "샛별", image: "/thumbnails/contest-6.jpg", category: "3D렌더링" },
  { id: 7, title: "AI 여행 시네마틱", author: "산다라", image: "/thumbnails/contest-7.jpg", category: "여행영상" },
  { id: 8, title: "AI 교육 다큐멘터리", author: "해솔", image: "/thumbnails/contest-8.jpg", category: "교육영상" },
  { id: 9, title: "AI 애니메이션 단편", author: "꿈돌", image: "/thumbnails/contest-9.jpg", category: "애니메이션" },
];


export default async function HomePage() {
  const [categories, allServices, expertsResult] = await Promise.all([
    getCategories(),
    getServices(20),
    getExperts(20),
  ]);
  const experts = expertsResult.experts;

  // 시드 기반 셔플 (매 시간 변경)
  const seed = Math.floor(Date.now() / 3600000);
  function seededShuffle<T>(arr: T[], s: number): T[] {
    const a = [...arr];
    let h = s;
    for (let i = a.length - 1; i > 0; i--) {
      h = (h * 16807 + 12345) & 0x7fffffff;
      const j = h % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const popularServices = [...allServices]
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 8);

  const topRatedServices = seededShuffle(
    [...allServices].sort((a, b) => b.rating - a.rating),
    seed + 1
  ).slice(0, 8);

  const latestServices = seededShuffle(
    [...allServices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    seed + 2
  ).slice(0, 8);

  // 페르소나별 서비스 - 태그 기반 필터
  const creatorTags = ["유튜브", "숏폼", "편집", "SNS", "바이럴", "릴스", "콘텐츠"];
  const brandTags = ["광고", "홍보", "브랜딩", "제품", "기업", "마케팅", "브랜드"];

  const creatorServices = seededShuffle(
    allServices.filter(s => s.tags.some(t => creatorTags.includes(t))),
    seed + 3
  ).slice(0, 8);

  const brandServices = seededShuffle(
    allServices.filter(s => s.tags.some(t => brandTags.includes(t))),
    seed + 4
  ).slice(0, 8);

  return (
    <div className="min-h-screen bg-white">

      {/* ===== HERO — 애니메이션 배경 + 크몽 검색 ===== */}
      <section className="relative h-[480px] md:h-[520px] overflow-hidden">
        {/* 애니메이션 그라데이션 배경 */}
        <div className="absolute inset-0 animate-gradient-shift" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 20%, #312e81 40%, #4c1d95 60%, #581c87 80%, #0f172a 100%)", backgroundSize: "400% 400%" }} />
        {/* 떠다니는 빛 효과 */}
        <div className="absolute top-[20%] right-[15%] w-[500px] h-[500px] rounded-full bg-purple-500/15 blur-[120px] animate-hero-float" />
        <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] animate-hero-float-reverse" />
        <div className="absolute top-[40%] right-[40%] w-[300px] h-[300px] rounded-full bg-pink-500/10 blur-[80px] animate-hero-float-slow" />
        {/* 격자 패턴 */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* 텍스트 보호 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

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
                  expert={experts.find(e => e.id === service.expertId)}
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
                    <Image src={expert.image} alt={expert.service} fill sizes="(max-width: 640px) 100vw, 25vw" unoptimized className="object-cover group-hover:scale-110 transition-transform duration-700" />
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
                          <Image src={img} alt="" fill sizes="80px" unoptimized className="object-cover" />
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
              <Image src={contestEntries[0].image} alt={contestEntries[0].title} fill sizes="400px" unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
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
                  <Image src={entry.image} alt={entry.title} fill sizes="200px" unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
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

      {/* ===== 페르소나 큐레이션 — 이런 분들이 찾아요 ===== */}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50">
                <Play className="h-4 w-4 text-red-500 fill-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">콘텐츠 크리에이터가 많이 찾아요</h2>
                <p className="text-xs text-slate-400 mt-0.5">영상 콘텐츠 제작에 인기 있는 서비스</p>
              </div>
            </div>
            <Link href="/categories" className="text-sm text-slate-400 hover:text-orange-500 flex items-center gap-0.5 transition-colors">
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <HorizontalScrollRow>
            {creatorServices.map((service) => (
              <div key={service.id} className="min-w-[260px] max-w-[280px] snap-start shrink-0">
                <ServiceCard
                  service={service}
                  expert={experts.find(e => e.id === service.expertId)}
                />
              </div>
            ))}
          </HorizontalScrollRow>
        </div>
      </section>

      {/* ===== 페르소나 큐레이션 — 브랜딩 ===== */}
      <section className="py-10 md:py-14 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">브랜딩·홍보 영상이 필요하다면</h2>
                <p className="text-xs text-slate-400 mt-0.5">퍼스널 브랜딩과 소개 영상 전문가</p>
              </div>
            </div>
            <Link href="/categories" className="text-sm text-slate-400 hover:text-orange-500 flex items-center gap-0.5 transition-colors">
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <HorizontalScrollRow>
            {brandServices.map((service) => (
              <div key={service.id} className="min-w-[260px] max-w-[280px] snap-start shrink-0">
                <ServiceCard
                  service={service}
                  expert={experts.find(e => e.id === service.expertId)}
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
                  expert={experts.find(e => e.id === service.expertId)}
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
                  expert={experts.find(e => e.id === service.expertId)}
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
            src="/thumbnails/cta-bg.jpg"
            alt="CTA background"
            fill
            sizes="100vw"
            unoptimized
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
