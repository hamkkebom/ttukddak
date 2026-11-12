import { NextRequest, NextResponse } from "next/server";
import * as PortOne from "@portone/server-sdk";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { releaseUserCouponForOrder } from "@/lib/payment/coupons";

export const runtime = "nodejs";

type RefundAccountInput = {
  bank?: string;
  accountNumber?: string;
  holderName?: string;
  holderPhoneNumber?: string;
};

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const sb = await createServerSupabaseClient();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      orderId?: string;
      reason?: string;
      refundAccount?: RefundAccountInput;
    };
    const { orderId, reason, refundAccount } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId가 필요합니다" }, { status: 400 });
    }

    // 주문 조회
    const { data: order } = await sb
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
    }

    // 권한: 구매자 본인 또는 관리자만 환불 가능
    // (admin 여부는 profiles.role 등으로 확인해야 하지만, 현 스키마 보존 차원에서 buyer_id 체크만 유지)
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "접근 권한이 없습니다" }, { status: 403 });
    }

    // 환불 가능 상태: paid / in_progress / virtual_account_issued
    if (!["paid", "in_progress", "virtual_account_issued"].includes(order.status)) {
      return NextResponse.json(
        { error: "현재 주문 상태에서는 환불할 수 없습니다" },
        { status: 400 },
      );
    }

    if (!order.payment_id) {
      return NextResponse.json(
        { error: "결제 정보를 찾을 수 없습니다" },
        { status: 400 },
      );
    }

    const portone = PortOne.PortOneClient({
      secret: process.env.PORTONE_API_SECRET ?? "",
    });

    // 1) 현재 결제 상태와 취소 가능 잔액 조회
    let payment;
    try {
      payment = await portone.payment.getPayment({ paymentId: order.payment_id });
    } catch (e) {
      if (e instanceof PortOne.PortOneError) {
        console.error("[Refund] getPayment failed:", e.message);
        return NextResponse.json(
          { error: "결제 정보를 확인할 수 없습니다" },
          { status: 400 },
        );
      }
      throw e;
    }

    // 결제가 취소/실패 상태라면 이미 환불됨
    if (payment.status === "CANCELLED" || payment.status === "FAILED") {
      return NextResponse.json(
        { error: "이미 취소된 결제입니다" },
        { status: 400 },
      );
    }

    const paymentWithAmount = payment as unknown as {
      amount?: { total?: number; cancelled?: number };
      method?: { type?: string };
    };
    const totalAmount: number = paymentWithAmount.amount?.total ?? 0;
    const cancelledAmount: number = paymentWithAmount.amount?.cancelled ?? 0;
    const currentCancellableAmount = totalAmount - cancelledAmount;

    if (currentCancellableAmount <= 0) {
      return NextResponse.json(
        { error: "취소 가능한 금액이 없습니다" },
        { status: 400 },
      );
    }

    // 2) 가상계좌 환불인 경우 refundAccount 필수
    const methodType = paymentWithAmount.method?.type;
    const isVirtualAccount =
      order.status === "virtual_account_issued" ||
      methodType === "PaymentMethodVirtualAccount" ||
      payment.status === "VIRTUAL_ACCOUNT_ISSUED";

    if (isVirtualAccount) {
      const ra = refundAccount;
      if (!ra || !ra.bank || !ra.accountNumber || !ra.holderName) {
        return NextResponse.json(
          {
            error:
              "가상계좌 환불을 위해서는 환불 계좌 정보(은행, 계좌번호, 예금주)가 필요합니다",
          },
          { status: 400 },
        );
      }
    }

    // 3) 취소 요청 (Server SDK 사용, currentCancellableAmount로 race 방지)
    let cancelResponse;
    try {
      cancelResponse = await portone.payment.cancelPayment({
        paymentId: order.payment_id,
        reason: reason || "고객 요청에 의한 환불",
        currentCancellableAmount,
        ...(isVirtualAccount && refundAccount
          ? {
              refundAccount: {
                bank: refundAccount.bank as never,
                number: refundAccount.accountNumber as string,
                holderName: refundAccount.holderName as string,
                ...(refundAccount.holderPhoneNumber
                  ? { holderPhoneNumber: refundAccount.holderPhoneNumber }
                  : {}),
              },
            }
          : {}),
      });
    } catch (e) {
      if (e instanceof PortOne.PortOneError) {
        console.error("[Refund] cancelPayment failed:", e.message);
        return NextResponse.json(
          { error: `환불 요청에 실패했습니다: ${e.message}` },
          { status: 400 },
        );
      }
      throw e;
    }

    const cancellation = cancelResponse.cancellation;
    const isSucceeded =
      "status" in cancellation && cancellation.status === "SUCCEEDED";
    const cancellationId =
      "id" in cancellation ? (cancellation as { id?: string }).id : undefined;
    const cancelledTotal =
      "totalAmount" in cancellation
        ? (cancellation as { totalAmount?: number }).totalAmount ?? 0
        : 0;

    // 4) 주문 상태 업데이트
    const adminSb = createAdminSupabaseClient();

    // 이번 취소 + 이전 누적 취소가 총액과 같으면 전액 환불로 간주
    const newRefundedTotal = cancelledAmount + (cancelledTotal || 0);
    const isFullyRefunded = newRefundedTotal >= totalAmount;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      refunded_amount: newRefundedTotal,
    };
    if (cancellationId) {
      updatePayload.cancellation_id = cancellationId;
    }
    if (isFullyRefunded && isSucceeded) {
      updatePayload.status = "refunded";
    } else if (isSucceeded) {
      // 부분 취소: 상태는 유지, 누적 환불액만 갱신
      // (별도 refund_requested 등으로 이동하지 않음)
    } else {
      // 환불 요청됨/실패 등 비동기 상태: 웹훅을 통해 최종 동기화
      updatePayload.status = "refund_requested";
    }

    const { error: updateError } = await adminSb
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateError) {
      console.error("[Refund] order update failed:", updateError);
      // PortOne 취소는 성공했으므로 500으로 실패 알리되, 운영자 개입 필요
      return NextResponse.json(
        {
          error:
            "환불은 처리되었으나 주문 상태 갱신에 실패했습니다. 관리자에게 문의해주세요",
          cancellationId,
        },
        { status: 500 },
      );
    }

    // 입금 전에 취소된 가상계좌 주문은 돈이 오간 적이 없으므로 쿠폰을 되돌려 준다.
    if (
      order.coupon_id &&
      order.status === "virtual_account_issued" &&
      updatePayload.status === "refunded"
    ) {
      await releaseUserCouponForOrder(adminSb, order.coupon_id as string, order.id as string);
    }

    return NextResponse.json({
      success: true,
      message: isFullyRefunded
        ? "환불이 처리되었습니다"
        : "부분 환불이 처리되었습니다",
      data: {
        cancellationId,
        cancelledAmount: cancelledTotal,
        totalRefundedAmount: newRefundedTotal,
        fullyRefunded: isFullyRefunded,
      },
    });
  } catch (error) {
    console.error("[Refund] error:", error);
    return NextResponse.json(
      { error: "환불 처리 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
