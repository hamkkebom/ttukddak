import assert from "node:assert/strict";
import test from "node:test";
import {
  BUYER_ACCEPTANCE_STATUSES,
  PAYMENT_CONTROLLED_STATUSES,
  canTransitionOrderStatus,
  resolveWebhookTransition,
} from "../src/lib/order-status.ts";

const ACTORS = ["buyer", "seller", "admin"];
const ALL_STATUSES = [
  "pending",
  "virtual_account_issued",
  "paid",
  "in_progress",
  "delivered",
  "review",
  "review_pending",
  "revision_requested",
  "completed",
  "cancelled",
  "failed",
  "refund_requested",
  "refunded",
];

test("nobody can move an order into a payment-controlled status", () => {
  for (const actor of ACTORS) {
    for (const current of ALL_STATUSES) {
      for (const next of PAYMENT_CONTROLLED_STATUSES) {
        assert.equal(
          canTransitionOrderStatus(current, next, actor),
          false,
          `${actor}: ${current} -> ${next} must be rejected`,
        );
      }
    }
  }
});

test("an unpaid order cannot be marked paid by buyer, seller or admin", () => {
  for (const actor of ACTORS) {
    assert.equal(canTransitionOrderStatus("pending", "paid", actor), false);
    assert.equal(canTransitionOrderStatus("virtual_account_issued", "paid", actor), false);
  }
});

test("cancellation is only possible before payment", () => {
  for (const actor of ACTORS) {
    assert.equal(canTransitionOrderStatus("pending", "cancelled", actor), true);
    for (const current of ALL_STATUSES.filter((s) => s !== "pending")) {
      assert.equal(
        canTransitionOrderStatus(current, "cancelled", actor),
        false,
        `${actor}: ${current} -> cancelled must go through the refund flow`,
      );
    }
  }
});

test("seller progresses work, buyer does not", () => {
  assert.equal(canTransitionOrderStatus("paid", "in_progress", "seller"), true);
  assert.equal(canTransitionOrderStatus("paid", "in_progress", "buyer"), false);
  assert.equal(canTransitionOrderStatus("in_progress", "delivered", "seller"), true);
  assert.equal(canTransitionOrderStatus("in_progress", "delivered", "buyer"), false);
  assert.equal(canTransitionOrderStatus("revision_requested", "delivered", "seller"), true);
});

test("a seller cannot start or deliver work on an unpaid order", () => {
  for (const unpaid of ["pending", "virtual_account_issued"]) {
    for (const next of ["in_progress", "delivered", "review", "completed"]) {
      assert.equal(canTransitionOrderStatus(unpaid, next, "seller"), false);
      assert.equal(canTransitionOrderStatus(unpaid, next, "buyer"), false);
    }
  }
});

test("purchase confirmation is not available through the generic status change", () => {
  // 구매 확정은 쿠폰 집계가 함께 처리되는 전용 API 에서만 한다.
  for (const current of ALL_STATUSES) {
    assert.equal(canTransitionOrderStatus(current, "completed", "buyer"), false);
    assert.equal(canTransitionOrderStatus(current, "completed", "seller"), false);
  }
  assert.equal(canTransitionOrderStatus("delivered", "review", "buyer"), true);
  assert.deepEqual([...BUYER_ACCEPTANCE_STATUSES].sort(), ["delivered", "review", "review_pending"]);
});

test("finished orders do not move for buyers and sellers", () => {
  for (const current of ["completed", "cancelled", "failed", "refunded", "refund_requested"]) {
    for (const next of ALL_STATUSES) {
      assert.equal(canTransitionOrderStatus(current, next, "buyer"), false);
      assert.equal(canTransitionOrderStatus(current, next, "seller"), false);
    }
  }
});

