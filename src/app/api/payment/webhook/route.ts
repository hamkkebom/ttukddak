import { NextRequest, NextResponse } from "next/server";
import * as PortOne from "@portone/server-sdk";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 주문 상태 전이: 되돌리기/상태 역행 방지
// refunded/cancelled/completed는 webhook 늦게 도착해도 paid 등으로 되돌리지 않는다.
const TERMINAL_STATES = new Set(["refunded", "cancelled", "completed"]);

// paid 상태에서 허용되는 다음 상태
const PAID_ALLOWED_NEXT = new Set([
  "paid",
  "in_progress",
  "review_pending",
  "revision_requested",
  "completed",
  "refund_requested",
  "refunded",
  "cancelled",
]);

function canTransition(current: string | null | undefined, next: string): boolean {
  if (!current) return true;
  if (current === next) return true;
  if (TERMINAL_STATES.has(current)) return false;
  if (current === "paid") return PAID_ALLOWED_NEXT.has(next);
  // pending / virtual_account_issued / failed → 어떤 상태로든 진입 가능
  return true;
}

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

  try {
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

    // PortOne에서 최신 결제 상태 재조회 (webhook 본문을 신뢰하지 않고 서버 측 재확인)
    const portone = PortOne.PortOneClient({ secret: process.env.PORTONE_API_SECRET ?? "" });
    let payment;
    try {
      payment = await portone.payment.getPayment({ paymentId });
    } catch (e) {
      if (e instanceof PortOne.PortOneError) {
        console.error("[Webhook] getPayment failed:", e.message);
        return NextResponse.json({ error: "결제 조회 실패" }, { status: 400 });
      }
      throw e;
    }

    // 주문 조회 (payment_id로 매핑)
    const { data: order } = await adminSb
      .from("orders")
      .select("id, status")
      .eq("payment_id", paymentId)
      .maybeSingle();

    // 취소 금액 정보 (부분/전액 취소 구분용)
    const paymentAmountTotal: number =
      "amount" in payment && payment.amount ? payment.amount.total ?? 0 : 0;
    const paymentAmountCancelled: number =
      "amount" in payment && payment.amount ? payment.amount.cancelled ?? 0 : 0;
    const isPartialCancel =
      paymentAmountCancelled > 0 && paymentAmountCancelled < paymentAmountTotal;

    if (!order) {
      // payment.confirm 이전의 webhook일 수 있음. 200 OK로 응답.
      console.warn(`[Webhook] order not found for paymentId=${paymentId}`);
      return NextResponse.json({ received: true });
    }

    // 상태 전이 매핑
    let nextStatus: string | null = null;
    const txType = webhookType;

    if (txType === "Transaction.Paid" && payment.status === "PAID") {
      nextStatus = "paid";
    } else if (txType === "Transaction.VirtualAccountIssued") {
      nextStatus = "virtual_account_issued";
    } else if (txType === "Transaction.Cancelled") {
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
    if (!nextStatus && txType === "Transaction.Cancelled" && isPartialCancel) {
      await adminSb
        .from("orders")
        .update({
          refunded_amount: paymentAmountCancelled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      return NextResponse.json({ received: true, partial: true });
    }

    if (!nextStatus) {
      return NextResponse.json({ received: true });
    }

    // 상태 머신 가드
    if (!canTransition(order.status, nextStatus)) {
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

    await adminSb.from("orders").update(webhookUpdate).eq("id", order.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
