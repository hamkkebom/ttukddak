import assert from "node:assert/strict";
import test from "node:test";
import {
  STALE_ORDER_CANCEL_CODES,
  extractCustomOrderId,
  isPaymentBoundToOrder,
  preValidatePayment,
  resolvePaymentMode,
  validateTerms,
} from "../src/lib/payment/confirm-core.ts";

const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORDER_ID = "22222222-2222-4222-8222-222222222222";
const SELLER_ID = "33333333-3333-4333-8333-333333333333";
const PAYMENT_ID = `payment-${ORDER_ID}-1700000000000`;

function order(overrides = {}) {
  return {
    id: ORDER_ID,
    status: "pending",
    amount: 157500,
    sellerId: SELLER_ID,
    paymentId: null,
    ...overrides,
  };
}

function payment(overrides = {}) {
  return {
    id: PAYMENT_ID,
    status: "PAID",
    totalAmount: 157500,
    currency: "KRW",
    channelType: "TEST",
    customData: JSON.stringify({ orderId: ORDER_ID, paymentMode: "test" }),
    ...overrides,
  };
}

test("payment mode is live only when explicitly set to live", () => {
  assert.equal(resolvePaymentMode("live"), "live");
  assert.equal(resolvePaymentMode("test"), "test");
  assert.equal(resolvePaymentMode(undefined), "test");
  assert.equal(resolvePaymentMode(""), "test");
  assert.equal(resolvePaymentMode("LIVE"), "test");
});

test("extractCustomOrderId reads orderId from a JSON object only", () => {
  assert.equal(extractCustomOrderId(JSON.stringify({ orderId: ORDER_ID })), ORDER_ID);
  assert.equal(extractCustomOrderId(JSON.stringify({ other: 1 })), null);
  assert.equal(extractCustomOrderId(JSON.stringify({ orderId: 42 })), null);
  assert.equal(extractCustomOrderId(JSON.stringify([ORDER_ID])), null);
  assert.equal(extractCustomOrderId(JSON.stringify(ORDER_ID)), null);
  assert.equal(extractCustomOrderId("not json"), null);
  assert.equal(extractCustomOrderId(""), null);
  assert.equal(extractCustomOrderId(null), null);
  assert.equal(extractCustomOrderId(undefined), null);
});

test("a payment is bound to an order through customData, falling back to the paymentId prefix", () => {
  assert.equal(isPaymentBoundToOrder(PAYMENT_ID, JSON.stringify({ orderId: ORDER_ID }), ORDER_ID), true);
  // customData 가 다른 주문을 가리키면 paymentId 접두사가 맞아도 거부한다.
  assert.equal(isPaymentBoundToOrder(PAYMENT_ID, JSON.stringify({ orderId: OTHER_ORDER_ID }), ORDER_ID), false);
  // customData 가 있는데 orderId 가 없으면 거부한다.
  assert.equal(isPaymentBoundToOrder(PAYMENT_ID, JSON.stringify({ paymentMode: "test" }), ORDER_ID), false);
  assert.equal(isPaymentBoundToOrder(PAYMENT_ID, "garbage", ORDER_ID), false);
  // customData 가 없을 때만 paymentId 접두사를 본다.
  assert.equal(isPaymentBoundToOrder(PAYMENT_ID, null, ORDER_ID), true);
  assert.equal(isPaymentBoundToOrder(PAYMENT_ID, null, OTHER_ORDER_ID), false);
  assert.equal(isPaymentBoundToOrder("payment-x", null, ORDER_ID), false);
  assert.equal(isPaymentBoundToOrder(PAYMENT_ID, null, ""), false);
  // 빈 문자열 customData 는 "없음" 으로 보고 paymentId 접두사를 본다.
  assert.equal(isPaymentBoundToOrder(PAYMENT_ID, "", ORDER_ID), true);
  assert.equal(isPaymentBoundToOrder(PAYMENT_ID, "", OTHER_ORDER_ID), false);
  // 주문 ID 가 앞부분만 겹치는 paymentId 는 받아들이지 않는다.
  assert.equal(isPaymentBoundToOrder(`payment-${ORDER_ID}0-1`, null, ORDER_ID), false);
});

test("a matching test payment for a pending order moves on to the terms check", () => {
  assert.deepEqual(
    preValidatePayment({ order: order(), payment: payment(), paymentMode: "test" }),
    { action: "check_terms", nextStatus: "paid" },
  );
  assert.deepEqual(
    preValidatePayment({
      order: order(),
      payment: payment({ status: "VIRTUAL_ACCOUNT_ISSUED" }),
      paymentMode: "test",
    }),
    { action: "check_terms", nextStatus: "virtual_account_issued" },
  );
});

test("repeating the same payment on an already processed order is idempotent", () => {
  for (const status of ["paid", "virtual_account_issued", "in_progress", "completed", "refunded"]) {
    assert.deepEqual(
      preValidatePayment({
        order: order({ status, paymentId: PAYMENT_ID }),
        payment: payment(),
        paymentMode: "test",
      }),
      { action: "already_processed" },
    );
  }
});

test("an unfinished payment is rejected without being cancelled", () => {
  for (const status of ["READY", "PENDING", "FAILED", "CANCELLED", "PARTIAL_CANCELLED", ""]) {
    assert.deepEqual(
      preValidatePayment({ order: order(), payment: payment({ status }), paymentMode: "test" }),
      { action: "reject", code: "payment_not_completed" },
    );
  }
});

