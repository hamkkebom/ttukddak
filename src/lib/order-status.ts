/**
 * 주문 상태 전이 규칙.
 *
 * 외부 의존성이 없는 순수 모듈이다 (서버·클라이언트·테스트에서 그대로 import 가능).
 *
 * 원칙
 * - 돈이 오간 상태(paid, virtual_account_issued, failed, refund_requested, refunded)는
 *   결제 확인·웹훅·환불 라우트만 설정한다. 일반 상태 변경 API로는 관리자도 설정할 수 없다.
 * - 취소(cancelled)는 결제 전(pending) 주문에서만 가능하다. 결제된 주문을 끝내려면
 *   PortOne 취소가 함께 일어나는 환불 라우트를 써야 한다. 그렇지 않으면 돈은 잡힌 채
 *   주문만 취소된 상태가 된다.
 * - 결제되지 않은 주문(pending, virtual_account_issued)은 누구도 작업·완료 상태로 옮길 수 없다.
 * - 구매 확정(completed)은 쿠폰 집계가 함께 처리되는 구매 확정 API에서만 한다.
 */

export type OrderActor = "buyer" | "seller" | "admin";

/** 결제 시스템만 설정할 수 있는 상태 */
export const PAYMENT_CONTROLLED_STATUSES: readonly string[] = [
  "paid",
  "virtual_account_issued",
  "failed",
  "refund_requested",
  "refunded",
];

/** 결제가 끝나 작업이 진행 중인 상태 */
const WORK_STATUSES: readonly string[] = [
  "paid",
  "in_progress",
  "delivered",
  "review",
  "review_pending",
  "revision_requested",
];

/** 관리자가 작업 중인 주문을 옮길 수 있는 상태 */
const ADMIN_TARGETS: readonly string[] = ["in_progress", "delivered", "review", "completed"];

const USER_TRANSITIONS: Record<string, { buyer: readonly string[]; seller: readonly string[] }> = {
  pending: { buyer: ["cancelled"], seller: ["cancelled"] },
  virtual_account_issued: { buyer: [], seller: [] },
  paid: { buyer: [], seller: ["in_progress"] },
  in_progress: { buyer: [], seller: ["delivered"] },
  delivered: { buyer: ["review"], seller: [] },
  review_pending: { buyer: ["revision_requested"], seller: [] },
  revision_requested: { buyer: [], seller: ["delivered"] },
  review: { buyer: [], seller: ["delivered"] },
  completed: { buyer: [], seller: [] },
  cancelled: { buyer: [], seller: [] },
  failed: { buyer: [], seller: [] },
  refund_requested: { buyer: [], seller: [] },
  refunded: { buyer: [], seller: [] },
};

/** 일반 주문 상태 변경 API(PATCH/DELETE /api/orders/[id])에서 허용되는 전이인지 확인한다. */
export function canTransitionOrderStatus(current: string, next: string, actor: OrderActor): boolean {
  if (typeof current !== "string" || typeof next !== "string") return false;
  if (current === next) return false;

  // 결제 상태는 누구도 이 경로로 설정할 수 없다.
  if (PAYMENT_CONTROLLED_STATUSES.includes(next)) return false;

  // 취소는 결제 전 주문에서만.
  if (next === "cancelled") return current === "pending";

  if (actor === "admin") {
    // 관리자는 결제가 끝난 주문만 작업 상태 사이에서 옮기거나 완료 처리할 수 있다.
    return WORK_STATUSES.includes(current) && ADMIN_TARGETS.includes(next);
  }

  return USER_TRANSITIONS[current]?.[actor]?.includes(next) ?? false;
}

/** 구매자가 구매 확정·수정 요청을 할 수 있는 상태 (납품물을 받은 상태) */
export const BUYER_ACCEPTANCE_STATUSES: readonly string[] = ["delivered", "review", "review_pending"];

/**
 * 결제 웹훅이 알려 온 상태로 주문을 옮겨도 되는지 판단한다.
 *
 * - "apply": 상태를 바꾼다
 * - "noop" : 이미 그 상태다
 * - "skip" : 늦게 도착했거나 순서가 뒤바뀐 이벤트. 작업이 진행된 주문을 결제 단계로
 *            되돌리거나 끝난 주문을 되살리지 않는다.
 */
export function resolveWebhookTransition(
  current: string | null | undefined,
  next: string,
): "apply" | "noop" | "skip" {
  if (typeof current !== "string" || current.length === 0) return "skip";
  if (current === next) return "noop";

  switch (next) {
    case "virtual_account_issued":
      return current === "pending" ? "apply" : "skip";
    case "paid":
    case "failed":
      return current === "pending" || current === "virtual_account_issued" ? "apply" : "skip";
    case "refunded":
      // 전액 취소는 결제가 걸려 있는 모든 진행 상태에서 반영한다. 끝난 주문(completed, cancelled)은 제외.
      return current === "pending" ||
        current === "virtual_account_issued" ||
        current === "failed" ||
        current === "refund_requested" ||
        WORK_STATUSES.includes(current)
        ? "apply"
        : "skip";
    default:
      return "skip";
  }
}
