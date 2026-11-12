import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; latency_ms?: number; error?: string; details?: Record<string, boolean | string> }> = {};

  // DB connectivity
  try {
    const t0 = Date.now();
    const sb = createAdminSupabaseClient();
    const { error } = await sb.from("categories").select("id").limit(1);
    if (error) throw error;
    checks.db = { ok: true, latency_ms: Date.now() - t0 };
  } catch (err) {
    checks.db = { ok: false, error: String(err) };
  }

  // Env vars
  const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_PORTONE_STORE_ID",
    "NEXT_PUBLIC_PORTONE_CHANNEL_KEY",
    "PORTONE_API_SECRET",
    "PORTONE_WEBHOOK_SECRET",
    "CRON_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  checks.env = { ok: missing.length === 0, error: missing.length ? `missing: ${missing.join(",")}` : undefined };

  const paymentMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || "test";
  checks.payment = {
    ok: paymentMode !== "live",
    error: paymentMode === "live" ? "public test must not run live payments" : undefined,
    details: {
      mode: paymentMode,
      storeConfigured: Boolean(process.env.NEXT_PUBLIC_PORTONE_STORE_ID),
      channelConfigured: Boolean(process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY),
      secretConfigured: Boolean(process.env.PORTONE_API_SECRET),
      webhookConfigured: Boolean(process.env.PORTONE_WEBHOOK_SECRET),
    },
  };

  const observabilityOk = Boolean(process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN);
  checks.observability = {
    ok: observabilityOk,
    error: observabilityOk ? undefined : "GA/Sentry 설정은 공개 테스트 운영 관측을 위해 권장됩니다",
    details: {
      ga: Boolean(process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
      sentry: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
      resend: Boolean(process.env.RESEND_API_KEY),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
    },
  };

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - startedAt,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
