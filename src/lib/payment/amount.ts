import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * 서버 측에서 주문 금액을 직접 산출합니다.
 *
 * 클라이언트가 전달한 price는 신뢰하지 않고, DB에 등록된 서비스/패키지 가격과
 * 서비스 수수료(5%), 적용된 쿠폰의 할인액만을 사용하여 최종 결제 금액을 계산합니다.
 *
 * 실패 결과의 `transient` 가 true 면 DB 조회 자체가 실패한 것이다 (조건이 틀렸다는 뜻이 아님).
 * 호출 측은 이 경우를 "주문이 유효하지 않다" 로 취급해서는 안 된다.
 */
export interface ComputeOrderAmountParams {
  serviceId: string;
  packageName?: string | null;
  userId: string;
  couponCode?: string | null;
  /**
   * 쿠폰의 사용 여부(is_used) 검사를 건너뛴다.
   * 결제 확인 단계에서는 쿠폰 선점(reserveUserCouponForOrder)이 사용 여부의 기준이므로 true 로 호출한다.
   */
  skipCouponUsedCheck?: boolean;
}

export interface ComputedOrderAmount {
  baseAmount: number;
  serviceFee: number;
  discountAmount: number;
  totalAmount: number;
  expertId: string;
  packageId: string | null;
  packageName: string | null;
  couponId: string | null;
  userCouponId: string | null;
}

export type ComputeOrderAmountResult =
  | { ok: true; data: ComputedOrderAmount }
  | { ok: false; error: string; status: number; transient?: boolean };

const TRANSIENT_FAILURE: ComputeOrderAmountResult = {
  ok: false,
  error: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요",
  status: 503,
  transient: true,
};

export async function computeOrderAmount(
  params: ComputeOrderAmountParams,
): Promise<ComputeOrderAmountResult> {
  const admin = createAdminSupabaseClient();

  // 1. 서비스 조회
  const { data: service, error: serviceError } = await admin
    .from("services")
    .select("id, price, expert_id, status")
    .eq("id", params.serviceId)
    .maybeSingle();

  if (serviceError) {
    console.error("[computeOrderAmount] service lookup failed:", serviceError);
    return TRANSIENT_FAILURE;
  }
  if (!service) {
    return { ok: false, error: "서비스를 찾을 수 없습니다", status: 404 };
  }
  if (service.status !== "active") {
    return { ok: false, error: "현재 주문할 수 없는 서비스입니다", status: 400 };
  }

  // 2. 패키지 조회 (packageName이 있으면 해당 패키지, 없으면 서비스 기본가)
  let baseAmount = service.price as number;
  let packageId: string | null = null;
  let resolvedPackageName: string | null = null;

  if (params.packageName) {
    const { data: pkg, error: pkgError } = await admin
      .from("service_packages")
      .select("id, name, price")
      .eq("service_id", params.serviceId)
      .eq("name", params.packageName)
      .maybeSingle();

    if (pkgError) {
      console.error("[computeOrderAmount] package lookup failed:", pkgError);
      return TRANSIENT_FAILURE;
    }
    if (!pkg) {
      return { ok: false, error: "선택한 패키지를 찾을 수 없습니다", status: 400 };
    }
    baseAmount = pkg.price as number;
    packageId = pkg.id as string;
    resolvedPackageName = pkg.name as string;
  } else {
    // 패키지를 등록한 서비스는 패키지를 골라야 한다. 이름 없이 오면 서비스 대표 가격(가장 싼 패키지)으로
    // 더 비싼 패키지의 조건을 사는 셈이 될 수 있다. 패키지가 하나도 없는 서비스만 대표 가격으로 계산한다.
    const { count, error: countError } = await admin
      .from("service_packages")
      .select("id", { count: "exact", head: true })
      .eq("service_id", params.serviceId);
    if (countError) {
      console.error("[computeOrderAmount] package count failed:", countError);
      return TRANSIENT_FAILURE;
    }
    if ((count ?? 0) > 0) {
      return { ok: false, error: "패키지를 선택해 주세요", status: 400 };
    }
  }

  // 3. 서비스 수수료 (5%) - 프론트와 동일한 계산식
  const serviceFee = Math.round(baseAmount * 0.05);
  const baseTotal = baseAmount + serviceFee;

  // 4. 쿠폰 적용 (서버 검증)
  let discountAmount = 0;
  let couponId: string | null = null;
  let userCouponId: string | null = null;

  if (params.couponCode) {
    const code = params.couponCode.trim().toUpperCase();
    const { data: coupon, error: couponError } = await admin
      .from("coupons")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (couponError) {
      console.error("[computeOrderAmount] coupon lookup failed:", couponError);
      return TRANSIENT_FAILURE;
    }
    if (!coupon || !coupon.is_active) {
      return { ok: false, error: "유효하지 않은 쿠폰입니다", status: 400 };
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { ok: false, error: "만료된 쿠폰입니다", status: 400 };
    }
    if (baseTotal < (coupon.min_order_amount ?? 0)) {
      return { ok: false, error: "쿠폰 최소 주문 금액 미달", status: 400 };
    }

    // 사용자 보유/사용여부 확인
    const { data: userCoupon, error: userCouponError } = await admin
      .from("user_coupons")
      .select("id, is_used, expires_at")
      .eq("user_id", params.userId)
      .eq("coupon_id", coupon.id)
      .maybeSingle();

    if (userCouponError) {
      console.error("[computeOrderAmount] user coupon lookup failed:", userCouponError);
      return TRANSIENT_FAILURE;
    }
    if (!userCoupon) {
      return { ok: false, error: "보유하지 않은 쿠폰입니다", status: 400 };
    }
    if (userCoupon.is_used && !params.skipCouponUsedCheck) {
      return { ok: false, error: "이미 사용한 쿠폰입니다", status: 400 };
    }
    if (userCoupon.expires_at && new Date(userCoupon.expires_at) < new Date()) {
      return { ok: false, error: "만료된 쿠폰입니다", status: 400 };
    }

    if (coupon.discount_type === "percent") {
      discountAmount = Math.round(baseTotal * (coupon.discount_value / 100));
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    } else {
      discountAmount = coupon.discount_value;
    }
    discountAmount = Math.max(0, Math.min(discountAmount, baseTotal));
    couponId = coupon.id as string;
    userCouponId = userCoupon.id as string;
  }

  const totalAmount = Math.max(0, baseTotal - discountAmount);

  return {
    ok: true,
    data: {
      baseAmount,
      serviceFee,
      discountAmount,
      totalAmount,
      expertId: service.expert_id as string,
      packageId,
      packageName: resolvedPackageName,
      couponId,
      userCouponId,
    },
  };
}
