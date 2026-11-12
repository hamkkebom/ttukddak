import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { confirmPaymentForOrder } from "@/lib/payment/confirm";

export const runtime = "nodejs";

// 결제가 성립해 주문이 진행 중이거나 끝난 상태
const PAID_LIKE = new Set([
  "paid",
  "virtual_account_issued",
  "in_progress",
  "delivered",
  "review",
  "review_pending",
  "revision_requested",
  "completed",
]);

export async function POST(request: Request) {
  try {
    const sb = await createServerSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const paymentId = typeof body?.paymentId === "string" ? body.paymentId : "";
    const orderId = typeof body?.orderId === "string" ? body.orderId : "";

    if (!paymentId || !orderId) {
      return NextResponse.json(
        { success: false, error: "paymentId와 orderId가 필요합니다" },
        { status: 400 },
      );
    }

    const outcome = await confirmPaymentForOrder({
      orderId,
      paymentId,
      actingUserId: user.id,
    });

    switch (outcome.kind) {
      case "confirmed":
        return NextResponse.json({
          success: true,
          data: {
            paymentId,
            transactionId: outcome.transactionId,
            amount: outcome.amount,
            status: outcome.paymentStatus,
            orderStatus: outcome.orderStatus,
            orderId,
          },
        });

      case "already_processed":
        if (!PAID_LIKE.has(outcome.orderStatus)) {
          return NextResponse.json(
            { success: false, error: "취소되었거나 실패한 결제입니다" },
            { status: 409 },
          );
        }
        return NextResponse.json({
          success: true,
          data: {
            paymentId,
            orderId,
            orderStatus: outcome.orderStatus,
            alreadyProcessed: true,
          },
        });

      case "not_found":
        return NextResponse.json(
          { success: false, error: "주문을 찾을 수 없습니다" },
          { status: 404 },
        );

      case "forbidden":
        return NextResponse.json(
          { success: false, error: "접근 권한이 없습니다" },
          { status: 403 },
        );

      case "provider_error":
        return NextResponse.json(
          { success: false, error: "결제 정보를 확인할 수 없습니다" },
          { status: 400 },
        );

      case "transient_error":
        // 판단할 수 없는 상태. 결제는 건드리지 않았고, 웹훅 또는 재시도가 마무리한다.
        return NextResponse.json(
          {
            success: false,
            error:
              "결제 확인이 지연되고 있습니다. 잠시 후 주문 내역에서 결제 상태를 확인해 주세요",
            retryable: true,
          },
          { status: 503 },
        );

      case "rejected":
        return NextResponse.json(
          { success: false, error: outcome.message, code: outcome.code },
          { status: 400 },
        );

      case "cancelled":
        return NextResponse.json(
          {
            success: false,
            error: outcome.message,
            code: outcome.code,
            paymentCancelled: outcome.paymentCancelled,
          },
          { status: 409 },
        );
    }
  } catch (error) {
    console.error("[PaymentConfirm] error:", error);
    return NextResponse.json(
      { success: false, error: "결제 확인 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
