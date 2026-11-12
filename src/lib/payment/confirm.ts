import "server-only";
import * as PortOne from "@portone/server-sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { computeOrderAmount } from "@/lib/payment/amount";
import { reserveUserCouponForOrder } from "@/lib/payment/coupons";
import {
  STALE_ORDER_CANCEL_CODES,
  preValidatePayment,
  resolvePaymentMode,
  validateTerms,
  type CancelCode,
  type ExpectedTerms,
  type OrderSnapshot,
  type PaymentSnapshot,
  type RejectCode,
} from "@/lib/payment/confirm-core";

/**
 * 결제 확인 (결제 확인 API 와 웹훅이 함께 쓴다).
 *
 * 1) PortOne 에서 결제를 다시 조회하고
 * 2) 그 결제가 이 주문을 위한 것인지, 채널·통화·금액·판매자·현재 가격 조건이 맞는지 확인한 뒤
 * 3) `pending` 인 주문만 원자적으로 결제 완료 처리한다.
 *
 * 취소 원칙
 * - 이 주문을 위한 결제인데 "확정적으로" 받아들일 수 없는 경우(가격 변경, 중복 결제, 쿠폰 소진 등)에만
 *   결제를 자동 취소해서 "돈은 나갔는데 주문은 미결제" 상태가 남지 않게 한다.
 * - DB 조회·갱신이 실패한 경우는 판단할 수 없는 상태이므로 절대 취소하지 않고
 *   `transient_error` 를 돌려준다 (호출 측이 재시도한다).
 * - 취소하기 직전에는 주문을 다시 읽어, 같은 결제로 이미 처리된 주문이면 취소하지 않는다
 *   (결제 확인 API 와 웹훅이 동시에 들어오는 경우).
 */

type OrderRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: string;
  service_id: string;
  package_id: string | null;
  coupon_id: string | null;
  deal_offer_id: string | null;
  payment_id: string | null;
};

export type ConfirmOutcome =
  | {
      kind: "confirmed";
      orderStatus: "paid" | "virtual_account_issued";
      paymentStatus: string;
      amount: number;
      transactionId: string | null;
    }
  | { kind: "already_processed"; orderStatus: string }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "provider_error" }
  | { kind: "transient_error" }
  | { kind: "rejected"; code: RejectCode; message: string }
  | {
      kind: "cancelled";
      code: CancelCode;
      message: string;
      /** PortOne 에서 결제를 되돌렸는지 */
      paymentCancelled: boolean;
      /** 되돌리지 못한 결제가 주문에 환불 대기로 기록됐는지 (paymentCancelled 가 false 일 때만 의미 있음) */
      recorded: boolean;
    };

const REJECT_MESSAGES: Record<RejectCode, string> = {
  payment_not_completed: "결제가 완료되지 않았습니다",
  payment_not_for_order: "이 주문의 결제 정보가 아닙니다",
};

const CANCEL_MESSAGES: Record<CancelCode, string> = {
  order_not_payable: "이미 처리된 주문입니다.",
  channel_mode_mismatch: "현재 결제 모드에서 사용할 수 없는 결제입니다.",
  currency_mismatch: "지원하지 않는 통화의 결제입니다.",
  amount_mismatch: "결제 금액이 주문 금액과 일치하지 않습니다.",
  terms_invalid: "주문 정보가 더 이상 유효하지 않습니다. 다시 주문해 주세요.",
  terms_changed: "주문 후 가격 또는 할인 조건이 변경되었습니다. 다시 주문해 주세요.",
  seller_mismatch: "주문 정보가 유효하지 않습니다. 다시 주문해 주세요.",
  order_claim_failed: "이미 처리된 주문입니다.",
  coupon_unavailable: "쿠폰을 사용할 수 없습니다. 다시 주문해 주세요.",
};

function cancelledOutcome(
  code: CancelCode,
  paymentCancelled: boolean,
  recorded = false,
): ConfirmOutcome {
  const suffix = paymentCancelled
    ? " 결제는 자동으로 취소되었습니다."
    : " 결제 자동 취소에 실패했습니다. 고객센터로 문의해 주세요.";
  return {
    kind: "cancelled",
    code,
    message: CANCEL_MESSAGES[code] + suffix,
    paymentCancelled,
    recorded,
  };
}

function toPaymentSnapshot(payment: unknown): PaymentSnapshot {
  const p = payment as {
    id?: unknown;
    status?: unknown;
    currency?: unknown;
    amount?: { total?: unknown } | null;
    channel?: { type?: unknown } | null;
    customData?: unknown;
  };
  return {
    id: typeof p.id === "string" ? p.id : "",
    status: typeof p.status === "string" ? p.status : "",
    totalAmount: typeof p.amount?.total === "number" ? p.amount.total : null,
    currency: typeof p.currency === "string" ? p.currency : null,
    channelType: typeof p.channel?.type === "string" ? p.channel.type : null,
    customData: typeof p.customData === "string" ? p.customData : null,
  };
}

