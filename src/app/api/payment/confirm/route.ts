import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db-server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Authentication check
    const sb = await createServerSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { paymentId, orderId } = await request.json();

    if (!paymentId || !orderId) {
      return NextResponse.json(
        { success: false, error: "paymentId와 orderId가 필요합니다" },
        { status: 400 }
      );
    }

    // Fetch order from DB to verify buyer and expected amount
    const adminSb = createAdminSupabaseClient();
    const { data: order, error: orderError } = await adminSb
      .from("orders")
      .select("id, buyer_id, amount, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "주문을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Verify the authenticated user is the buyer
    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "접근 권한이 없습니다" },
        { status: 403 }
      );
    }

    // PortOne V2 결제 확인 API
    const response = await fetch(
      `https://api.portone.io/payments/${paymentId}`,
      {
        headers: {
          Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "결제 정보를 확인할 수 없습니다" },
        { status: 400 }
      );
    }

    const payment = await response.json();

    // 결제 상태 확인
    if (payment.status !== "PAID") {
      return NextResponse.json(
        { success: false, error: "결제가 완료되지 않았습니다" },
        { status: 400 }
      );
    }

    // Amount verification: compare PortOne payment amount against expected order amount
    const portoneAmount: number = payment.amount?.total;
    if (portoneAmount !== order.amount) {
      return NextResponse.json(
        { success: false, error: "결제 금액이 일치하지 않습니다" },
        { status: 400 }
      );
    }

    // DB에 주문 상태 업데이트: pending → paid, payment_id 저장
    const updated = await updateOrderStatus(orderId, "paid");
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "주문 상태 업데이트에 실패했습니다" },
        { status: 500 }
      );
    }

    // payment_id를 주문에 저장
    await adminSb
      .from("orders")
      .update({ payment_id: paymentId, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        amount: payment.amount?.total,
        status: payment.status,
        orderId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "결제 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
