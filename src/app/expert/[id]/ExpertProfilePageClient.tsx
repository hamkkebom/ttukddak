"use client";

import Link from "next/link";
import {
  Star, Clock, CheckCircle, Award, Zap, Calendar,
  MessageCircle, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ServiceCard } from "@/components/ServiceCard";
import type { Expert, Service, Category } from "@/types";
import { cn } from "@/lib/utils";

interface ExpertProfilePageClientProps {
  expert: Expert;
  services: Service[];
  category: Category;
}

export default function ExpertProfilePageClient({ expert, services, category }: ExpertProfilePageClientProps) {
  const joinDate = new Date(expert.joinedAt);
  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth() + 1;

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
            <span className="font-medium">{expert.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6 text-center">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarImage src={expert.profileImage} alt={expert.name} />
                    <AvatarFallback className="text-2xl">{expert.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-xl font-bold">{expert.name}</h1>
                    {expert.isMaster && (
                      <Badge variant="outline" className="gap-1">
                        <Award className="h-3 w-3 text-amber-500" />
                        마스터
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-4">{expert.title}</p>

                  {/* Badges */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {expert.isPrime && (
                      <Badge className="bg-primary">프라임</Badge>
                    )}
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="h-3 w-3" />
                      {expert.responseTime}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y">
                    <div>
                      <p className="text-2xl font-bold">{expert.rating.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">평점</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{expert.reviewCount}</p>
                      <p className="text-xs text-muted-foreground">리뷰</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{expert.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">완료율</p>
                    </div>
                  </div>

                  <Button className="w-full mt-6">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    문의하기
                  </Button>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">전문가 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">활동 시작</p>
                      <p className="text-sm text-muted-foreground">
                        {joinYear}년 {joinMonth}월
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">평균 응답 시간</p>
                      <p className="text-sm text-muted-foreground">
                        {expert.responseTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">작업 완료율</p>
                      <p className="text-sm text-muted-foreground">
                        {expert.completionRate}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">보유 스킬</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {expert.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle>소개</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {expert.introduction}
                </p>
              </CardContent>
            </Card>

            {/* Services */}
            <div>
              <h2 className="text-xl font-bold mb-6">
                제공 서비스 ({services.length})
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    expert={expert}
                  />
                ))}
              </div>
            </div>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>받은 리뷰 ({expert.reviewCount})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Rating Overview */}
                <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-4xl font-bold">{expert.rating.toFixed(1)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.round(expert.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div>
                    <p className="font-medium mb-1">고객 만족도</p>
                    <p className="text-sm text-muted-foreground">
                      {expert.reviewCount}개의 리뷰 기반
                    </p>
                  </div>
                </div>

                {/* Sample Reviews */}
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=reviewer${i}`} />
                          <AvatarFallback>R</AvatarFallback>
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
                        특히 디테일한 부분까지 신경 써주셔서 감사합니다!
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
