import { NextRequest, NextResponse } from "next/server";
import * as PortOne from "@portone/server-sdk";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { confirmPaymentForOrder } from "@/lib/payment/confirm";
import { extractCustomOrderId } from "@/lib/payment/confirm-core";
import { releaseUserCouponForOrder } from "@/lib/payment/coupons";
import { resolveWebhookTransition } from "@/lib/order-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PortOne V2 webhook - Standard Webhooks spec (webhook-id, webhook-timestamp, webhook-signature)
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Headers for Standard Webhooks
  const headers: Record<string, string> = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
  };

  const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;

  // 프로덕션에서는 PORTONE_WEBHOOK_SECRET 미설정 시 즉시 실패 처리
  if (!webhookSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[Webhook] PORTONE_WEBHOOK_SECRET 환경변수가 설정되지 않았습니다. 프로덕션 환경에서는 필수입니다.",
      );
    }
    console.warn(
      "[Webhook] PORTONE_WEBHOOK_SECRET is not set. Skipping signature verification (dev mode).",
    );
  }

  // 서명 검증
  let webhook: Awaited<ReturnType<typeof PortOne.Webhook.verify>>;
  try {
    if (webhookSecret) {
      webhook = await PortOne.Webhook.verify(webhookSecret, rawBody, headers);
    } else {
      // dev-only 우회: 파싱만 수행
      webhook = JSON.parse(rawBody) as Awaited<ReturnType<typeof PortOne.Webhook.verify>>;
    }
  } catch (e) {
    if (e instanceof PortOne.Webhook.WebhookVerificationError) {
      return NextResponse.json(
        { error: "웹훅 서명 검증에 실패했습니다" },
        { status: 400 },
      );
    }
    throw e;
  }

  // 결제 관련 웹훅만 처리 (Transaction.*)
  if (!("data" in webhook) || !("paymentId" in webhook.data)) {
    return NextResponse.json({ received: true });
  }

  const paymentId = webhook.data.paymentId;
  const webhookType = webhook.type;
  const webhookTimestamp = webhook.timestamp;

  const adminSb = createAdminSupabaseClient();

  // 멱등성 가드: (payment_id, webhook_type, webhook_timestamp) 조합으로 중복 처리 방지
  const { error: dedupError } = await adminSb
    .from("processed_webhooks")
    .insert({
      payment_id: paymentId,
      webhook_type: webhookType,
      webhook_timestamp: webhookTimestamp,
    });

  if (dedupError) {
    // unique violation → 이미 처리된 웹훅. 200 OK로 응답해 재시도 방지.
    if (dedupError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // 그 외의 DB 오류는 재시도가 필요하므로 500
    console.error("[Webhook] dedup insert error:", dedupError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // 처리에 실패하면 멱등성 기록을 지워서 PortOne 의 재시도가 다시 처리되게 한다.
  // (기록만 남고 처리가 안 되면 재시도가 중복으로 판정되어 이벤트가 유실된다.)
  const failAndAllowRetry = async (message: string, cause?: unknown) => {
    console.error(`[Webhook] ${message}`, cause ?? "");
    const { error: releaseError } = await adminSb
      .from("processed_webhooks")
      .delete()
      .eq("payment_id", paymentId)
      .eq("webhook_type", webhookType)
      .eq("webhook_timestamp", webhookTimestamp);
    if (releaseError) console.error("[Webhook] dedup release error:", releaseError);
    return NextResponse.json({ error: message }, { status: 500 });
  };

  try {
    // PortOne에서 최신 결제 상태 재조회 (webhook 본문을 신뢰하지 않고 서버 측 재확인)
    const portone = PortOne.PortOneClient({ secret: process.env.PORTONE_API_SECRET ?? "" });
    let payment;
    try {
      payment = await portone.payment.getPayment({ paymentId });
    } catch (e) {
      if (e instanceof PortOne.PortOneError) {
        return await failAndAllowRetry("결제 조회 실패", e.message);
      }
      throw e;
    }

    // 주문 조회 (payment_id로 매핑)
    const { data: order, error: orderError } = await adminSb
      .from("orders")
      .select("id, status, coupon_id")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (orderError) {
      return await failAndAllowRetry("주문 조회 실패", orderError);
    }

    // 취소 금액 정보 (부분/전액 취소 구분용)
    const paymentAmountTotal: number =
      "amount" in payment && payment.amount ? payment.amount.total ?? 0 : 0;
    const paymentAmountCancelled: number =
      "amount" in payment && payment.amount ? payment.amount.cancelled ?? 0 : 0;
    const isPartialCancel =
      paymentAmountCancelled > 0 && paymentAmountCancelled < paymentAmountTotal;

    if (!order) {
      // 결제 확인 API 가 아직 호출되지 않은 결제 (예: 결제 직후 창을 닫은 경우).
      // 결제에 담긴 주문 ID 로 서버가 직접 결제 확인을 수행한다.
      const isSettledEvent =
        (webhookType === "Transaction.Paid" && payment.status === "PAID") ||
        (webhookType === "Transaction.VirtualAccountIssued" &&
          payment.status === "VIRTUAL_ACCOUNT_ISSUED");
      const customData =
        "customData" in payment && typeof payment.customData === "string"
          ? payment.customData
          : null;
      const boundOrderId = isSettledEvent ? extractCustomOrderId(customData) : null;

      if (!boundOrderId) {
        console.warn(`[Webhook] order not found for paymentId=${paymentId}`);
        return NextResponse.json({ received: true });
      }

      const outcome = await confirmPaymentForOrder({ orderId: boundOrderId, paymentId });
      if (outcome.kind === "provider_error" || outcome.kind === "transient_error") {
        // 판단할 수 없는 상태. PortOne 의 재시도에서 다시 처리한다.
        return await failAndAllowRetry("결제 확인 실패", outcome.kind);
      }
      if (outcome.kind === "cancelled" && !outcome.paymentCancelled && !outcome.recorded) {
        // 받아들일 수 없는 결제인데 되돌리지도 못했고 기록된 곳도 없다.
        // PortOne 의 재시도에서 다시 취소를 시도한다.
        return await failAndAllowRetry("결제 자동 취소 실패", outcome.code);
      }
      return NextResponse.json({ received: true, confirmed: outcome.kind });
    }

    // 상태 전이 매핑
    let nextStatus: string | null = null;
    const txType = webhookType;

    if (txType === "Transaction.Paid" && payment.status === "PAID") {
      nextStatus = "paid";
    } else if (txType === "Transaction.VirtualAccountIssued") {
      nextStatus = "virtual_account_issued";
    } else if (txType === "Transaction.Cancelled" || txType === "Transaction.PartialCancelled") {
      // 부분 취소면 주문 상태는 유지, refunded_amount만 갱신한다.
      // 전액 취소일 때만 refunded로 전이.
      nextStatus = isPartialCancel ? null : "refunded";
    } else if (txType === "Transaction.Failed") {
      nextStatus = "failed";
    } else if (txType === "Transaction.PayPending") {
      // 결제 중간 상태. 주문 상태 변경 없음.
      return NextResponse.json({ received: true });
    }

    // 부분 취소: 주문 상태 전이 없이 refunded_amount만 갱신
    if (
      !nextStatus &&
      (txType === "Transaction.Cancelled" || txType === "Transaction.PartialCancelled") &&
      isPartialCancel
    ) {
      const { error: partialError } = await adminSb
        .from("orders")
        .update({
          refunded_amount: paymentAmountCancelled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      if (partialError) {
        return await failAndAllowRetry("부분 취소 반영 실패", partialError);
      }
      return NextResponse.json({ received: true, partial: true });
    }

    if (!nextStatus) {
      return NextResponse.json({ received: true });
    }

    // 상태 머신 가드: 늦게 도착했거나 순서가 뒤바뀐 이벤트로 주문을 되돌리지 않는다.
    const transition = resolveWebhookTransition(order.status, nextStatus);
    if (transition === "noop") {
      return NextResponse.json({ received: true });
    }
    if (transition === "skip") {
      console.warn(
        `[Webhook] skipping transition ${order.status} → ${nextStatus} for order=${order.id}`,
      );
      return NextResponse.json({ received: true, skipped: true });
    }

    const transactionId =
      "transactionId" in payment && typeof payment.transactionId === "string"
        ? payment.transactionId
        : null;
    const pgTxId =
      "pgTxId" in payment && typeof payment.pgTxId === "string"
        ? payment.pgTxId
        : null;

    const webhookUpdate: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };
    if (transactionId) webhookUpdate.transaction_id = transactionId;
    if (pgTxId) webhookUpdate.pg_tx_id = pgTxId;
    if (nextStatus === "refunded") {
      webhookUpdate.refunded_amount = paymentAmountCancelled;
    }

    // 조회한 시점의 상태에서만 전이한다 (동시에 다른 처리가 상태를 바꿨다면 건너뛴다).
    const { data: updated, error: updateError } = await adminSb
      .from("orders")
      .update(webhookUpdate)
      .eq("id", order.id)
      .eq("status", order.status)
      .select("id");

    if (updateError) {
      return await failAndAllowRetry("주문 상태 반영 실패", updateError);
    }
    if ((updated?.length ?? 0) === 0) {
      // 상태가 그 사이 바뀌었다. 재시도에서 최신 상태 기준으로 다시 판단한다.
      return await failAndAllowRetry("주문 상태가 변경되어 재시도 필요");
    }

    // 돈이 들어오지 않은 채 끝난 주문(결제 실패, 입금 전 가상계좌 취소·만료)은 쿠폰을 되돌려 준다.
    const endedUnpaid =
      nextStatus === "failed" ||
      (order.status === "virtual_account_issued" && nextStatus === "refunded");
    if (endedUnpaid && order.coupon_id) {
      await releaseUserCouponForOrder(adminSb, order.coupon_id as string, order.id as string);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return await failAndAllowRetry("Internal server error", error);
  }
}