type PortOneClient = ReturnType<typeof PortOne.PortOneClient>;

/**
 * PortOne 에서 결제를 되돌린다.
 * 입금 전 가상계좌는 취소가 아니라 계좌 말소로 처리한다.
 */
async function cancelAtProvider(
  portone: PortOneClient,
  payment: PaymentSnapshot,
  reason: string,
): Promise<boolean> {
  try {
    if (payment.status === "VIRTUAL_ACCOUNT_ISSUED") {
      await portone.payment.closeVirtualAccount({ paymentId: payment.id });
    } else {
      await portone.payment.cancelPayment({ paymentId: payment.id, reason });
    }
    return true;
  } catch (e) {
    console.error(
      `[PaymentConfirm] auto-cancel failed for paymentId=${payment.id}:`,
      e instanceof Error ? e.message : e,
    );
    return false;
  }
}

type OrderState = { status: string; payment_id: string | null };

/** 주문의 현재 상태를 다시 읽는다. 조회 실패는 "error", 주문 없음은 null. */
async function readOrderState(
  admin: SupabaseClient,
  orderId: string,
): Promise<OrderState | "error" | null> {
  const { data, error } = await admin
    .from("orders")
    .select("status, payment_id")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("[PaymentConfirm] order re-read failed:", error);
    return "error";
  }
  return (data as OrderState | null) ?? null;
}

/**
 * 받아들일 수 없는 결제를 되돌린다 (주문을 아직 선점하지 않은 단계에서 호출).
 */
async function abortUnclaimedPayment(ctx: {
  admin: SupabaseClient;
  portone: PortOneClient;
  orderId: string;
  payment: PaymentSnapshot;
  code: CancelCode;
  /**
   * 로그인한 구매자 본인이 제시한 결제인지. 그런 경우에만 취소 실패를 주문에 기록한다.
   * 웹훅으로 들어온 결제는 누가 만든 것인지 알 수 없으므로 주문 상태를 건드리지 않는다.
   */
  presentedByBuyer: boolean;
}): Promise<ConfirmOutcome> {
  const { admin, portone, orderId, payment, code, presentedByBuyer } = ctx;

  // 취소 직전에 주문을 다시 확인한다. 다른 요청이 같은 결제로 이미 처리했다면 취소하면 안 된다.
  const current = await readOrderState(admin, orderId);
  if (current === "error") return { kind: "transient_error" };
  if (!current) return { kind: "not_found" };
  if (current.payment_id === payment.id && current.status !== "pending") {
    return { kind: "already_processed", orderStatus: current.status };
  }

  const cancelled = await cancelAtProvider(portone, payment, CANCEL_MESSAGES[code]);

  // 주문이 아직 pending 이면 뒤처리를 남긴다.
  let recorded = false;
  if (current.status === "pending") {
    const now = new Date().toISOString();
    if (!cancelled) {
      // 돈이 잡혀 있는데 되돌리지 못했다. 구매자 본인이 제시한 결제라면 결제 ID 와 함께
      // 환불 대기로 기록해 운영자가 확인할 수 있게 한다.
      if (presentedByBuyer) {
        const { data: flagged, error } = await admin
          .from("orders")
          .update({ status: "refund_requested", payment_id: payment.id, updated_at: now })
          .eq("id", orderId)
          .eq("status", "pending")
          .select("id");
        if (error) console.error("[PaymentConfirm] failed to flag order for manual refund:", error);
        recorded = !error && (flagged?.length ?? 0) > 0;
      }
    } else if (STALE_ORDER_CANCEL_CODES.includes(code)) {
      // 조건이 바뀐 주문은 다시 결제해도 또 취소되므로 종료시킨다.
      const { error } = await admin
        .from("orders")
        .update({ status: "failed", updated_at: now })
        .eq("id", orderId)
        .eq("status", "pending");
      if (error) console.error("[PaymentConfirm] failed to close stale order:", error);
    }
  }

  if (!cancelled && !recorded) {
    // 기록할 곳이 없는 미취소 결제. 웹훅 재시도에서 다시 취소를 시도하며, 운영자가 볼 수 있게 남긴다.
    console.error(
      "[PaymentConfirm] UNRESOLVED captured payment: paymentId=" +
        payment.id +
        " orderId=" +
        orderId +
        " reason=" +
        code,
    );
  }

  return cancelledOutcome(code, cancelled, recorded);
}

/**
 * 현재 DB 기준으로 이 주문이 결제되어야 할 금액과 판매자를 다시 계산한다.
 * DB 조회 실패는 "transient" (조건이 틀렸다는 뜻이 아님).
 */
