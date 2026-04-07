"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ChevronRight, Star, Heart, Share2, Clock, Zap, Award,
  CheckCircle, MessageCircle, Calendar, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getServiceById } from "@/data/services";
import { getExpertById } from "@/data/experts";
import { getCategoryById } from "@/data/categories";
import { cn } from "@/lib/utils";
import { InquiryModal } from "@/components/InquiryModal";

export default function ServiceDetailPageClient({ id }: { id: string }) {
  const serviceId = id;

  const service = getServiceById(serviceId);
  const expert = service ? getExpertById(service.expertId) : null;
  const category = service ? getCategoryById(service.categoryId) : null;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(1); // Default to Standard
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price);
  };

  if (!service || !expert || !category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">서비스를 찾을 수 없습니다</h1>
        <Button asChild>
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  const images = [service.thumbnail, ...service.images];

  return (
    <div className="min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              홈
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link
              href={`/category/${category.slug}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {category.name}
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium truncate max-w-[200px]">{service.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                <Image
                  src={images[selectedImage]}
                  alt={service.title}
                  fill
                  className="object-cover"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {service.isPrime && (
                    <Badge className="bg-primary">프라임</Badge>
                  )}
                  {service.isFastResponse && (
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="h-3 w-3" />
                      빠른응답
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Meta */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{service.title}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{service.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({service.reviewCount}개 리뷰)
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-muted-foreground">
                  {service.salesCount}회 판매
                </span>
                <div className="flex-1" />
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="description">서비스 설명</TabsTrigger>
                <TabsTrigger value="reviews">
                  리뷰 ({service.reviewCount})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-line">{service.description}</div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-8">
                  {service.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  {/* Review Summary */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-4xl font-bold">{service.rating.toFixed(1)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < Math.round(service.rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted"
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {service.reviewCount}개 리뷰
                          </p>
                        </div>
                        <Separator orientation="vertical" className="h-16" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">
                            AI 리뷰 요약
                          </p>
                          <p className="text-sm">
                            고객들이 가장 많이 언급한 키워드: 
                            <Badge variant="outline" className="ml-2">퀄리티 좋음</Badge>
                            <Badge variant="outline" className="ml-1">빠른 작업</Badge>
                            <Badge variant="outline" className="ml-1">친절한 소통</Badge>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sample Reviews */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border-b pb-6 last:border-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">구매자{i + 1}****</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, j) => (
                                <Star
                                  key={j}
                                  className="h-3 w-3 fill-amber-400 text-amber-400"
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              2024.01.{15 + i}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        정말 만족스러운 작업이었습니다. 소통도 잘 되고 퀄리티도 기대 이상이에요.
                        다음에도 꼭 이용하고 싶습니다!
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Expert Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={expert.profileImage} alt={expert.name} />
                      <AvatarFallback>{expert.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{expert.name}</h3>
                        {expert.isMaster && (
                          <Badge variant="outline" className="gap-1">
                            <Award className="h-3 w-3 text-amber-500" />
                            마스터
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{expert.title}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{expert.responseTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      <span>완료율 {expert.completionRate}%</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/expert/${expert.id}`}>
                      전문가 프로필 보기
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Package Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">패키지 선택</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {service.packages.map((pkg, index) => (
                    <div
                      key={pkg.name}
                      onClick={() => setSelectedPackage(index)}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedPackage === index
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{pkg.name}</span>
                        <span className="font-bold text-lg">
                          {formatPrice(pkg.price)}원
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {pkg.deliveryDays}일
                        </span>
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-4 w-4" />
                          수정 {pkg.revisions}회
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {pkg.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>총 결제금액</span>
                    <span className="text-primary">
                      {formatPrice(service.packages[selectedPackage].price)}원
                    </span>
                  </div>

                  <Button
                    className="w-full h-12 text-base"
                    size="lg"
                    asChild
                  >
                    <Link href={`/order/${service.id}?package=${selectedPackage}`}>
                      바로 구매하기
                    </Link>
                  </Button>
                  <Button
                    className="w-full h-10 text-sm mt-2"
                    variant="outline"
                    onClick={() => setIsInquiryOpen(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    문의하기
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 문의하기 모달 */}
      <InquiryModal
        open={isInquiryOpen}
        onOpenChange={setIsInquiryOpen}
        serviceName={service.title}
        expertName={expert.name}
      />
    </div>
  );
}
