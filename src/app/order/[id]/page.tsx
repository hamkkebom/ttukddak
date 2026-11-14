"use client";

import { Suspense, use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import PortOne from "@portone/browser-sdk/v2";
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
import type { Service, Expert, Category, Coupon, Order } from "@/types";

type PaymentMethod = "card" | "kakao" | "naver" | "bank";

// 전문가가 패키지를 등록하지 않은 서비스에 보여 줄 안내. 상세 화면과 같은 문장이다.
const PLACEHOLDER_TERMS_NOTICE = "작업 기간과 수정 횟수는 주문 전에 전문가에게 문의해 정할 수 있습니다.";

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    // useSearchParams 를 쓰는 부분은 Suspense 안에 있어야 한다.
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">로딩중...</p>
        </div>
      }
    >
      <OrderPageContent params={params} />
    </Suspense>
  );
}

function OrderPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  // 상세 화면에서 고른 패키지 순번 (?package=1). 회원이 이 화면에서 다시 고르기 전까지 쓴다.
  const requestedPackage = useSearchParams().get("package");

  const [service, setService] = useState<Service | null>(null);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [existingOrder, setExistingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  // null 이면 아직 이 화면에서 고르지 않았다는 뜻이다 (주소의 값이나 기본값을 쓴다).
  const [pickedPackage, setPickedPackage] = useState<number | null>(null);
  // 다른 서비스의 주문 화면으로 옮겨 가면 앞에서 고른 순번은 버린다 (그 서비스의 패키지가 아니다).
  const [seenId, setSeenId] = useState(id);
  if (id !== seenId) {
    setSeenId(id);
    setPickedPackage(null);
  }
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    async function load() {
      const orderRes = await fetch(`/api/orders/${id}`);
      if (orderRes.ok) {
        const order = await orderRes.json() as Order;
        setExistingOrder(order);
        const svc = await getServiceByIdClient(order.serviceId);
        if (!svc) {
          setLoading(false);
          return;
        }
        setService(svc);
        const [exp, cat] = await Promise.all([
          getExpertByIdClient(order.expertId),
          getCategoryByIdClient(svc.categoryId),
        ]);
        setExpert(exp);
        setCategory(cat);
        setLoading(false);
        return;
      }

      const svc = await getServiceByIdClient(id);
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
    }
    load();
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

  // 주소의 순번은 있는 패키지 범위 안으로 맞춘다. 없거나 잘못된 값이면 상세 화면과 같은 기본값을 쓴다.
  const lastPackage = Math.max(0, service.packages.length - 1);
  const requestedIndex =
    requestedPackage !== null && /^\d+$/.test(requestedPackage)
      ? Math.min(Number(requestedPackage), lastPackage)
      : null;
  const selectedPackage =
    pickedPackage ?? requestedIndex ?? (service.packages.length >= 3 ? 1 : 0);
  const pkg = service.packages[selectedPackage] || service.packages[0];
  const isDealOrder = !!existingOrder;
  const isTestPayment = process.env.NEXT_PUBLIC_PAYMENT_MODE !== "live";
  const serviceFee = isDealOrder ? 0 : Math.round(pkg.price * 0.05);
  const baseTotal = isDealOrder ? existingOrder.price : pkg.price + serviceFee;
  const totalPrice = Math.max(0, baseTotal - discountAmount);
  const canPay = !existingOrder || existingOrder.status === "pending";

  const handleApplyCoupon = async () => {
    if (isDealOrder) {
      toast.info("협의견적 주문은 합의된 금액으로 결제됩니다");
      return;
    }
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

      if (existingOrder && existingOrder.status !== "pending") {
        toast.info("이미 결제 처리된 주문입니다");
        router.push(`/order/${existingOrder.id}/tracking`);
        return;
      }

      // 결제창을 열 수 없으면 주문을 만들지 않는다. 먼저 만들면 결제되지 않은 주문만 남는다.
      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
      if (!storeId || !channelKey) {
        toast.error("결제 설정이 누락되었습니다. 관리자에게 문의해주세요.");
        setOrdering(false);
        return;
      }

      let orderObj: { id: string; price: number };
      if (existingOrder) {
        orderObj = { id: existingOrder.id, price: existingOrder.price };
      } else {
        // 1. 주문 생성 (서버에서 금액/할인 재계산)
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: service.id,
            // 자리표시 패키지는 저장된 패키지가 아니다. 이름을 보내지 않으면 서버가 서비스 가격으로 계산한다.
            packageName: pkg.isPlaceholder ? null : pkg.name,
            couponCode: appliedCoupon?.code ?? null,
          }),
        });

        if (!orderRes.ok) {
          // 서버가 알려 준 이유(쿠폰 만료, 주문할 수 없는 서비스 등)가 있으면 보여 준다.
          const errorJson = await orderRes.json().catch(() => null);
          const showServerMessage =
            typeof errorJson?.error === "string" && ![401, 403, 500].includes(orderRes.status);
          toast.error(showServerMessage ? errorJson.error : "주문 생성에 실패했습니다");
          setOrdering(false);
          return;
        }

        const newOrder = await orderRes.json();
        orderObj = (newOrder?.data ?? newOrder) as { id: string; price: number };
      }
      if (!orderObj?.id) {
        toast.error("주문 생성 응답이 올바르지 않습니다");
        setOrdering(false);
        return;
      }

      // 서버가 계산한 최종 금액을 신뢰 (클라이언트 totalPrice와 다를 수 있음)
      const serverAmount = orderObj.price;

      // 2. 결제 수단별 요청 파라미터 구성
      const buyerName = user.user_metadata?.name || "고객";
      const buyerEmail = user.email ?? undefined;
      const buyerPhone =
        (user.user_metadata?.phone as string | undefined) ?? undefined;

      const commonPayload = {
        storeId,
        channelKey,
        paymentId: `payment-${orderObj.id}-${Date.now()}`,
        orderName: isDealOrder ? `${service.title} - 협의견적` : service.title,
        totalAmount: serverAmount,
        currency: "CURRENCY_KRW" as const,
        customer: {
          fullName: buyerName,
          email: buyerEmail,
          phoneNumber: buyerPhone,
        },
        customData: { orderId: orderObj.id, paymentMode: isTestPayment ? "test" : "live" },
      };

      // NOTE: @portone/browser-sdk v2의 PaymentRequest 타입이 `alipayPlus`를
      // 필수 필드로 잘못 선언하고 있어, 실제 런타임 스펙에 맞게 캐스팅 처리한다.
      // 공식 예제 역시 alipayPlus를 전달하지 않는다.
      type PaymentReq = Parameters<typeof PortOne.requestPayment>[0];

      let paymentRequest: Record<string, unknown>;
      if (paymentMethod === "card") {
        paymentRequest = { ...commonPayload, payMethod: "CARD" };
      } else if (paymentMethod === "kakao") {
        paymentRequest = {
          ...commonPayload,
          payMethod: "EASY_PAY",
          easyPay: { easyPayProvider: "EASY_PAY_PROVIDER_KAKAOPAY" },
        };
      } else if (paymentMethod === "naver") {
        paymentRequest = {
          ...commonPayload,
          payMethod: "EASY_PAY",
          easyPay: { easyPayProvider: "EASY_PAY_PROVIDER_NAVERPAY" },
        };
      } else {
        // 가상계좌: 휴대폰 번호 필수
        if (!buyerPhone) {
          toast.error("가상계좌 결제를 위해 프로필에 휴대폰 번호를 등록해주세요.");
          setOrdering(false);
          return;
        }
        paymentRequest = {
          ...commonPayload,
          payMethod: "VIRTUAL_ACCOUNT",
          virtualAccount: {
            accountExpiry: { validHours: 72 },
          },
        };
      }

      const paymentResponse = await PortOne.requestPayment(
        paymentRequest as unknown as PaymentReq,
      );

      if (paymentResponse?.code !== undefined) {
        toast.error(`결제 실패: ${paymentResponse.message ?? "알 수 없는 오류"}`);
        setOrdering(false);
        return;
      }

      // 3. 결제 확인 (서버가 PortOne API로 재검증)
      const confirmRes = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: paymentResponse!.paymentId,
          orderId: orderObj.id,
        }),
      });

      const confirmJson = await confirmRes.json().catch(() => null);
      if (!confirmRes.ok || !confirmJson?.success) {
        toast.error(
          confirmJson?.error ?? "결제 확인에 실패했습니다. 고객센터에 문의해주세요.",
        );
        setOrdering(false);
        return;
      }

      if (confirmJson.data?.orderStatus === "virtual_account_issued") {
        toast.success("가상계좌가 발급되었습니다", {
          description: "입금 확인 후 주문이 자동으로 진행됩니다.",
        });
      } else {
        toast.success("주문이 완료되었습니다!", {
          description: "전문가가 곧 작업을 시작합니다.",
        });
      }
      router.push(`/order/${orderObj.id}/tracking`);
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
        {isTestPayment && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            공개 테스트 운영판입니다. 결제는 PortOne 테스트 모드로만 검증하며 실거래와 실정산은 진행하지 않습니다.
          </div>
        )}

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

            {isDealOrder ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">합의견적 주문</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{existingOrder.packageName || "협의견적"}</span>
                      <span className="font-bold">{formatPrice(existingOrder.price)}원</span>
                    </div>
                    {existingOrder.requirements && (
                      <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                        {existingOrder.requirements}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">패키지 선택</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {service.packages.map((p, i) => (
                    <div
                      key={p.name}
                      onClick={() => setPickedPackage(i)}
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
                      {p.isPlaceholder ? (
                        // 패키지를 등록하지 않은 서비스. 코드가 채운 기본값(기간·수정 횟수)은 적지 않는다.
                        <p className="text-xs text-muted-foreground ml-6">{PLACEHOLDER_TERMS_NOTICE}</p>
                      ) : (
                        <div className="flex gap-4 text-xs text-muted-foreground ml-6">
                          <span>납기 {p.deliveryDays}일</span>
                          <span>수정 {p.revisions}회</span>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

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
                      <span className="text-muted-foreground">
                        {isDealOrder ? "합의견적 금액" : "서비스 금액"}
                      </span>
                      <span>{formatPrice(isDealOrder ? existingOrder.price : pkg.price)}원</span>
                    </div>
                    {!isDealOrder && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">서비스 수수료</span>
                        <span>{formatPrice(serviceFee)}원</span>
                      </div>
                    )}
                    {/* 쿠폰 입력 */}
                    {!isDealOrder && appliedCoupon ? (
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
                    ) : !isDealOrder ? (
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
                    ) : null}
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
                    disabled={ordering || !canPay}
                  >
                    {ordering
                      ? "처리 중..."
                      : canPay
                        ? `${formatPrice(totalPrice)}원 테스트 결제하기`
                        : "결제 완료된 주문"}
                  </Button>

                  <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {isDealOrder
                        ? "합의된 조건으로 진행"
                        : pkg.isPlaceholder
                          ? PLACEHOLDER_TERMS_NOTICE
                          : `예상 납기: ${pkg.deliveryDays}일`}
                    </span>
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
