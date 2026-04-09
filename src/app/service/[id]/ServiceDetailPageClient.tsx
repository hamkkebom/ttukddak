"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ChevronRight, ChevronDown, Star, Heart, Share2, Clock, Zap, Award,
  CheckCircle, MessageCircle, Calendar, RefreshCw, Play, Shield,
  Globe, User, ThumbsUp, Flag, ArrowRight, Bookmark, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Service, Expert, Category } from "@/types";
import { cn } from "@/lib/utils";
import { InquiryModal } from "@/components/InquiryModal";
import { extractStreamUid } from "@/components/VideoThumbnail";

const cfIframe = (uid: string) => `https://iframe.videodelivery.net/${uid}`;
const cfThumb = (uid: string) => `https://customer-6q1yzz06ggg2ef4g.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg?width=640&height=360&fit=crop`;
const cfThumbSmall = (uid: string) => `https://customer-6q1yzz06ggg2ef4g.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg?width=192&height=108&fit=crop`;

export default function ServiceDetailPageClient({
  service,
  expert,
  category,
  expertServices,
}: {
  service: Service;
  expert: Expert;
  category: Category;
  expertServices: Service[];
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(1);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [reviewFilter, setReviewFilter] = useState<number | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [galleryPlaying, setGalleryPlaying] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  const images = [service.thumbnail, ...service.images];

  // FAQ 데이터
  const faqs = [
    { q: "작업 진행 과정은 어떻게 되나요?", a: "결제 후 요구사항을 전달해주시면, 초안 작업 → 피드백 → 수정 → 최종 납품 순서로 진행됩니다. 각 단계별로 실시간 소통이 가능합니다." },
    { q: "수정은 몇 번까지 가능한가요?", a: "선택하신 패키지에 따라 다릅니다. 기본 패키지는 1회, 스탠다드는 2회, 프리미엄은 무제한 수정이 가능합니다." },
    { q: "소스 파일도 제공되나요?", a: "프리미엄 패키지에는 소스 파일(프로젝트 파일)이 포함되어 있습니다. 기본/스탠다드 패키지는 완성본(MP4)만 제공됩니다." },
    { q: "급하게 필요한 경우 빠른 작업이 가능한가요?", a: "네, 급행 옵션을 추가하시면 표준 작업 기간의 50% 단축이 가능합니다. 추가 비용이 발생할 수 있으니 문의해주세요." },
    { q: "촬영도 직접 해주시나요?", a: "본 서비스는 편집/제작 서비스입니다. 촬영이 필요한 경우 별도 협의가 필요합니다. 스톡 영상 활용은 가능합니다." },
  ];

  // 리뷰 데이터
  const reviews = [
    { name: "김**", rating: 5, date: "2024.03.15", text: "기대 이상의 퀄리티였습니다. 소통도 정말 빠르고, 수정 요청에도 친절하게 대응해주셨어요. 다음 프로젝트도 꼭 맡기고 싶습니다!", helpful: 24, package: "스탠다드" },
    { name: "이**", rating: 5, date: "2024.03.08", text: "브랜드 영상을 의뢰했는데 정말 만족스럽습니다. 특히 모션그래픽 퀄리티가 탁월하네요. 주변에도 추천했습니다.", helpful: 18, package: "프리미엄" },
    { name: "박**", rating: 4, date: "2024.02.28", text: "전체적으로 좋았으나 초안 작업에 시간이 조금 더 걸렸습니다. 하지만 최종 결과물은 매우 만족스러웠어요.", helpful: 12, package: "스탠다드" },
    { name: "최**", rating: 5, date: "2024.02.20", text: "유튜브 인트로 영상을 맡겼는데, 구독자들 반응이 정말 좋아요! 센스 있는 편집이 돋보입니다. 강력 추천합니다.", helpful: 31, package: "기본" },
    { name: "정**", rating: 5, date: "2024.02.14", text: "세 번째 의뢰인데 항상 만족합니다. 제 의도를 정확하게 파악하시고 기대 이상으로 작업해주세요.", helpful: 15, package: "프리미엄" },
    { name: "한**", rating: 4, date: "2024.02.05", text: "가격 대비 좋은 퀄리티입니다. 다만 BGM 선택지가 좀 더 다양했으면 좋겠어요. 전반적으로 추천!", helpful: 8, package: "기본" },
  ];

  const filteredReviews = reviewFilter ? reviews.filter(r => r.rating === reviewFilter) : reviews;
  const ratingDist = [5, 4, 3, 2, 1].map(r => ({ star: r, count: reviews.filter(rv => rv.rating === r).length }));

  const packageLabels = ["기본", "스탠다드", "프리미엄"];
  const packageColors = [
    "border-slate-200 hover:border-slate-300",
    "border-orange-300 ring-1 ring-orange-100",
    "border-violet-300 hover:border-violet-400",
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Breadcrumb */}
      <div className="border-b bg-slate-50">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">홈</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <Link href={`/category/${category.slug}`} className="text-slate-400 hover:text-slate-600 transition-colors">{category.name}</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="text-slate-600 font-medium truncate max-w-[240px]">{service.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* ========== LEFT COLUMN ========== */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 group cursor-pointer"
                onClick={() => {
                  const uid = extractStreamUid(images[selectedImage]);
                  if (uid && !galleryPlaying) setGalleryPlaying(true);
                }}
              >
                {(() => {
                  const uid = extractStreamUid(images[selectedImage]);
                  if (uid && galleryPlaying) {
                    return (
                      <iframe
                        src={`${cfIframe(uid)}?autoplay=true&muted=false`}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="autoplay; encrypted-media; fullscreen"
                        title={service.title}
                      />
                    );
                  }
                  if (uid) {
                    return (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cfThumb(uid)} alt={service.title} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-70 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 shadow-xl">
                            <Play className="h-7 w-7 text-slate-800 fill-slate-800 ml-1" />
                          </div>
                        </div>
                      </>
                    );
                  }
                  return (
                    <>
                      <Image src={images[selectedImage]} alt={service.title} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 shadow-xl">
                          <Play className="h-7 w-7 text-slate-800 fill-slate-800 ml-1" />
                        </div>
                      </div>
                    </>
                  );
                })()}
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2 z-10">
                  {service.isPrime && (
                    <Badge className="bg-orange-500 text-white border-0 shadow-lg">
                      <Zap className="h-3 w-3 mr-1" />프라임
                    </Badge>
                  )}
                  {service.isFastResponse && (
                    <Badge className="bg-emerald-500 text-white border-0 shadow-lg">
                      <Zap className="h-3 w-3 mr-1" />빠른응답
                    </Badge>
                  )}
                </div>
                {/* Image counter */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                  {selectedImage + 1} / {images.length}
                </div>
              </div>
              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, index) => {
                  const uid = extractStreamUid(img);
                  return (
                    <button
                      key={index}
                      onClick={() => { setSelectedImage(index); setGalleryPlaying(false); }}
                      className={cn(
                        "relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                        selectedImage === index ? "border-orange-500 shadow-md" : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {uid ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={cfThumbSmall(uid)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Image src={img} alt="" fill className="object-cover" />
                      )}
                      {uid && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-4 w-4 text-white fill-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Meta */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-4">{service.title}</h1>
              <div className="flex flex-wrap items-center gap-4">
                {/* Seller mini */}
                <Link href={`/expert/${expert.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                    <AvatarImage src={expert.profileImage} alt={expert.name} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs">{expert.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm text-slate-700">{expert.name}</span>
                  {expert.isMaster && (
                    <Badge variant="outline" className="h-5 text-[10px] gap-0.5 px-1.5 bg-amber-50 border-amber-200 text-amber-700">
                      <Award className="h-3 w-3" />마스터
                    </Badge>
                  )}
                </Link>
                <Separator orientation="vertical" className="h-4" />
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-4 w-4", i < Math.round(service.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                    ))}
                  </div>
                  <span className="font-bold text-sm">{service.rating.toFixed(1)}</span>
                  <span className="text-slate-400 text-sm">({service.reviewCount})</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-slate-400 text-sm">{service.salesCount}회 판매</span>

                {/* Actions */}
                <div className="flex-1" />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 gap-1.5 text-xs">
                    <Heart className="h-4 w-4" /> 저장
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 gap-1.5 text-xs">
                    <Share2 className="h-4 w-4" /> 공유
                  </Button>
                </div>
              </div>
            </div>

            {/* ===== Package Tabs (Mobile visible, Desktop hidden) ===== */}
            <div className="lg:hidden">
              <PackageSection
                service={service}
                selectedPackage={selectedPackage}
                setSelectedPackage={setSelectedPackage}
                formatPrice={formatPrice}
                packageLabels={packageLabels}
                packageColors={packageColors}
                onInquiry={() => setIsInquiryOpen(true)}
              />
            </div>

            {/* ===== Service Description ===== */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">서비스 설명</h2>
              <div className={cn("relative", !showFullDesc && "max-h-[280px] overflow-hidden")}>
                <div className="prose prose-sm prose-slate max-w-none">
                  <div className="whitespace-pre-line text-slate-600 leading-relaxed">{service.description}</div>
                </div>
                {!showFullDesc && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
                )}
              </div>
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-2 text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1 transition-colors"
              >
                {showFullDesc ? "접기" : "더보기"}
                <ChevronDown className={cn("h-4 w-4 transition-transform", showFullDesc && "rotate-180")} />
              </button>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {service.tags.map((tag) => (
                  <Link key={tag} href={`/search?q=${tag}`}>
                    <Badge variant="secondary" className="hover:bg-slate-200 cursor-pointer transition-colors">#{tag}</Badge>
                  </Link>
                ))}
              </div>
            </div>

            <Separator />

            {/* ===== About the Seller ===== */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-6">전문가 소개</h2>
              <div className="bg-slate-50 rounded-2xl p-6">
                <div className="flex items-start gap-5">
                  <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                    <AvatarImage src={expert.profileImage} alt={expert.name} />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-xl">{expert.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-900">{expert.name}</h3>
                      {expert.isMaster && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                          <Award className="h-3 w-3" />마스터
                        </Badge>
                      )}
                      {expert.isPrime && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">프라임</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-3">{expert.title}</p>
                    <div className="flex items-center gap-1.5 mb-4">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i < Math.round(expert.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                        ))}
                      </div>
                      <span className="font-bold text-sm">{expert.rating.toFixed(1)}</span>
                      <span className="text-slate-400 text-sm">({expert.reviewCount})</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white rounded-xl p-3 text-center">
                        <p className="font-bold text-slate-900">{expert.responseTime}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">평균 응답</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 text-center">
                        <p className="font-bold text-slate-900">{expert.completionRate}%</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">완료율</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 text-center">
                        <p className="font-bold text-slate-900">{expert.reviewCount}건</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">총 리뷰</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 text-center">
                        <p className="font-bold text-slate-900">{expert.joinedAt.slice(0, 4)}년</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">활동 시작</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mt-5 leading-relaxed">{expert.introduction}</p>

                {/* Skills */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {expert.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-white text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">{skill}</span>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {expert.tools.map((tool) => (
                      <span key={tool} className="text-xs bg-white text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">{tool}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/expert/${expert.id}`}>프로필 보기</Link>
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1.5" onClick={() => setIsInquiryOpen(true)}>
                    <MessageCircle className="h-4 w-4" />문의하기
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* ===== 전문가 영상 포트폴리오 ===== */}
            {(() => {
              // 서비스의 thumbnail + images에서 CF Stream UID 추출
              const extractUid = (url: string) => {
                const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)\//);
                return match ? match[1] : null;
              };
              const allImageUrls = [service.thumbnail, ...service.images];
              // 같은 전문가의 다른 서비스 영상도 포함
              expertServices.forEach((s) => {
                if (s.id !== service.id) {
                  allImageUrls.push(s.thumbnail, ...s.images);
                }
              });
              const videoUids = [...new Set(allImageUrls.map(extractUid).filter(Boolean))] as string[];

              if (videoUids.length === 0) return null;

              return (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2">{expert.name}님의 영상 포트폴리오</h2>
                  <p className="text-sm text-slate-500 mb-5">총 {videoUids.length}개의 영상</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {videoUids.map((uid) => (
                      <div key={uid} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 group cursor-pointer"
                        onClick={() => setPlayingVideo(playingVideo === uid ? null : uid)}
                      >
                        {playingVideo === uid ? (
                          <iframe
                            src={`${cfIframe(uid)}?autoplay=true&loop=true&muted=true`}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="autoplay; encrypted-media; fullscreen"
                            title="영상 재생"
                          />
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cfThumb(uid)}
                              alt="영상 썸네일"
                              className="absolute inset-0 w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center z-10">
                              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-70 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 shadow-xl">
                                <Play className="h-5 w-5 text-slate-800 fill-slate-800 ml-0.5" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <Separator />

            {/* ===== FAQ ===== */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">자주 묻는 질문</h2>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium text-sm text-slate-800">{faq.q}</span>
                      <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform shrink-0 ml-4", expandedFaq === i && "rotate-180")} />
                    </button>
                    {expandedFaq === i && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* ===== Reviews ===== */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-6">리뷰 ({service.reviewCount})</h2>

              {/* Rating Summary */}
              <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-8">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-slate-900">{service.rating.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 mt-2 justify-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < Math.round(service.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                      ))}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{service.reviewCount}개 리뷰</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {ratingDist.map((rd) => (
                      <button
                        key={rd.star}
                        onClick={() => setReviewFilter(reviewFilter === rd.star ? null : rd.star)}
                        className={cn(
                          "flex items-center gap-3 w-full group hover:bg-white rounded-lg px-2 py-1 transition-colors",
                          reviewFilter === rd.star && "bg-white"
                        )}
                      >
                        <span className="text-sm font-medium text-slate-600 w-8">{rd.star}점</span>
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${reviews.length > 0 ? (rd.count / reviews.length) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-6 text-right">{rd.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Summary */}
                <div className="mt-5 pt-5 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-slate-700">AI 리뷰 요약</span>
                  </div>
                  <p className="text-sm text-slate-500">고객들이 가장 많이 언급한 키워드:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="bg-white">퀄리티 우수</Badge>
                    <Badge variant="outline" className="bg-white">빠른 작업</Badge>
                    <Badge variant="outline" className="bg-white">친절한 소통</Badge>
                    <Badge variant="outline" className="bg-white">가격 대비 만족</Badge>
                  </div>
                </div>
              </div>

              {/* Filter pills */}
              {reviewFilter && (
                <div className="mb-4">
                  <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setReviewFilter(null)}>
                    {reviewFilter}점 필터 적용중 ✕
                  </Badge>
                </div>
              )}

              {/* Review List */}
              <div className="space-y-0">
                {filteredReviews.map((review, i) => (
                  <div key={i} className="py-5 border-b border-slate-100 last:border-0">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} />
                        <AvatarFallback className="text-xs bg-slate-200">{review.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-slate-900">{review.name}</span>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-slate-400">{review.package}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={cn("h-3.5 w-3.5", j < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">{review.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{review.text}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-500 transition-colors">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            도움이 됐어요 ({review.helpful})
                          </button>
                          <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                            <Flag className="h-3.5 w-3.5" />
                            신고
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more */}
              <div className="mt-6 text-center">
                <Button variant="outline" className="px-8">
                  리뷰 더보기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>

          {/* ========== RIGHT SIDEBAR (Desktop) ========== */}
          <div className="hidden lg:block w-[380px] flex-shrink-0">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-5 scrollbar-hide">
              <PackageSection
                service={service}
                selectedPackage={selectedPackage}
                setSelectedPackage={setSelectedPackage}
                formatPrice={formatPrice}
                packageLabels={packageLabels}
                packageColors={packageColors}
                onInquiry={() => setIsInquiryOpen(true)}
              />

              {/* Seller quick card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                      <AvatarImage src={expert.profileImage} alt={expert.name} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white">{expert.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900">{expert.name}</span>
                      {expert.isMaster && <Award className="h-4 w-4 text-amber-500" />}
                    </div>
                    <p className="text-xs text-slate-400">{expert.title}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-slate-50 rounded-lg py-2">
                    <p className="text-xs font-bold text-slate-700">{expert.rating.toFixed(1)}</p>
                    <p className="text-[10px] text-slate-400">평점</p>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg py-2">
                    <p className="text-xs font-bold text-slate-700">{expert.responseTime}</p>
                    <p className="text-[10px] text-slate-400">응답</p>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg py-2">
                    <p className="text-xs font-bold text-slate-700">{expert.completionRate}%</p>
                    <p className="text-[10px] text-slate-400">완료율</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full text-sm" onClick={() => setIsInquiryOpen(true)}>
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  판매자에게 연락하기
                </Button>
              </div>

              {/* Trust signals */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">안심 거래 보장</p>
                    <p className="text-xs text-slate-400">에스크로 결제로 납품 확인 전까지 결제금 보호</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">평균 {service.packages[selectedPackage].deliveryDays}일 납품</p>
                    <p className="text-xs text-slate-400">일정 초과 시 자동 환불</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3 text-sm">
                  <RefreshCw className="h-5 w-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-700">수정 {service.packages[selectedPackage].revisions}회 보장</p>
                    <p className="text-xs text-slate-400">만족할 때까지 수정 가능</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      <InquiryModal
        open={isInquiryOpen}
        onOpenChange={setIsInquiryOpen}
        serviceName={service.title}
        expertName={expert.name}
      />
    </div>
  );
}

/* ===== Package Selection Component ===== */
function PackageSection({
  service,
  selectedPackage,
  setSelectedPackage,
  formatPrice,
  packageLabels,
  packageColors,
  onInquiry,
}: {
  service: any;
  selectedPackage: number;
  setSelectedPackage: (i: number) => void;
  formatPrice: (n: number) => string;
  packageLabels: string[];
  packageColors: string[];
  onInquiry: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Package tabs */}
      <div className="flex border-b border-slate-100">
        {service.packages.map((pkg: any, i: number) => (
          <button
            key={pkg.name}
            onClick={() => setSelectedPackage(i)}
            className={cn(
              "flex-1 py-3 text-sm font-semibold text-center transition-all relative",
              selectedPackage === i
                ? "text-orange-600 bg-orange-50/50"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            {packageLabels[i] || pkg.name}
            {selectedPackage === i && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
            {i === 1 && (
              <span className="absolute -top-0.5 right-2 text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-b-md font-bold">추천</span>
            )}
          </button>
        ))}
      </div>

      {/* Selected package details */}
      <div className="p-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {formatPrice(service.packages[selectedPackage].price)}
              <span className="text-sm font-normal text-slate-400">원</span>
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4">{service.packages[selectedPackage].name}</p>

        <div className="flex items-center gap-4 text-sm text-slate-500 mb-5">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {service.packages[selectedPackage].deliveryDays}일 작업
          </span>
          <span className="flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4" />
            수정 {service.packages[selectedPackage].revisions}회
          </span>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-6">
          {service.packages[selectedPackage].features.map((feature: string) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-slate-600">{feature}</span>
            </li>
          ))}
        </ul>

        <Button className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20" size="lg" asChild>
          <Link href={`/order/${service.id}?package=${selectedPackage}`}>
            바로 구매하기
          </Link>
        </Button>
        <Button variant="outline" className="w-full h-10 mt-2.5 gap-1.5" onClick={onInquiry}>
          <MessageCircle className="h-4 w-4" />
          문의하기
        </Button>

        {/* Compare link */}
        <p className="text-center text-xs text-slate-400 mt-3">
          패키지 비교 후 결정하세요
        </p>
      </div>
    </div>
  );
}
