import { Metadata } from "next";
import Link from "next/link";
import {
  Search, MessageCircle, CreditCard, CheckCircle, Star,
  ArrowRight, Play, Shield, Clock, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "이용 가이드 | 뚝딱",
  description: "뚝딱 서비스 이용 방법을 단계별로 안내해드립니다.",
};

const steps = [
  {
    step: 1,
    icon: Search,
    title: "서비스 찾기",
    description: "카테고리 탐색 또는 검색으로 원하는 서비스를 찾아보세요",
    details: [
      "10개의 영상 카테고리에서 탐색",
      "키워드로 빠른 검색",
      "필터로 조건에 맞는 서비스 찾기",
      "전문가 프로필과 포트폴리오 확인",
    ],
  },
  {
    step: 2,
    icon: MessageCircle,
    title: "전문가 상담",
    description: "서비스 페이지에서 전문가에게 직접 문의하세요",
    details: [
      "프로젝트 요구사항 전달",
      "견적 및 일정 협의",
      "궁금한 점 질문",
      "포트폴리오 추가 요청",
    ],
  },
  {
    step: 3,
    icon: CreditCard,
    title: "결제하기",
    description: "협의된 내용으로 안전하게 결제하세요",
    details: [
      "원하는 패키지 선택",
      "추가 옵션 선택 (급행, 추가 수정 등)",
      "안전결제 시스템으로 보호",
      "세금계산서 발행 가능",
    ],
  },
  {
    step: 4,
    icon: Play,
    title: "작업 진행",
    description: "전문가가 작업을 시작하고 중간 과정을 공유받으세요",
    details: [
      "작업 시작 알림 수신",
      "중간 시안 확인",
      "피드백 전달",
      "수정 요청",
    ],
  },
  {
    step: 5,
    icon: CheckCircle,
    title: "결과물 수령",
    description: "최종 결과물을 확인하고 프로젝트를 완료하세요",
    details: [
      "고화질 원본 파일 다운로드",
      "소스 파일 수령 (프리미엄)",
      "만족도 확인",
      "추가 수정 요청 가능",
    ],
  },
  {
    step: 6,
    icon: Star,
    title: "리뷰 작성",
    description: "전문가에게 리뷰를 남겨 다른 고객에게 도움을 주세요",
    details: [
      "별점 평가",
      "상세 리뷰 작성",
      "작업물 공개 동의 (선택)",
      "재구매 할인 혜택",
    ],
  },
];

const features = [
  {
    icon: Shield,
    title: "안전 거래",
    description: "결제 금액은 작업 완료 전까지 안전하게 보관됩니다",
  },
  {
    icon: Clock,
    title: "빠른 매칭",
    description: "평균 1시간 이내 전문가 응답을 받을 수 있습니다",
  },
  {
    icon: Users,
    title: "검증된 전문가",
    description: "엄격한 심사를 통과한 전문가만 활동합니다",
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4">이용 가이드</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            뚝딱 이용 방법
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            처음이신가요? 걱정 마세요!
            <br />
            6단계로 쉽게 원하는 영상을 만들 수 있습니다
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">
            서비스 이용 단계
          </h2>

          <div className="max-w-4xl mx-auto space-y-8">
            {steps.map((item, index) => (
              <div key={item.step} className="flex gap-6">
                {/* Step Number */}
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <Card className="flex-1 mb-4">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {item.description}
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {item.details.map((detail, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">
            더 좋은 결과를 위한 팁
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "명확한 요구사항 전달",
                description: "원하는 스타일, 분위기, 참고 영상 등을 구체적으로 전달하세요",
              },
              {
                title: "포트폴리오 꼼꼼히 확인",
                description: "전문가의 작업 스타일이 원하는 방향과 맞는지 확인하세요",
              },
              {
                title: "충분한 작업 기간 확보",
                description: "급한 작업은 퀄리티가 떨어질 수 있어요. 여유 있게 의뢰하세요",
              },
              {
                title: "소통 창구 일원화",
                description: "요청사항은 플랫폼 내 메시지로 정리해서 전달하세요",
              },
              {
                title: "중간 점검 활용",
                description: "중간 시안 단계에서 방향 수정이 가장 효율적입니다",
              },
              {
                title: "리뷰로 피드백 공유",
                description: "솔직한 리뷰는 전문가와 다른 고객 모두에게 도움이 됩니다",
              },
            ].map((tip, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tip.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            이제 시작해볼까요?
          </h2>
          <p className="text-muted-foreground mb-8">
            300명 이상의 검증된 AI 영상 전문가가 기다리고 있습니다
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/categories">
                카테고리 둘러보기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/faq">자주 묻는 질문</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
