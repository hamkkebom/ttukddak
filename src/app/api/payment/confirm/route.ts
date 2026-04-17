import { NextResponse } from "next/server";
import * as PortOne from "@portone/server-sdk";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { computeOrderAmount } from "@/lib/payment/amount";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // Authentication check
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

    const { paymentId, orderId } = await request.json();

    if (!paymentId || !orderId) {
      return NextResponse.json(
        { success: false, error: "paymentId와 orderId가 필요합니다" },
        { status: 400 },
      );
    }

    // 주문 조회 및 권한 검증
    const adminSb = createAdminSupabaseClient();
    const { data: order, error: orderError } = await adminSb
      .from("orders")
      .select("id, buyer_id, amount, status, service_id, package_id, coupon_id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "주문을 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "접근 권한이 없습니다" },
        { status: 403 },
      );
    }

    // 웹훅이 먼저 도착해 이미 단말 상태로 처리된 경우 재처리하지 않고 조기 반환
    // (paid / virtual_account_issued 는 확인 성공으로 간주, cancelled / refunded 는 이미 종료된 주문)
    const TERMINAL = new Set([
      "paid",
      "virtual_account_issued",
      "cancelled",
      "refunded",
      "completed",
      "in_progress",
      "review_pending",
      "revision_requested",
    ]);
    if (TERMINAL.has(order.status)) {
      return NextResponse.json({
        success: true,
        data: {
          paymentId,
          orderId,
          orderStatus: order.status,
          alreadyProcessed: true,
        },
      });
    }

    // PortOne Server SDK로 결제 조회
    const portone = PortOne.PortOneClient({
      secret: process.env.PORTONE_API_SECRET ?? "",
    });

    let payment;
    try {
      payment = await portone.payment.getPayment({ paymentId });
    } catch (e) {
      if (e instanceof PortOne.PortOneError) {
        return NextResponse.json(
          { success: false, error: "결제 정보를 확인할 수 없습니다" },
          { status: 400 },
        );
      }
      throw e;
    }

    // 허용 상태: PAID(일반 결제 완료) 또는 VIRTUAL_ACCOUNT_ISSUED(가상계좌 발급)
    if (payment.status !== "PAID" && payment.status !== "VIRTUAL_ACCOUNT_ISSUED") {
      return NextResponse.json(
        { success: false, error: "결제가 완료되지 않았습니다" },
        { status: 400 },
      );
    }

    // 금액 재검증:
    // 1) PortOne 결제 금액이 DB orders.amount와 일치하는지
    // 2) 서버에서 service/package/coupon으로 다시 계산한 값과도 일치하는지
    const portoneAmount: number = payment.amount?.total;
    if (portoneAmount !== order.amount) {
      return NextResponse.json(
        { success: false, error: "결제 금액이 일치하지 않습니다" },
        { status: 400 },
      );
    }

    // package_id는 name이 저장되어 있음(db-server.ts의 createOrder 참조)
    // → service_packages 테이블에서 name 기준으로 조회
    let packageName: string | null = null;
    if (order.package_id) {
      const { data: pkg } = await adminSb
        .from("service_packages")
        .select("name")
        .eq("id", order.package_id)
        .maybeSingle();
      if (pkg) packageName = pkg.name;
      else packageName = order.package_id as string; // fallback: name으로 저장된 경우
    }

    // 쿠폰 코드 복원 (user_coupons → coupons.code)
    let couponCode: string | null = null;
    if (order.coupon_id) {
      const { data: uc } = await adminSb
        .from("user_coupons")
        .select("coupon_id, coupons(code)")
        .eq("id", order.coupon_id)
        .maybeSingle();
      // Supabase 조인 결과: coupons는 배열 또는 객체 형태로 올 수 있음. 방어적으로 처리.
      const couponRel = (uc as unknown as { coupons?: { code?: string } | { code?: string }[] } | null)
        ?.coupons;
      if (Array.isArray(couponRel)) {
        couponCode = couponRel[0]?.code ?? null;
      } else if (couponRel && typeof couponRel === "object") {
        couponCode = couponRel.code ?? null;
      }
    }

    const recomputed = await computeOrderAmount({
      serviceId: order.service_id as string,
      packageName,
      userId: user.id,
      couponCode,
    });

    if (!recomputed.ok) {
      return NextResponse.json(
        { success: false, error: "주문 정보가 유효하지 않습니다" },
        { status: 400 },
      );
    }

    if (recomputed.data.totalAmount !== portoneAmount) {
      return NextResponse.json(
        { success: false, error: "결제 금액이 서버 계산값과 일치하지 않습니다" },
        { status: 400 },
      );
    }

    // 상태 및 transaction_id 업데이트
    // VIRTUAL_ACCOUNT_ISSUED: 주문은 아직 paid로 처리하지 않고 대기 상태로 둠 (웹훅이 실입금 시점에 paid로 승격)
    const nextStatus =
      payment.status === "PAID" ? "paid" : "virtual_account_issued";

    const transactionId =
      "transactionId" in payment && typeof payment.transactionId === "string"
        ? payment.transactionId
        : null;
    const pgTxId =
      "pgTxId" in payment && typeof payment.pgTxId === "string"
        ? payment.pgTxId
        : null;

    const confirmUpdate: Record<string, unknown> = {
      status: nextStatus,
      payment_id: paymentId,
      transaction_id: transactionId,
      updated_at: new Date().toISOString(),
    };
    if (pgTxId) confirmUpdate.pg_tx_id = pgTxId;

    const { error: updateError } = await adminSb
      .from("orders")
      .update(confirmUpdate)
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "주문 상태 업데이트에 실패했습니다" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId,
        transactionId,
        amount: portoneAmount,
        status: payment.status,
        orderStatus: nextStatus,
        orderId,
      },
    });
  } catch (error) {
    console.error("[PaymentConfirm] error:", error);
    return NextResponse.json(
      { success: false, error: "결제 확인 중 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
