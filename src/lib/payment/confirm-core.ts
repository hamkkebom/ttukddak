/**
 * 결제 확인 판정 로직.
 *
 * PortOne 에서 조회한 결제와 DB 주문을 비교해 "수락 / 거절 / 결제 자동 취소" 를 결정한다.
 * DB·네트워크 접근이 없는 순수 모듈이라 단위 테스트로 검증한다. 실제 조회와 갱신은
 * `confirm.ts` 가 담당한다.
 *
 * 판정 종류
 * - already_processed : 같은 결제로 이미 처리된 주문 (중복 호출)
 * - reject            : 이 주문의 결제가 아니거나 아직 완료되지 않음. 결제는 건드리지 않는다.
 * - cancel            : 이 주문을 위한 결제이지만 받아들일 수 없음. 고객 돈이 묶이지 않도록
 *                       결제를 자동 취소해야 한다.
 * - check_terms / accept : 다음 단계로 진행
 */

export type PaymentMode = "test" | "live";

/** 클라이언트와 같은 기준: 명시적으로 "live" 일 때만 실결제 모드 */
export function resolvePaymentMode(raw: string | null | undefined): PaymentMode {
  return raw === "live" ? "live" : "test";
}

export interface PaymentSnapshot {
  id: string;
  status: string;
  totalAmount: number | null;
  currency: string | null;
  /** PortOne 채널 타입: "LIVE" | "TEST" */
  channelType: string | null;
  /** 결제 요청 시 넣은 customData (JSON 문자열) */
  customData: string | null;
}

export interface OrderSnapshot {
  id: string;
  status: string;
  amount: number;
  sellerId: string;
  paymentId: string | null;
}

export type RejectCode = "payment_not_completed" | "payment_not_for_order";

export type CancelCode =
  | "order_not_payable"
  | "channel_mode_mismatch"
  | "currency_mismatch"
  | "amount_mismatch"
  | "terms_invalid"
  | "terms_changed"
  | "seller_mismatch"
  | "order_claim_failed"
  | "coupon_unavailable";

/**
 * 주문 조건 자체가 더 이상 유효하지 않아 생긴 취소.
 * 이 경우 같은 주문으로 다시 결제해도 또 취소되므로 주문을 종료(failed)시켜야 한다.
 *
 * 결제 쪽 문제(금액·통화·채널 불일치)는 여기에 넣지 않는다. 그런 결제는 주문 ID 만 알면
 * 제3자도 만들 수 있으므로, 그것을 이유로 남의 주문을 닫아서는 안 된다.
 */
export const STALE_ORDER_CANCEL_CODES: readonly CancelCode[] = [
  "terms_invalid",
  "terms_changed",
  "seller_mismatch",
];

export type PreValidation =
  | { action: "already_processed" }
  | { action: "reject"; code: RejectCode }
  | { action: "cancel"; code: CancelCode }
  | { action: "check_terms"; nextStatus: "paid" | "virtual_account_issued" };

export type ExpectedTerms =
  | { ok: true; amount: number; sellerId: string }
  | { ok: false };

export type TermsValidation = { action: "accept" } | { action: "cancel"; code: CancelCode };

/** customData 에서 orderId 를 꺼낸다. 없거나 형식이 다르면 null. */
export function extractCustomOrderId(customData: string | null | undefined): string | null {
  if (typeof customData !== "string" || customData.length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(customData);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const orderId = (parsed as Record<string, unknown>).orderId;
      return typeof orderId === "string" && orderId.length > 0 ? orderId : null;
    }
  } catch {
    // JSON 이 아니면 주문과 연결할 수 없는 값으로 본다.
  }
  return null;
}

/**
 * 결제가 이 주문을 위해 만들어졌는지 확인한다.
 *
 * 결제 요청 때 customData.orderId 와 paymentId(`payment-<orderId>-<timestamp>`) 에 주문 ID 를
 * 넣는다. customData 가 있으면 그 값이 기준이고, 없을 때만 paymentId 접두사를 본다.
 */
export function isPaymentBoundToOrder(
  paymentId: string,
  customData: string | null | undefined,
  orderId: string,
): boolean {
  if (!orderId) return false;

  const hasCustomData = typeof customData === "string" && customData.length > 0;
  if (hasCustomData) {
    return extractCustomOrderId(customData) === orderId;
  }
  return paymentId.startsWith(`payment-${orderId}-`);
}

export function preValidatePayment(input: {
  order: OrderSnapshot;
  payment: PaymentSnapshot;
  paymentMode: PaymentMode;
}): PreValidation {
  const { order, payment, paymentMode } = input;

  // 같은 결제로 이미 처리된 주문이면 다시 처리하지 않는다.
  if (order.paymentId === payment.id && order.status !== "pending") {
    return { action: "already_processed" };
  }

  if (payment.status !== "PAID" && payment.status !== "VIRTUAL_ACCOUNT_ISSUED") {
    return { action: "reject", code: "payment_not_completed" };
  }

  // 다른 주문의 결제를 가져다 쓰는 것을 막는다. 남의 결제일 수 있으므로 취소하지 않는다.
  if (!isPaymentBoundToOrder(payment.id, payment.customData, order.id)) {
    return { action: "reject", code: "payment_not_for_order" };
  }

  // 여기부터는 "이 주문을 위한 결제" 다. 받아들일 수 없으면 자동 취소해 돈이 묶이지 않게 한다.
  if (order.status !== "pending") {
    return { action: "cancel", code: "order_not_payable" };
  }

  const expectedChannel = paymentMode === "live" ? "LIVE" : "TEST";
  if (payment.channelType !== expectedChannel) {
    return { action: "cancel", code: "channel_mode_mismatch" };
  }

  if (payment.currency !== "KRW") {
    return { action: "cancel", code: "currency_mismatch" };
  }

  if (payment.totalAmount === null || payment.totalAmount !== order.amount) {
    return { action: "cancel", code: "amount_mismatch" };
  }

  return {
    action: "check_terms",
    nextStatus: payment.status === "PAID" ? "paid" : "virtual_account_issued",
  };
}

/** 서버가 현재 서비스·패키지·쿠폰(또는 합의견적)으로 다시 계산한 조건과 비교한다. */
export function validateTerms(input: {
  order: OrderSnapshot;
  payment: PaymentSnapshot;
  expected: ExpectedTerms;
}): TermsValidation {
  const { order, payment, expected } = input;

  if (!expected.ok) return { action: "cancel", code: "terms_invalid" };
  if (expected.sellerId !== order.sellerId) return { action: "cancel", code: "seller_mismatch" };
  if (expected.amount !== payment.totalAmount) return { action: "cancel", code: "terms_changed" };

  return { action: "accept" };
}
