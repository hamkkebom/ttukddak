import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { BUYER_ACCEPTANCE_STATUSES } from "@/lib/order-status";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// POST - confirm purchase (buyer only)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  // orders 테이블에는 사용자 UPDATE 정책이 없으므로, 권한을 확인한 뒤 service_role 로 쓴다.
  const admin = createAdminSupabaseClient();
  const { data: order } = await admin
    .from("orders")
    .select("buyer_id, status, coupon_id")
    .eq("id", id)
    .maybeSingle();

  if (!order || order.buyer_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 납품물을 받은 상태(납품 완료·검수 중)에서만 구매 확정할 수 있다.
  if (!BUYER_ACCEPTANCE_STATUSES.includes(order.status as string)) {
    return NextResponse.json({ error: "Order must be in delivered status to confirm" }, { status: 400 });
  }

  // 방금 확인한 상태에서만 completed 로 바꾼다 (중복 요청·동시 변경 방지).
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", id)
    .eq("status", order.status)
    .select("id");

  if (updateError) {
    console.error("[OrderConfirm] update failed:", updateError);
    return NextResponse.json({ error: "구매 확정 처리에 실패했습니다" }, { status: 500 });
  }
  if ((updated?.length ?? 0) === 0) {
    return NextResponse.json({ error: "주문 상태가 변경되어 구매 확정할 수 없습니다" }, { status: 409 });
  }

  // 쿠폰 사용 집계. 쿠폰은 결제 시점에 이미 사용 처리되므로 여기서는 누락분만 보정한다.
  if (order.coupon_id) {
    await admin
      .from("user_coupons")
      .update({ is_used: true, used_at: now })
      .eq("id", order.coupon_id)
      .eq("is_used", false);

    const { data: uc } = await admin
      .from("user_coupons")
      .select("coupon_id")
      .eq("id", order.coupon_id)
      .maybeSingle();

    if (uc?.coupon_id) {
      const { data: coupon } = await admin
        .from("coupons")
        .select("total_used")
        .eq("id", uc.coupon_id)
        .maybeSingle();
      if (coupon) {
        await admin
          .from("coupons")
          .update({ total_used: (coupon.total_used || 0) + 1 })
          .eq("id", uc.coupon_id);
      }
    }
  }

  return NextResponse.json({ success: true, message: "구매가 확정되었습니다" });
}