async function computeExpectedTerms(
  admin: SupabaseClient,
  order: OrderRow,
): Promise<ExpectedTerms | "transient"> {
  if (order.deal_offer_id) {
    const { data: offer, error } = await admin
      .from("deal_offers")
      .select("amount, status, order_id, buyer_id, expert_id, service_id")
      .eq("id", order.deal_offer_id)
      .maybeSingle();

    if (error) {
      console.error("[PaymentConfirm] deal offer lookup failed:", error);
      return "transient";
    }
    if (
      !offer ||
      offer.status !== "accepted" ||
      offer.order_id !== order.id ||
      offer.buyer_id !== order.buyer_id ||
      offer.service_id !== order.service_id
    ) {
      return { ok: false };
    }
    return { ok: true, amount: offer.amount as number, sellerId: offer.expert_id as string };
  }

  let packageName: string | null = null;
  if (order.package_id) {
    const { data: pkg, error } = await admin
      .from("service_packages")
      .select("name")
      .eq("id", order.package_id)
      .maybeSingle();
    if (error) {
      console.error("[PaymentConfirm] package lookup failed:", error);
      return "transient";
    }
    if (!pkg) return { ok: false };
    packageName = pkg.name as string;
  }

  let couponCode: string | null = null;
  if (order.coupon_id) {
    const { data: uc, error } = await admin
      .from("user_coupons")
      .select("coupon_id, coupons(code)")
      .eq("id", order.coupon_id)
      .maybeSingle();
    if (error) {
      console.error("[PaymentConfirm] coupon lookup failed:", error);
      return "transient";
    }
    const couponRel = (uc as unknown as { coupons?: { code?: string } | { code?: string }[] } | null)
      ?.coupons;
    if (Array.isArray(couponRel)) {
      couponCode = couponRel[0]?.code ?? null;
    } else if (couponRel && typeof couponRel === "object") {
      couponCode = couponRel.code ?? null;
    }
    // 주문에 쿠폰이 걸려 있는데 쿠폰을 찾을 수 없으면 할인 조건을 확인할 수 없다.
    if (!couponCode) return { ok: false };
  }

  // 쿠폰 사용 여부는 여기서 보지 않는다. 결제 확인 API 와 웹훅이 동시에 들어오면 한쪽이 방금
  // 선점한 쿠폰을 다른 쪽이 "이미 사용됨" 으로 오판할 수 있다. 기준은 주문 선점 뒤의 쿠폰 선점이다.
  const recomputed = await computeOrderAmount({
    serviceId: order.service_id,
    packageName,
    userId: order.buyer_id,
    couponCode,
    skipCouponUsedCheck: true,
  });
  if (!recomputed.ok) return recomputed.transient ? "transient" : { ok: false };

  return { ok: true, amount: recomputed.data.totalAmount, sellerId: recomputed.data.expertId };
}

