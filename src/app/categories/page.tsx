import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles, Zap, Layers, Box, Play, ShoppingBag,
  Building, Music, Heart, GraduationCap, ArrowRight, Star, Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategories, getServicesByCategory } from "@/lib/db-server";

export const metadata: Metadata = {
  title: "전체 카테고리 | 뚝딱",
  description: "AI 영상 생성, 모션그래픽, 유튜브 편집 등 다양한 영상 서비스 카테고리를 둘러보세요.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Zap,
  Layers,
  Box,
  Play,
  ShoppingBag,
  Building,
  Music,
  Heart,
  GraduationCap,
};

// 카테고리별 이미지 (Gemini로 생성 후 교체)
const categoryImages: Record<string, string> = {
  "ai-video": "https://picsum.photos/seed/cat-ai/600/400",
  "motion-graphics": "https://picsum.photos/seed/cat-motion/600/400",
  "2d-animation": "https://picsum.photos/seed/cat-2d/600/400",
  "3d-animation": "https://picsum.photos/seed/cat-3d/600/400",
  "youtube-shorts": "https://picsum.photos/seed/cat-youtube/600/400",
  "product-ad": "https://picsum.photos/seed/cat-product/600/400",
  "corporate": "https://picsum.photos/seed/cat-corp/600/400",
  "music-video": "https://picsum.photos/seed/cat-music/600/400",
  "wedding-event": "https://picsum.photos/seed/cat-wedding/600/400",
  "education": "https://picsum.photos/seed/cat-edu/600/400",
};

// 카테고리별 그라데이션
const categoryGradients: Record<string, string> = {
  "ai-video": "from-orange-500/90 to-red-600/90",
  "motion-graphics": "from-purple-500/90 to-pink-600/90",
  "2d-animation": "from-cyan-500/90 to-blue-600/90",
  "3d-animation": "from-emerald-500/90 to-teal-600/90",
  "youtube-shorts": "from-red-500/90 to-rose-600/90",
  "product-ad": "from-amber-500/90 to-orange-600/90",
  "corporate": "from-slate-600/90 to-slate-800/90",
  "music-video": "from-violet-500/90 to-purple-600/90",
  "wedding-event": "from-pink-400/90 to-rose-500/90",
  "education": "from-blue-500/90 to-indigo-600/90",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  // Fetch services for each category in parallel
  const categoryServices = await Promise.all(
    categories.map((cat) => getServicesByCategory(cat.id))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Header */}
      <section className="relative bg-slate-900 py-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-[120px]" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="container relative mx-auto px-4 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" />
            전체 카테고리
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI 영상 제작의 <span className="text-primary">모든 분야</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            10개 카테고리에서 300명 이상의 검증된 전문가를 만나보세요.
            <br className="hidden sm:block" />
            당신의 프로젝트에 딱 맞는 전문가가 기다리고 있습니다.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-10">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10<span className="text-primary">+</span></p>
              <p className="text-sm text-slate-400">카테고리</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">300<span className="text-primary">+</span></p>
              <p className="text-sm text-slate-400">전문가</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">2,330<span className="text-primary">+</span></p>
              <p className="text-sm text-slate-400">서비스</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const Icon = iconMap[category.icon] || Sparkles;
              const services = categoryServices[index] || [];
              const avgRating = services.length > 0
                ? (services.reduce((sum, s) => sum + s.rating, 0) / services.length).toFixed(1)
                : "0.0";
              const gradient = categoryGradients[category.slug] || "from-gray-500/90 to-gray-700/90";
              const image = categoryImages[category.slug] || "https://picsum.photos/seed/default/600/400";

              return (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <Card className="group h-full overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    {/* Image Header */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={image}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

                      {/* Content Overlay */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          {index === 0 && (
                            <Badge className="bg-white text-primary border-0 shadow-lg">
                              <Sparkles className="h-3 w-3 mr-1" />
                              HOT
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">
                            {category.name}
                          </h2>
                          <p className="text-sm text-white/80 line-clamp-2">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium">{services.length}개</span>
                            <span className="text-sm text-slate-400">서비스</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-medium">{avgRating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-primary font-medium text-sm group-hover:gap-2 transition-all">
                          둘러보기
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            원하는 카테고리를 찾지 못하셨나요?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            직접 문의해주시면 최적의 전문가를 연결해 드리겠습니다.
            <br />
            모든 영상 제작 분야에 대응 가능합니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-full transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              서비스 검색하기
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition-colors"
            >
              자주 묻는 질문
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
