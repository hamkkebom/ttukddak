import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST - confirm purchase (buyer only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: order } = await sb
    .from("orders")
    .select("buyer_id, status, coupon_id")
    .eq("id", id)
    .single();

  if (!order || order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "delivered") {
    return NextResponse.json({ error: "Order must be in delivered status to confirm" }, { status: 400 });
  }

  // Update order to completed
  await sb
    .from("orders")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id);

  // Mark coupon as used
  if (order.coupon_id) {
    const { data: uc } = await sb
      .from("user_coupons")
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq("id", order.coupon_id)
      .select("coupon_id")
      .single();

    if (uc?.coupon_id) {
      const { data: coupon } = await sb
        .from("coupons")
        .select("total_used")
        .eq("id", uc.coupon_id)
        .single();
      if (coupon) {
        await sb
          .from("coupons")
          .update({ total_used: (coupon.total_used || 0) + 1 })
          .eq("id", uc.coupon_id);
      }
    }
  }

  return NextResponse.json({ success: true, message: "구매가 확정되었습니다" });
}
