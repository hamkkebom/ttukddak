import { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles, Users, Video, Award, Target, Heart,
  ArrowRight, CheckCircle, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "회사 소개 | 뚝딱",
  description: "뚝딱은 AI 영상 전문가와 의뢰인을 연결하는 재능마켓입니다.",
};

const stats = [
  { label: "등록 전문가", value: "300+", suffix: "명" },
  { label: "완료 프로젝트", value: "10,000+", suffix: "건" },
  { label: "평균 평점", value: "4.9", suffix: "점" },
  { label: "재구매율", value: "85", suffix: "%" },
];

const values = [
  {
    icon: Target,
    title: "품질 우선",
    description: "엄격한 심사를 통과한 전문가만 활동할 수 있습니다. 고객 만족을 최우선으로 생각합니다.",
  },
  {
    icon: Heart,
    title: "고객 중심",
    description: "고객의 비전을 실현하기 위해 끊임없이 소통하고, 기대 이상의 결과물을 제공합니다.",
  },
  {
    icon: TrendingUp,
    title: "혁신 추구",
    description: "AI 기술의 최전선에서 새로운 가능성을 탐구하고, 영상 제작의 미래를 선도합니다.",
  },
];

const milestones = [
  { year: "2023", event: "뚝딱 서비스 런칭" },
  { year: "2023", event: "누적 거래 1,000건 달성" },
  { year: "2024", event: "전문가 100명 돌파" },
  { year: "2024", event: "누적 거래 10,000건 달성" },
  { year: "2024", event: "AI 추천 시스템 도입" },
  { year: "2025", event: "전문가 300명 돌파" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="font-bold text-3xl">뚝딱</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI 영상 전문가를 만나는
            <br />
            가장 쉬운 방법
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            우리는 최고의 AI 영상 전문가와 고객을 연결하여
            <br />
            누구나 쉽게 고품질 영상을 만들 수 있도록 합니다
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary">
                  {stat.value}
                  <span className="text-2xl">{stat.suffix}</span>
                </p>
                <p className="text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">우리의 미션</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              AI 기술의 발전으로 영상 제작의 패러다임이 바뀌고 있습니다.
              <br />
              우리는 이 변화의 중심에서, <strong className="text-foreground">누구나 상상을 현실로</strong> 만들 수 있는 세상을 꿈꿉니다.
              <br /><br />
              뚝딱은 창작자와 고객 사이의 다리가 되어,
              <br />
              <strong className="text-foreground">아이디어가 영상이 되는 가장 빠른 길</strong>을 제공합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">핵심 가치</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-8">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">왜 뚝딱인가요?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "검증된 전문가",
                  description: "포트폴리오 심사, 실력 검증, 인터뷰를 통과한 전문가만 활동합니다.",
                },
                {
                  title: "안전한 거래",
                  description: "에스크로 결제 시스템으로 작업 완료 전까지 결제금이 안전하게 보관됩니다.",
                },
                {
                  title: "AI 특화",
                  description: "Sora, Runway, Pika 등 최신 AI 도구를 활용하는 전문가들이 모여 있습니다.",
                },
                {
                  title: "합리적인 가격",
                  description: "중개 수수료를 최소화하여 전문가와 고객 모두에게 이익이 되도록 합니다.",
                },
                {
                  title: "빠른 매칭",
                  description: "평균 1시간 이내 전문가 응답, 최단 3일 내 결과물 수령이 가능합니다.",
                },
                {
                  title: "만족 보장",
                  description: "작업물에 만족하지 못하면 수정 요청 또는 환불이 가능합니다.",
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">히스토리</h2>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    {index < milestones.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border" />
                    )}
                  </div>
                  <div className="pb-6">
                    <span className="text-sm text-primary font-medium">
                      {milestone.year}
                    </span>
                    <p className="font-medium">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            함께 성장할 준비가 되셨나요?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            뚝딱과 함께 새로운 가능성을 열어보세요
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                지금 시작하기
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/expert/register">전문가로 등록하기</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
