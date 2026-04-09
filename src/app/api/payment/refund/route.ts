import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const sb = await createServerSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Get order
    const { data: order } = await sb
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only buyer or admin can request refund
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only paid or in_progress orders can be refunded
    if (!["paid", "in_progress"].includes(order.status)) {
      return NextResponse.json({ error: "Order cannot be refunded in current status" }, { status: 400 });
    }

    if (!order.payment_id) {
      return NextResponse.json({ error: "No payment found for this order" }, { status: 400 });
    }

    // Request refund from PortOne
    const portoneRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(order.payment_id)}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        },
        body: JSON.stringify({
          reason: reason || "고객 요청에 의한 환불",
        }),
      }
    );

    if (!portoneRes.ok) {
      const err = await portoneRes.text();
      console.error("PortOne refund error:", err);
      return NextResponse.json({ error: "Refund request failed" }, { status: 500 });
    }

    // Update order status
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    const adminSb = createAdminSupabaseClient();

    await adminSb
      .from("orders")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", orderId);

    return NextResponse.json({ success: true, message: "환불이 처리되었습니다" });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
