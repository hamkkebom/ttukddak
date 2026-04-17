import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; latency_ms?: number; error?: string }> = {};

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
  const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_PORTONE_STORE_ID"];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  checks.env = { ok: missing.length === 0, error: missing.length ? `missing: ${missing.join(",")}` : undefined };

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
