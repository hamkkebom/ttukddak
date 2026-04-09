import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

// Verify PortOne V2 webhook signature
// PortOne sends: webhook-signature header with "t=<timestamp>,v1=<hmac>"
function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    // Parse "t=<timestamp>,v1=<sig1>[,v1=<sig2>]"
    const parts = signatureHeader.split(",");
    let timestamp = "";
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key === "t") timestamp = value;
      else if (key === "v1") signatures.push(value);
    }

    if (!timestamp || signatures.length === 0) return false;

    // Compute expected signature: HMAC-SHA256 of "<timestamp>.<rawBody>"
    const signedPayload = `${timestamp}.${rawBody}`;
    const expected = createHmac("sha256", secret)
      .update(signedPayload, "utf8")
      .digest("hex");

    return signatures.some((sig) => sig === expected);
  } catch {
    return false;
  }
}

// PortOne webhook - receives async payment status updates
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Webhook signature verification
    const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signatureHeader = request.headers.get("webhook-signature") ?? "";
      if (!signatureHeader) {
        return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
      }
      const isValid = verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    } else {
      console.warn(
        "[Webhook] PORTONE_WEBHOOK_SECRET is not set. Skipping signature verification (dev mode)."
      );
    }

    let body: { payment_id?: string; status?: string };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { payment_id } = body;

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
