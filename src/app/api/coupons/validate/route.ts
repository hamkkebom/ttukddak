import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// POST: Validate a coupon code for a specific order
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ valid: false, error: "로그인이 필요합니다" }, { status: 401 });
  }

  try {
    const { code, orderAmount } = await req.json();

    if (!code || orderAmount == null) {
      return NextResponse.json(
        { valid: false, error: "code와 orderAmount가 필요합니다" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();

    // Find coupon by code
    const { data: coupon, error: couponError } = await admin
      .from("coupons")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (couponError || !coupon) {
      return NextResponse.json({ valid: false, error: "유효하지 않은 쿠폰 코드입니다" });
    }

    // Check active
    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, error: "비활성화된 쿠폰입니다" });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "만료된 쿠폰입니다" });
    }

    // Check min order amount
    if (orderAmount < coupon.min_order_amount) {
      return NextResponse.json({
        valid: false,
        error: `최소 주문 금액 ${new Intl.NumberFormat("ko-KR").format(coupon.min_order_amount)}원 이상 주문 시 사용 가능합니다`,
      });
    }

    // Check if user has this coupon and it's not used
    const { data: userCoupon } = await admin
      .from("user_coupons")
      .select("*")
      .eq("user_id", user.id)
      .eq("coupon_id", coupon.id)
      .single();

    if (!userCoupon) {
      return NextResponse.json({ valid: false, error: "보유하지 않은 쿠폰입니다" });
    }

    if (userCoupon.is_used) {
      return NextResponse.json({ valid: false, error: "이미 사용한 쿠폰입니다" });
    }

    // Check user coupon expiry
    if (userCoupon.expires_at && new Date(userCoupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "만료된 쿠폰입니다" });
    }

    // Calculate discount
    let discountAmount: number;
    if (coupon.discount_type === "percent") {
      discountAmount = Math.round(orderAmount * (coupon.discount_value / 100));
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    // Cap discount at order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    const couponData = {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      minOrderAmount: coupon.min_order_amount,
      maxDiscountAmount: coupon.max_discount_amount,
      totalIssued: coupon.total_issued,
      totalUsed: coupon.total_used,
      isActive: coupon.is_active,
      expiresAt: coupon.expires_at,
      createdAt: coupon.created_at,
    };

    return NextResponse.json({ valid: true, coupon: couponData, discountAmount });
  } catch {
    return NextResponse.json({ valid: false, error: "요청 처리 중 오류가 발생했습니다" }, { status: 400 });
  }
}