test("a payment made for another order is rejected and never cancelled", () => {
  const foreign = payment({
    id: `payment-${OTHER_ORDER_ID}-1700000000000`,
    customData: JSON.stringify({ orderId: OTHER_ORDER_ID }),
  });
  assert.deepEqual(
    preValidatePayment({ order: order(), payment: foreign, paymentMode: "test" }),
    { action: "reject", code: "payment_not_for_order" },
  );
  // 이미 결제된 주문에 남의 결제를 들이밀어도 그 결제를 취소하지 않는다.
  assert.deepEqual(
    preValidatePayment({
      order: order({ status: "paid", paymentId: "payment-original" }),
      payment: foreign,
      paymentMode: "test",
    }),
    { action: "reject", code: "payment_not_for_order" },
  );
});

test("a second payment for an order that is no longer pending is cancelled", () => {
  for (const status of ["paid", "in_progress", "cancelled", "failed", "refunded", "completed"]) {
    assert.deepEqual(
      preValidatePayment({
        order: order({ status, paymentId: "payment-original" }),
        payment: payment(),
        paymentMode: "test",
      }),
      { action: "cancel", code: "order_not_payable" },
    );
  }
});

test("the payment channel must match the configured payment mode", () => {
  // 공개 테스트 모드에서 실결제 채널로 들어온 결제는 받지 않고 되돌린다.
  assert.deepEqual(
    preValidatePayment({ order: order(), payment: payment({ channelType: "LIVE" }), paymentMode: "test" }),
    { action: "cancel", code: "channel_mode_mismatch" },
  );
  // 실결제 모드에서 테스트 채널 결제는 돈이 오가지 않았으므로 받지 않는다.
  assert.deepEqual(
    preValidatePayment({ order: order(), payment: payment({ channelType: "TEST" }), paymentMode: "live" }),
    { action: "cancel", code: "channel_mode_mismatch" },
  );
  assert.deepEqual(
    preValidatePayment({ order: order(), payment: payment({ channelType: null }), paymentMode: "test" }),
    { action: "cancel", code: "channel_mode_mismatch" },
  );
  assert.deepEqual(
    preValidatePayment({ order: order(), payment: payment({ channelType: "LIVE" }), paymentMode: "live" }),
    { action: "check_terms", nextStatus: "paid" },
  );
});

test("only KRW payments are accepted", () => {
  for (const currency of ["USD", "JPY", "", null]) {
    assert.deepEqual(
      preValidatePayment({ order: order(), payment: payment({ currency }), paymentMode: "test" }),
      { action: "cancel", code: "currency_mismatch" },
    );
  }
});

test("the paid amount must equal the order amount", () => {
  for (const totalAmount of [1, 157499, 157501, 0, null]) {
    assert.deepEqual(
      preValidatePayment({ order: order(), payment: payment({ totalAmount }), paymentMode: "test" }),
      { action: "cancel", code: "amount_mismatch" },
    );
  }
});

test("checks run in a fixed order so the reported reason is stable", () => {
  // 결제가 미완료면 주문과의 연결 여부보다 먼저 거절한다.
  assert.deepEqual(
    preValidatePayment({
      order: order(),
      payment: payment({ status: "READY", customData: JSON.stringify({ orderId: OTHER_ORDER_ID }) }),
      paymentMode: "test",
    }),
    { action: "reject", code: "payment_not_completed" },
  );
  // 채널 → 통화 → 금액 순서
  assert.deepEqual(
    preValidatePayment({
      order: order(),
      payment: payment({ channelType: "LIVE", currency: "USD", totalAmount: 1 }),
      paymentMode: "test",
    }),
    { action: "cancel", code: "channel_mode_mismatch" },
  );
  assert.deepEqual(
    preValidatePayment({
      order: order(),
      payment: payment({ currency: "USD", totalAmount: 1 }),
      paymentMode: "test",
    }),
    { action: "cancel", code: "currency_mismatch" },
  );
  // 판매자와 금액이 모두 다르면 판매자 불일치로 보고한다.
  assert.deepEqual(
    validateTerms({
      order: order(),
      payment: payment(),
      expected: { ok: true, amount: 1, sellerId: "someone-else" },
    }),
    { action: "cancel", code: "seller_mismatch" },
  );
});

test("terms recomputed on the server must still match the payment", () => {
  const o = order();
  const p = payment();
  assert.deepEqual(
    validateTerms({ order: o, payment: p, expected: { ok: true, amount: 157500, sellerId: SELLER_ID } }),
    { action: "accept" },
  );
  assert.deepEqual(
    validateTerms({ order: o, payment: p, expected: { ok: false } }),
    { action: "cancel", code: "terms_invalid" },
  );
  assert.deepEqual(
    validateTerms({ order: o, payment: p, expected: { ok: true, amount: 157500, sellerId: "someone-else" } }),
    { action: "cancel", code: "seller_mismatch" },
  );
  assert.deepEqual(
    validateTerms({ order: o, payment: p, expected: { ok: true, amount: 200000, sellerId: SELLER_ID } }),
    { action: "cancel", code: "terms_changed" },
  );
});

test("only order-level problems close the order; payment-level problems never do", () => {
  assert.deepEqual(
    [...STALE_ORDER_CANCEL_CODES].sort(),
    ["seller_mismatch", "terms_changed", "terms_invalid"],
  );
  // 금액·통화·채널이 틀린 결제는 주문 ID 만 알면 제3자도 만들 수 있다.
  for (const code of ["amount_mismatch", "currency_mismatch", "channel_mode_mismatch", "order_not_payable"]) {
    assert.equal(STALE_ORDER_CANCEL_CODES.includes(code), false, code);
  }
});
