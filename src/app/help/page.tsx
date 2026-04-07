"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Headphones, MessageCircle, FileText, ChevronRight,
  Phone, Mail, Clock, ArrowRight, HelpCircle, Shield, CreditCard,
  Users, Settings, Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const helpCategories = [
  { icon: HelpCircle, title: "시작하기", desc: "가입, 로그인, 기본 사용법", link: "/guide" },
  { icon: CreditCard, title: "결제/환불", desc: "결제 방법, 환불 정책", link: "/faq" },
  { icon: Users, title: "전문가 관련", desc: "등록, 서비스 관리, 정산", link: "/faq" },
  { icon: Shield, title: "안전 거래", desc: "에스크로, 분쟁 해결", link: "/faq" },
  { icon: Settings, title: "계정 관리", desc: "프로필, 알림, 탈퇴", link: "/settings" },
  { icon: Megaphone, title: "이벤트/혜택", desc: "프로모션, 쿠폰 안내", link: "/event" },
];

const notices = [
  { id: 1, title: "[공지] 서비스 이용약관 개정 안내 (2024.04.01 시행)", date: "2024-03-25", isNew: true },
  { id: 2, title: "[공지] 봄맞이 수수료 할인 이벤트 안내", date: "2024-03-20", isNew: true },
  { id: 3, title: "[점검] 시스템 정기 점검 안내 (3/15 02:00~06:00)", date: "2024-03-13", isNew: false },
  { id: 4, title: "[공지] 개인정보처리방침 변경 안내", date: "2024-03-01", isNew: false },
  { id: 5, title: "[업데이트] 메시지 기능 개선 안내", date: "2024-02-20", isNew: false },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Headphones className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">고객센터</h1>
          <p className="text-muted-foreground mb-8">무엇을 도와드릴까요?</p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="궁금한 점을 검색해보세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-13 rounded-full text-base"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {helpCategories.map((cat) => (
            <Link key={cat.title} href={cat.link}>
              <Card className="h-full hover:shadow-md hover:-translate-y-1 transition-all text-center">
                <CardContent className="p-5">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <cat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{cat.title}</h3>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Notices */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">공지사항</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {notice.isNew && <Badge className="shrink-0 text-[10px]">NEW</Badge>}
                        <span className="text-sm truncate">{notice.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-4">
                        {notice.date}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FAQ Link */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <HelpCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">자주 묻는 질문</h3>
                      <p className="text-sm text-muted-foreground">
                        가장 많이 문의하시는 질문들을 모았습니다
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/faq">
                      바로가기 <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">1:1 문의</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  원하는 답변을 찾지 못하셨나요? 직접 문의해주세요.
                </p>
                <Button className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" /> 1:1 문의하기
                </Button>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">이메일 문의</p>
                      <p className="text-xs text-muted-foreground">support@aivideo.market</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">전화 문의</p>
                      <p className="text-xs text-muted-foreground">02-1234-5678</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">운영 시간</p>
                      <p className="text-xs text-muted-foreground">평일 09:00~18:00 (점심 12~13시)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-orange-500/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">이용 가이드</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  처음 이용하시는 분을 위한 단계별 안내
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/guide">가이드 보기</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
