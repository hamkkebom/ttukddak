import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// GET: Return current user's coupons with coupon details
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("user_coupons")
    .select(`
      id,
      user_id,
      coupon_id,
      is_used,
      used_at,
      expires_at,
      created_at,
      coupons (
        id,
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount_amount,
        total_issued,
        total_used,
        is_active,
        expires_at,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userCoupons = (data || []).map((uc: Record<string, unknown>) => {
    const c = uc.coupons as Record<string, unknown> | null;
    return {
      id: uc.id,
      userId: uc.user_id,
      couponId: uc.coupon_id,
      isUsed: uc.is_used,
      usedAt: uc.used_at,
      expiresAt: uc.expires_at,
      createdAt: uc.created_at,
      coupon: c
        ? {
            id: c.id,
            code: c.code,
            discountType: c.discount_type,
            discountValue: c.discount_value,
            minOrderAmount: c.min_order_amount,
            maxDiscountAmount: c.max_discount_amount,
            totalIssued: c.total_issued,
            totalUsed: c.total_used,
            isActive: c.is_active,
            expiresAt: c.expires_at,
            createdAt: c.created_at,
          }
        : undefined,
    };
  });

  return NextResponse.json({ success: true, data: userCoupons });
}
