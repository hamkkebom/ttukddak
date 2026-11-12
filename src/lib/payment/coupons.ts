import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 쿠폰 사용 처리.
 *
 * user_coupons 에는 "어느 주문이 썼는지" 를 담는 컬럼이 없다. 그래서 쿠폰을 쥐고 있는 주문은
 * orders.coupon_id 로 판단한다: 결제 전이거나 결제 없이 끝난 주문(pending, cancelled, failed)을
 * 제외한 주문이 그 쿠폰을 쥐고 있는 것으로 본다. (환불된 주문도 쿠폰은 사용한 것으로 유지한다.)
 */

export type CouponReservation = "reserved" | "taken" | "error";

/** 다른 주문이 이 쿠폰을 쥐고 있는지. 조회에 실패하면 null. */
async function isHeldByAnotherOrder(
  admin: SupabaseClient,
  userCouponId: string,
  orderId: string,
): Promise<boolean | null> {
  const { data, error } = await admin
    .from("orders")
    .select("id")
    .eq("coupon_id", userCouponId)
    .neq("id", orderId)
    .not("status", "in", "(pending,cancelled,failed)")
    .limit(1);

  if (error) {
    console.error("[Coupon] holder lookup failed:", error);
    return null;
  }
  return (data?.length ?? 0) > 0;
}

/**
 * 결제 시점에 쿠폰을 선점한다.
 *
 * - "reserved": 이 주문이 쿠폰을 쓴다 (이미 이 주문 몫으로 사용 처리돼 있던 경우 포함 → 재시도에 안전)
 * - "taken"   : 다른 주문이 먼저 썼다
 * - "error"   : DB 오류로 판단할 수 없다. 이 경우 결제를 취소해서는 안 된다.
 *
 * `is_used = false` 인 행만 갱신하므로 같은 쿠폰으로 동시에 결제가 들어와도 한 건만 통과한다.
 */
export async function reserveUserCouponForOrder(
  admin: SupabaseClient,
  userCouponId: string,
  orderId: string,
): Promise<CouponReservation> {
  const { data, error } = await admin
    .from("user_coupons")
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq("id", userCouponId)
    .eq("is_used", false)
    .select("id");

  if (error) {
    console.error("[Coupon] reserve failed:", error);
    return "error";
  }
  if ((data?.length ?? 0) === 1) return "reserved";

  // 이미 사용 처리된 쿠폰: 다른 주문이 쥐고 있으면 사용 불가, 아니면 이 주문 몫이다.
  const held = await isHeldByAnotherOrder(admin, userCouponId, orderId);
  if (held === null) return "error";
  return held ? "taken" : "reserved";
}

/**
 * 결제 없이 끝난 주문의 쿠폰을 다시 쓸 수 있게 되돌린다.
 * 다른 주문이 그 쿠폰을 쥐고 있으면 건드리지 않는다.
 */
export async function releaseUserCouponForOrder(
  admin: SupabaseClient,
  userCouponId: string,
  orderId: string,
): Promise<void> {
  const held = await isHeldByAnotherOrder(admin, userCouponId, orderId);
  if (held !== false) return;

  const { error } = await admin
    .from("user_coupons")
    .update({ is_used: false, used_at: null })
    .eq("id", userCouponId)
    .eq("is_used", true);

  if (error) console.error("[Coupon] release failed:", error);
}
