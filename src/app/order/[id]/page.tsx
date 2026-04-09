"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronRight, CheckCircle, Shield, Clock, CreditCard,
  Smartphone, Building2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getServiceByIdClient, getExpertByIdClient, getCategoryByIdClient } from "@/lib/db-client";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Service, Expert, Category, Coupon } from "@/types";

type PaymentMethod = "card" | "kakao" | "naver" | "bank";

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    getServiceByIdClient(id).then(async (svc) => {
      if (!svc) {
        setLoading(false);
        return;
      }
      setService(svc);
      const [exp, cat] = await Promise.all([
        getExpertByIdClient(svc.expertId),
        getCategoryByIdClient(svc.categoryId),
      ]);
      setExpert(exp);
      setCategory(cat);
      setLoading(false);
    });
  }, [id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ko-KR").format(price);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">로딩중...</p>
      </div>
    );
  }

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

  const pkg = service.packages[selectedPackage];
  const serviceFee = Math.round(pkg.price * 0.05);
  const baseTotal = pkg.price + serviceFee;
  const totalPrice = Math.max(0, baseTotal - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("쿠폰 코드를 입력해주세요");
      return;
    }
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: baseTotal }),
      });
      const result = await res.json();
      if (result.valid) {
        setAppliedCoupon(result.coupon);
        setDiscountAmount(result.discountAmount);
        toast.success(`쿠폰이 적용되었습니다! ${formatPrice(result.discountAmount)}원 할인`);
        setCouponCode("");
      } else {
        toast.error(result.error || "유효하지 않은 쿠폰 코드입니다");
      }
    } catch {
      toast.error("쿠폰 확인 중 오류가 발생했습니다");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    toast.info("쿠폰이 제거되었습니다");
  };

  const handleOrder = async () => {
    if (!agreedToTerms) {
      toast.error("주문 전 이용약관에 동의해주세요");
      return;
    }

    setOrdering(true);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다");
        setOrdering(false);
        return;
      }

      // 1. 주문 생성
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: user.id,
          serviceId: service.id,
          expertId: service.expertId,
          packageName: pkg.name,
          price: totalPrice,
        }),
      });

      if (!orderRes.ok) {
        toast.error("주문 생성에 실패했습니다");
        setOrdering(false);
        return;
      }

      const { data: newOrder } = await orderRes.json();

      // 2. PortOne 결제 요청
      if (typeof window === "undefined" || !(window as any).PortOne) {
        toast.error("결제 모듈을 불러오지 못했습니다. 페이지를 새로고침 후 다시 시도해주세요.");
        setOrdering(false);
        return;
      }

      const paymentResponse = await (window as any).PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
        paymentId: `payment-${newOrder.id}-${Date.now()}`,
        orderName: service.title,
        totalAmount: totalPrice,
        currency: "KRW",
        payMethod: paymentMethod === "card" ? "CARD" : paymentMethod === "kakao" ? "EASY_PAY" : paymentMethod === "naver" ? "EASY_PAY" : "VIRTUAL_ACCOUNT",
        customer: { fullName: user.user_metadata?.name || "고객" },
        customData: { orderId: newOrder.id },
      });

      if (paymentResponse?.code) {
        toast.error(`결제 실패: ${paymentResponse.message}`);
        setOrdering(false);
        return;
      }

      // 3. 결제 확인
      const confirmRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: paymentResponse.paymentId,
          orderId: newOrder.id,
        }),
      });

      if (!confirmRes.ok) {
        toast.error("결제 확인에 실패했습니다. 고객센터에 문의해주세요.");
        setOrdering(false);
        return;
      }

      toast.success("주문이 완료되었습니다!", {
        description: "전문가가 곧 작업을 시작합니다.",
      });
      router.push(`/order/${newOrder.id}/tracking`);
    } catch (err) {
      toast.error("주문 처리 중 오류가 발생했습니다");
    } finally {
      setOrdering(false);
    }
  };

  const paymentMethods: {
    id: PaymentMethod;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    sub: string;
  }[] = [
    { id: "card", icon: CreditCard, label: "신용/체크카드", sub: "모든 카드 지원" },
    { id: "kakao", icon: Smartphone, label: "카카오페이", sub: "간편결제" },
    { id: "naver", icon: Smartphone, label: "네이버페이", sub: "간편결제" },
    { id: "bank", icon: Building2, label: "무통장입금", sub: "가상계좌" },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Breadcrumb */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">홈</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link href={`/service/${service.id}`} className="text-muted-foreground hover:text-foreground">
              서비스
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">주문/결제</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">주문/결제</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">주문 서비스</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="relative w-24 h-18 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={service.thumbnail}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="mb-1 text-xs">
                      {category.name}
                    </Badge>
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {service.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {expert.name} 전문가
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">패키지 선택</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.packages.map((p, i) => (
                  <div
                    key={p.name}
                    onClick={() => setSelectedPackage(i)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      selectedPackage === i
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border-2",
                            selectedPackage === i
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {selectedPackage === i && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span className="font-semibold">{p.name}</span>
                      </div>
                      <span className="font-bold">{formatPrice(p.price)}원</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground ml-6">
                      <span>납기 {p.deliveryDays}일</span>
                      <span>수정 {p.revisions}회</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">결제 수단</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3",
                        paymentMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                      )}
                    >
                      <method.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">결제 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">서비스 금액</span>
                      <span>{formatPrice(pkg.price)}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">서비스 수수료</span>
                      <span>{formatPrice(serviceFee)}원</span>
                    </div>
                    {/* 쿠폰 입력 */}
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2 bg-primary/10 rounded-md border border-primary/30">
                        <div className="text-sm">
                          <span className="font-mono font-medium text-primary">{appliedCoupon.code}</span>
                          <span className="text-muted-foreground ml-2">
                            -{formatPrice(discountAmount)}원
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={handleRemoveCoupon}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                          placeholder="쿠폰 코드 입력"
                          className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                        >
                          {couponLoading ? "확인중..." : "적용"}
                        </Button>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>쿠폰 할인</span>
                        <span>-{formatPrice(discountAmount)}원</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>총 결제금액</span>
                      <span className="text-primary">
                        {formatPrice(totalPrice)}원
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <Shield className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      안전결제 시스템으로 작업 완료 전까지 결제금이 안전하게 보관됩니다
                    </p>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-xs text-muted-foreground">
                      <Link href="/terms" className="text-primary underline">
                        이용약관
                      </Link>
                      {" "}및{" "}
                      <Link href="/privacy" className="text-primary underline">
                        개인정보처리방침
                      </Link>
                      에 동의합니다
                    </span>
                  </label>

                  <Button
                    className="w-full h-12 text-base"
                    size="lg"
                    onClick={handleOrder}
                    disabled={ordering}
                  >
                    {ordering ? "처리 중..." : `${formatPrice(totalPrice)}원 결제하기`}
                  </Button>

                  <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>예상 납기: {pkg.deliveryDays}일</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
