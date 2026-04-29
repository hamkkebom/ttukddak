import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notifySettlement } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron handler — auto-confirm delivered orders after 7 days.
 * Configured in vercel.json (daily at 02:00 KST).
 *
 * Security: Vercel automatically attaches `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is required in production" }, { status: 500 });
  }
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const sb = createAdminSupabaseClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find delivered orders past 7-day grace period
  const { data: orders, error } = await sb
    .from("orders")
    .select("id, buyer_id, seller_id, service_id, amount, coupon_id, delivered_at")
    .eq("status", "delivered")
    .lt("delivered_at", sevenDaysAgo);

  if (error) {
    console.error("[cron:auto-confirm] query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { orderId: string; ok: boolean; error?: string }[] = [];

  for (const order of orders || []) {
    try {
      // Update order to completed
      const { error: updateErr } = await sb
        .from("orders")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", order.id);
      if (updateErr) throw updateErr;

      // Mark coupon as used
      if (order.coupon_id) {
        await sb
          .from("user_coupons")
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq("id", order.coupon_id);
      }

      // Notify expert about settlement
      if (order.seller_id) {
        const { data: expertProfile } = await sb
          .from("profiles")
          .select("id")
          .eq("id", order.seller_id)
          .maybeSingle();
        if (expertProfile?.id) {
          const fee = Math.round((order.amount || 0) * 0.05);
          const settlementAmount = (order.amount || 0) - fee;
          await notifySettlement({
            expertUserId: expertProfile.id,
            amount: settlementAmount,
            period: "이번 거래 (자동 구매확정)",
          }).catch(() => {});
        }
      }

      results.push({ orderId: order.id, ok: true });
    } catch (err) {
      results.push({ orderId: order.id, ok: false, error: String(err) });
    }
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    timestamp: new Date().toISOString(),
    results: results.slice(0, 20), // limit response size
  });
}