test("admin moves paid work forward but can never start or finish an unpaid order", () => {
  assert.equal(canTransitionOrderStatus("paid", "in_progress", "admin"), true);
  assert.equal(canTransitionOrderStatus("in_progress", "completed", "admin"), true);
  assert.equal(canTransitionOrderStatus("in_progress", "review", "admin"), true);
  assert.equal(canTransitionOrderStatus("review", "completed", "admin"), true);

  // 결제되지 않은 주문은 관리자도 작업·완료 상태로 옮길 수 없다.
  for (const unpaid of ["pending", "virtual_account_issued"]) {
    for (const next of ["in_progress", "delivered", "review", "review_pending", "revision_requested", "completed"]) {
      assert.equal(
        canTransitionOrderStatus(unpaid, next, "admin"),
        false,
        `admin: ${unpaid} -> ${next} would let an unpaid order reach settlement`,
      );
    }
  }

  // 끝난 주문과 알 수 없는 상태는 움직이지 않는다.
  for (const finished of ["completed", "cancelled", "failed", "refunded", "refund_requested"]) {
    for (const next of ALL_STATUSES) {
      assert.equal(canTransitionOrderStatus(finished, next, "admin"), false);
    }
  }
  assert.equal(canTransitionOrderStatus("in_progress", "made_up", "admin"), false);
  assert.equal(canTransitionOrderStatus("made_up", "completed", "admin"), false);
});

test("same status, unknown status and non-string input are rejected", () => {
  for (const actor of ACTORS) {
    assert.equal(canTransitionOrderStatus("paid", "paid", actor), false);
    assert.equal(canTransitionOrderStatus("nope", "completed", actor), false);
    assert.equal(canTransitionOrderStatus("delivered", undefined, actor), false);
    assert.equal(canTransitionOrderStatus("delivered", { toString: () => "completed" }, actor), false);
  }
});

test("payment webhooks never move an order backwards", () => {
  // 정상 순서
  assert.equal(resolveWebhookTransition("pending", "paid"), "apply");
  assert.equal(resolveWebhookTransition("pending", "virtual_account_issued"), "apply");
  assert.equal(resolveWebhookTransition("virtual_account_issued", "paid"), "apply");
  assert.equal(resolveWebhookTransition("virtual_account_issued", "failed"), "apply");
  assert.equal(resolveWebhookTransition("pending", "failed"), "apply");

  // 같은 상태는 변경 없음
  for (const status of ["paid", "virtual_account_issued", "failed", "refunded"]) {
    assert.equal(resolveWebhookTransition(status, status), "noop");
  }

  // 늦게 온 Paid / VirtualAccountIssued 가 진행됐거나 끝난 주문을 되돌리지 않는다.
  const advanced = [
    "in_progress",
    "delivered",
    "review",
    "review_pending",
    "revision_requested",
    "completed",
    "cancelled",
    "refunded",
    "refund_requested",
    "failed",
  ];
  for (const current of advanced) {
    assert.equal(resolveWebhookTransition(current, "paid"), "skip", `${current} -> paid`);
    assert.equal(
      resolveWebhookTransition(current, "virtual_account_issued"),
      "skip",
      `${current} -> virtual_account_issued`,
    );
  }
  assert.equal(resolveWebhookTransition("paid", "virtual_account_issued"), "skip");
  assert.equal(resolveWebhookTransition("paid", "failed"), "skip");
  assert.equal(resolveWebhookTransition("in_progress", "failed"), "skip");
});

test("a full cancellation is applied to any order that still holds a payment", () => {
  const holding = [
    "pending",
    "virtual_account_issued",
    "paid",
    "in_progress",
    "delivered",
    "review",
    "review_pending",
    "revision_requested",
    "refund_requested",
    "failed",
  ];
  for (const current of holding) {
    assert.equal(resolveWebhookTransition(current, "refunded"), "apply", `${current} -> refunded`);
  }
  // 끝난 주문은 되살리거나 바꾸지 않는다.
  assert.equal(resolveWebhookTransition("completed", "refunded"), "skip");
  assert.equal(resolveWebhookTransition("cancelled", "refunded"), "skip");
});

test("unknown webhook targets and a missing current status are skipped", () => {
  assert.equal(resolveWebhookTransition("paid", "in_progress"), "skip");
  assert.equal(resolveWebhookTransition("paid", "completed"), "skip");
  assert.equal(resolveWebhookTransition(null, "paid"), "skip");
  assert.equal(resolveWebhookTransition(undefined, "paid"), "skip");
  assert.equal(resolveWebhookTransition("", "paid"), "skip");
});