export async function confirmPaymentForOrder(params: {
  orderId: string;
  paymentId: string;
  /** 로그인 사용자가 호출한 경우 그 사용자 ID. 웹훅처럼 서버가 호출하면 생략한다. */
  actingUserId?: string;
}): Promise<ConfirmOutcome> {
  const { orderId, paymentId, actingUserId } = params;
  const admin = createAdminSupabaseClient();

  const { data: orderData, error: orderError } = await admin
    .from("orders")
    .select(
      "id, buyer_id, seller_id, amount, status, service_id, package_id, coupon_id, deal_offer_id, payment_id",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    console.error("[PaymentConfirm] order lookup failed:", orderError);
    return { kind: "transient_error" };
  }
  if (!orderData) return { kind: "not_found" };
  const order = orderData as OrderRow;

  if (actingUserId && order.buyer_id !== actingUserId) return { kind: "forbidden" };

  // 같은 결제로 이미 처리된 주문 (웹훅이 먼저 처리했거나 중복 호출)
  if (order.payment_id === paymentId && order.status !== "pending") {
    return { kind: "already_processed", orderStatus: order.status };
  }

  const portone = PortOne.PortOneClient({ secret: process.env.PORTONE_API_SECRET ?? "" });

  let rawPayment: unknown;
  try {
    rawPayment = await portone.payment.getPayment({ paymentId });
  } catch (e) {
    if (e instanceof PortOne.PortOneError) return { kind: "provider_error" };
    throw e;
  }

  const payment = toPaymentSnapshot(rawPayment);
  // 조회한 결제의 ID 가 요청한 ID 와 다르면 신뢰하지 않는다.
  if (payment.id !== paymentId) return { kind: "provider_error" };

  const orderSnapshot: OrderSnapshot = {
    id: order.id,
    status: order.status,
    amount: order.amount,
    sellerId: order.seller_id,
    paymentId: order.payment_id,
  };

  const pre = preValidatePayment({
    order: orderSnapshot,
    payment,
    paymentMode: resolvePaymentMode(process.env.NEXT_PUBLIC_PAYMENT_MODE),
  });

  if (pre.action === "already_processed") {
    return { kind: "already_processed", orderStatus: order.status };
  }
  if (pre.action === "reject") {
    return { kind: "rejected", code: pre.code, message: REJECT_MESSAGES[pre.code] };
  }
  const presentedByBuyer = Boolean(actingUserId);
  if (pre.action === "cancel") {
    return abortUnclaimedPayment({
      admin,
      portone,
      orderId,
      payment,
      code: pre.code,
      presentedByBuyer,
    });
  }

  const expected = await computeExpectedTerms(admin, order);
  if (expected === "transient") return { kind: "transient_error" };

  const terms = validateTerms({ order: orderSnapshot, payment, expected });
  if (terms.action === "cancel") {
    return abortUnclaimedPayment({
      admin,
      portone,
      orderId,
      payment,
      code: terms.code,
      presentedByBuyer,
    });
  }

  // 주문 선점: pending 인 주문만 결제 완료로 바꾼다. 동시에 들어온 요청 중 하나만 성공한다.
  const nextStatus = pre.nextStatus;
  const raw = rawPayment as { transactionId?: unknown; pgTxId?: unknown };
  const transactionId = typeof raw.transactionId === "string" ? raw.transactionId : null;
  const pgTxId = typeof raw.pgTxId === "string" ? raw.pgTxId : null;

  const claimUpdate: Record<string, unknown> = {
    status: nextStatus,
    payment_id: paymentId,
    transaction_id: transactionId,
    updated_at: new Date().toISOString(),
  };
  if (pgTxId) claimUpdate.pg_tx_id = pgTxId;

  const { data: claimed, error: claimError } = await admin
    .from("orders")
    .update(claimUpdate)
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id");

  if (claimError || (claimed?.length ?? 0) === 0) {
    const current = await readOrderState(admin, orderId);
    if (current === "error") return { kind: "transient_error" };
    if (!current) return { kind: "not_found" };

    // 다른 요청이 같은 결제로 먼저 처리했다면 성공이다.
    if (current.payment_id === paymentId && current.status !== "pending") {
      return { kind: "already_processed", orderStatus: current.status };
    }

    // 갱신 자체가 실패했다면 판단할 수 없다. 취소하지 않고 재시도에 맡긴다.
    if (claimError) {
      console.error("[PaymentConfirm] claim failed:", claimError);
      return { kind: "transient_error" };
    }

    // 주문이 다른 결제로 넘어갔거나 닫혔다. 이 결제는 중복 결제이므로 되돌린다.
    return abortUnclaimedPayment({
      admin,
      portone,
      orderId,
      payment,
      code: "order_claim_failed",
      presentedByBuyer,
    });
  }

  // 쿠폰 선점: 같은 쿠폰으로 다른 주문이 먼저 결제됐다면 이 결제는 되돌린다.
  if (order.coupon_id) {
    let reservation = await reserveUserCouponForOrder(admin, order.coupon_id, order.id);
    if (reservation === "error") {
      reservation = await reserveUserCouponForOrder(admin, order.coupon_id, order.id);
    }

    if (reservation === "taken") {
      const cancelled = await cancelAtProvider(
        portone,
        payment,
        CANCEL_MESSAGES.coupon_unavailable,
      );
      // 이 주문은 방금 이 결제로 선점됐으므로 결제 ID 가 이미 기록돼 있다.
      const { data: reverted, error: revertError } = await admin
        .from("orders")
        .update({
          status: cancelled ? "failed" : "refund_requested",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("payment_id", paymentId)
        .eq("status", nextStatus)
        .select("id");
      if (revertError) console.error("[PaymentConfirm] failed to revert order:", revertError);
      const recorded = !revertError && (reverted?.length ?? 0) > 0;
      if (!cancelled && !recorded) {
        console.error(
          "[PaymentConfirm] UNRESOLVED captured payment: paymentId=" +
            paymentId +
            " orderId=" +
            orderId +
            " reason=coupon_unavailable",
        );
      }
      return cancelledOutcome("coupon_unavailable", cancelled, recorded);
    }

    if (reservation === "error") {
      // 결제는 유효하므로 주문은 유지한다. 쿠폰 사용 처리만 누락됐을 수 있어 기록을 남긴다.
      console.error(
        `[PaymentConfirm] coupon reservation could not be confirmed (order=${orderId}, coupon=${order.coupon_id})`,
      );
    }
  }

  return {
    kind: "confirmed",
    orderStatus: nextStatus,
    paymentStatus: payment.status,
    amount: payment.totalAmount ?? order.amount,
    transactionId,
  };
}
