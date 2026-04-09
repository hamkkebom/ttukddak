import { NextRequest, NextResponse } from "next/server";

// PortOne webhook - receives async payment status updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payment_id, status } = body;

    if (!payment_id) {
      return NextResponse.json({ error: "Missing payment_id" }, { status: 400 });
    }

    // Verify payment with PortOne
    const portoneRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(payment_id)}`,
      {
        headers: {
          Authorization: `PortOne ${process.env.PORTONE_API_SECRET}`,
        },
      }
    );

    if (!portoneRes.ok) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const payment = await portoneRes.json();

    // Import admin client for DB update
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    const sb = createAdminSupabaseClient();

    // Update order based on payment status
    if (payment.status === "PAID") {
      await sb
        .from("orders")
        .update({ status: "paid", payment_id: payment_id, updated_at: new Date().toISOString() })
        .eq("payment_id", payment_id);
    } else if (payment.status === "CANCELLED" || payment.status === "FAILED") {
      await sb
        .from("orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("payment_id", payment_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
