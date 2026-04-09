import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// GET: List all coupons (admin only)
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Convert snake_case to camelCase
  const coupons = (data || []).map((c: Record<string, unknown>) => ({
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
  }));

  return NextResponse.json({ success: true, data: coupons });
}

// POST: Create new coupon (admin only)
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      totalIssued,
      expiresAt,
    } = body;

    if (!code || !discountType || discountValue == null) {
      return NextResponse.json(
        { error: "code, discountType, discountValue are required" },
        { status: 400 }
      );
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("coupons")
      .insert({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        min_order_amount: minOrderAmount ?? 0,
        max_discount_amount: maxDiscountAmount ?? null,
        total_issued: totalIssued ?? 0,
        expires_at: expiresAt ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "이미 존재하는 쿠폰 코드입니다" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}

// PATCH: Toggle active status (admin only)
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, isActive } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("coupons")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
