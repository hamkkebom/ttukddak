import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import {
  Sparkles, Gift, Clock, ArrowRight, Tag,
  Percent, Users, Star, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "이벤트 & 프로모션 | 뚝딱",
  description: "뚝딱의 다양한 이벤트와 할인 혜택을 확인하세요.",
};

const activeEvents = [
  {
    id: "evt-1",
    title: "봄맞이 첫 구매 30% 할인",
    description: "신규 회원 첫 구매 시 전 서비스 30% 할인 쿠폰을 드립니다.",
    badge: "진행중",
    badgeColor: "bg-green-100 text-green-700",
    image: "https://picsum.photos/seed/event1/800/400",
    period: "2024.03.01 ~ 2024.04.30",
    icon: Percent,
    gradient: "from-green-500/90 to-emerald-600/90",
  },
  {
    id: "evt-2",
    title: "전문가 등록 수수료 50% 할인",
    description: "신규 전문가 등록 시 첫 3개월간 플랫폼 수수료를 50% 할인해드립니다.",
    badge: "진행중",
    badgeColor: "bg-green-100 text-green-700",
    image: "https://picsum.photos/seed/event2/800/400",
    period: "2024.03.15 ~ 2024.05.15",
    icon: Users,
    gradient: "from-primary/90 to-orange-500/90",
  },
  {
    id: "evt-3",
    title: "친구 초대 이벤트",
    description: "친구를 초대하면 초대한 분과 초대받은 분 모두에게 10,000원 쿠폰을 드립니다.",
    badge: "진행중",
    badgeColor: "bg-green-100 text-green-700",
    image: "https://picsum.photos/seed/event3/800/400",
    period: "상시 진행",
    icon: Gift,
    gradient: "from-violet-500/90 to-purple-600/90",
  },
];

const upcomingEvents = [
  {
    id: "evt-4",
    title: "AI 영상 콘테스트",
    description: "AI 도구를 활용한 최고의 영상을 선발합니다. 총 상금 500만원!",
    period: "2024.05.01 ~ 2024.05.31",
    icon: Star,
  },
  {
    id: "evt-5",
    title: "여름 특별 할인전",
    description: "인기 서비스 최대 50% 할인. 여름 프로젝트를 준비하세요!",
    period: "2024.06.01 ~ 2024.06.30",
    icon: Zap,
  },
];

const coupons = [
  { code: "WELCOME30", discount: "30% 할인", condition: "첫 구매, 10만원 이상", expiry: "가입 후 30일" },
  { code: "SPRING2024", discount: "20% 할인", condition: "전 서비스, 5만원 이상", expiry: "2024.04.30" },
  { code: "FRIEND10K", discount: "10,000원", condition: "친구 초대 시 자동 발급", expiry: "발급 후 14일" },
];

export default function EventPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-slate-900 py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/2 w-96 h-96 bg-violet-500/20 rounded-full blur-[120px]" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Gift className="h-3 w-3 mr-1" /> 이벤트
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            이벤트 & 프로모션
          </h1>
          <p className="text-slate-300 max-w-xl mx-auto">
            뚝딱의 다양한 혜택을 놓치지 마세요
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Active Events */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">진행중인 이벤트</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1 border-0 shadow-lg">
                <div className="relative h-48">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient}`} />
                  <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <event.icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge className={event.badgeColor}>{event.badge}</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                  </div>
                </div>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{event.period}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Coupons */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">
            <Tag className="h-6 w-6 inline mr-2 text-primary" />
            사용 가능한 쿠폰
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((coupon) => (
              <Card key={coupon.code} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="bg-primary/10 p-5 flex items-center justify-center border-r border-dashed">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{coupon.discount}</p>
                      </div>
                    </div>
                    <div className="p-4 flex-1">
                      <p className="font-mono font-bold text-sm mb-1">{coupon.code}</p>
                      <p className="text-xs text-muted-foreground mb-2">{coupon.condition}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">~{coupon.expiry}</span>
                        <Button variant="outline" size="sm" className="h-7 text-xs">복사</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">예정된 이벤트</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="opacity-80">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <event.icon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2 text-xs">예정</Badge>
                    <h3 className="font-semibold mb-1">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {event.period}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <section className="text-center py-12 bg-gradient-to-br from-primary/5 to-orange-500/5 rounded-2xl">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">이벤트 소식을 놓치지 마세요</h2>
          <p className="text-muted-foreground mb-6">
            알림 설정을 켜시면 새로운 이벤트를 바로 확인할 수 있습니다
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/settings">
                알림 설정 <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/signup">회원가입하고 쿠폰 받기</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
