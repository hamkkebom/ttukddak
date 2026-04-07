"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FAQCategory = "all" | "general" | "order" | "payment" | "expert" | "account";

interface FAQItem {
  id: string;
  category: FAQCategory;
  categoryLabel: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: "1",
    category: "general",
    categoryLabel: "일반",
    question: "뚝딱은 어떤 서비스인가요?",
    answer:
      "뚝딱은 AI 영상 전문가와 의뢰인을 연결하는 재능 마켓플레이스입니다. AI 영상 생성, 모션그래픽, 유튜브 편집, 3D 애니메이션 등 다양한 영상 서비스를 제공하는 300명 이상의 검증된 전문가가 활동하고 있습니다.",
  },
  {
    id: "2",
    category: "general",
    categoryLabel: "일반",
    question: "어떤 종류의 영상을 의뢰할 수 있나요?",
    answer:
      "AI 영상 생성(Sora, Runway, Pika 등), 모션그래픽, 2D/3D 애니메이션, 유튜브/숏폼 편집, 제품·광고 영상, 기업 IR 영상, 뮤직비디오, 웨딩·이벤트 영상, 교육 콘텐츠 등 10개 카테고리의 영상 서비스를 의뢰할 수 있습니다.",
  },
  {
    id: "3",
    category: "order",
    categoryLabel: "주문/의뢰",
    question: "서비스 의뢰는 어떻게 하나요?",
    answer:
      "1) 원하는 서비스를 찾아 상세 페이지를 확인합니다.\n2) 패키지를 선택하고 '문의하기'를 클릭합니다.\n3) 전문가와 프로젝트 요구사항을 협의합니다.\n4) 협의 완료 후 결제하면 작업이 시작됩니다.\n5) 중간 시안 확인 후 최종 결과물을 수령합니다.",
  },
  {
    id: "4",
    category: "order",
    categoryLabel: "주문/의뢰",
    question: "수정 요청은 몇 번까지 가능한가요?",
    answer:
      "수정 횟수는 선택한 패키지에 따라 다릅니다. 베이직 패키지는 보통 1~2회, 스탠다드 2~3회, 프리미엄 3~5회의 수정이 포함됩니다. 추가 수정이 필요한 경우 전문가와 별도 협의하여 추가 비용으로 진행할 수 있습니다.",
  },
  {
    id: "5",
    category: "order",
    categoryLabel: "주문/의뢰",
    question: "작업 기간은 얼마나 걸리나요?",
    answer:
      "패키지와 영상 종류에 따라 다르지만, 일반적으로 베이직 3~7일, 스탠다드 7~14일, 프리미엄 14~21일 정도 소요됩니다. 급행 옵션을 선택하면 더 빠른 결과물 수령이 가능합니다.",
  },
  {
    id: "6",
    category: "payment",
    categoryLabel: "결제/환불",
    question: "결제는 어떻게 이루어지나요?",
    answer:
      "신용카드, 체크카드, 무통장 입금, 카카오페이, 네이버페이 등 다양한 결제 수단을 지원합니다. 결제 금액은 에스크로 시스템에 의해 작업 완료 전까지 안전하게 보관됩니다.",
  },
  {
    id: "7",
    category: "payment",
    categoryLabel: "결제/환불",
    question: "환불은 가능한가요?",
    answer:
      "작업 시작 전이라면 100% 환불이 가능합니다. 작업이 시작된 후에는 진행 정도에 따라 부분 환불이 적용됩니다. 전문가의 귀책 사유로 작업이 완료되지 않은 경우에는 전액 환불됩니다. 자세한 사항은 환불 정책을 확인해주세요.",
  },
  {
    id: "8",
    category: "payment",
    categoryLabel: "결제/환불",
    question: "세금계산서 발행이 가능한가요?",
    answer:
      "네, 사업자 회원은 세금계산서 발행이 가능합니다. 결제 완료 후 마이페이지에서 세금계산서 발행을 요청하시면 영업일 기준 1~2일 내에 발행됩니다.",
  },
  {
    id: "9",
    category: "expert",
    categoryLabel: "전문가",
    question: "전문가로 등록하려면 어떻게 해야 하나요?",
    answer:
      "전문가 등록 페이지에서 기본 정보, 전문 분야, 포트폴리오를 등록하면 심사가 진행됩니다. 심사는 영업일 기준 1~3일 소요되며, 포트폴리오 퀄리티와 전문성을 기준으로 평가합니다. 승인 완료 후 바로 서비스를 등록하고 활동을 시작할 수 있습니다.",
  },
  {
    id: "10",
    category: "expert",
    categoryLabel: "전문가",
    question: "전문가 수수료는 어떻게 되나요?",
    answer:
      "거래 성사 시 거래 금액의 10~20%가 플랫폼 수수료로 차감됩니다. 프라임 및 마스터 등급 전문가는 더 낮은 수수료율이 적용됩니다. 정산은 작업 완료 확인 후 영업일 기준 3~5일 내에 등록된 계좌로 입금됩니다.",
  },
  {
    id: "11",
    category: "account",
    categoryLabel: "계정",
    question: "비밀번호를 잊어버렸어요. 어떻게 하나요?",
    answer:
      "로그인 페이지에서 '비밀번호 찾기'를 클릭하세요. 가입 시 등록한 이메일로 비밀번호 재설정 링크가 발송됩니다. 이메일을 받지 못한 경우 스팸 폴더를 확인하시거나 고객센터로 문의해주세요.",
  },
  {
    id: "12",
    category: "account",
    categoryLabel: "계정",
    question: "회원 탈퇴는 어떻게 하나요?",
    answer:
      "마이페이지 > 계정 설정 > 회원 탈퇴에서 진행할 수 있습니다. 진행 중인 거래가 있는 경우 모든 거래가 완료된 후 탈퇴가 가능합니다. 탈퇴 시 개인정보는 관련 법령에 따라 일정 기간 보관 후 파기됩니다.",
  },
];

const categoryFilters: { value: FAQCategory; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "general", label: "일반" },
  { value: "order", label: "주문/의뢰" },
  { value: "payment", label: "결제/환불" },
  { value: "expert", label: "전문가" },
  { value: "account", label: "계정" },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FAQCategory>("all");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredFAQs = faqData.filter((faq) => {
    const matchesCategory =
      activeCategory === "all" || faq.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4">FAQ</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            자주 묻는 질문
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            궁금한 점을 빠르게 찾아보세요
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="질문을 검색해보세요..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full text-base"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <div className="border-b sticky top-16 z-40 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {categoryFilters.map((cat) => (
              <Badge
                key={cat.value}
                variant={activeCategory === cat.value ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap px-4 py-1.5"
                onClick={() => setActiveCategory(cat.value)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="border rounded-xl overflow-hidden"
                >
                  <button
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => toggleItem(faq.id)}
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {faq.categoryLabel}
                      </Badge>
                      <span className="font-medium">{faq.question}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        openItems.includes(faq.id) && "rotate-180"
                      )}
                    />
                  </button>
                  {openItems.includes(faq.id) && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="pl-[calc(theme(spacing.3)+theme(spacing.12))]">
                        <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  검색 결과가 없습니다
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                >
                  전체 보기
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-lg mx-auto border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                원하는 답변을 찾지 못하셨나요?
              </h3>
              <p className="text-muted-foreground mb-6">
                고객센터로 문의해주시면 빠르게 답변해드립니다
              </p>
              <Button asChild>
                <Link href="mailto:support@aivideo.market">
                  문의하기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
