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
    .select("buyer_id, status")
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

  return NextResponse.json({ success: true, message: "구매가 확정되었습니다" });
}
