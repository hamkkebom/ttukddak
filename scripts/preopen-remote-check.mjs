import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file = ".env.local") {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key]) continue;
    process.env[key] = raw.replace(/^["']|["']$/g, "");
  }
}

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`OK ${message}`);
}

loadEnv();

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

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) fail(`missing env: ${missingEnv.join(", ")}`);
else ok("required env present");

const paymentMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || "test";
if (paymentMode === "live") fail("NEXT_PUBLIC_PAYMENT_MODE must not be live for public test");
else ok(`payment mode is ${paymentMode}`);

const observabilityMissing = [];
if (!process.env.NEXT_PUBLIC_GA_ID && !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) observabilityMissing.push("GA");
if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.SENTRY_DSN) observabilityMissing.push("Sentry");
if (!process.env.RESEND_API_KEY) observabilityMissing.push("Resend");
if (observabilityMissing.length > 0) fail(`missing observability/email env: ${observabilityMissing.join(", ")}`);
else ok("observability/email env present");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  fail("Supabase env is required for remote schema check");
} else {
  const admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const checks = {
    profiles: ["id", "email", "role"],
    experts: ["id", "category_id"],
    services: ["id", "status", "rejection_reason", "view_count"],
    conversations: ["id", "quote_request_id", "order_id"],
    messages: ["id", "message_type", "file_url"],
    quote_requests: ["id", "category", "budget_min", "budget_max", "status"],
    quote_responses: ["id", "service_id", "status"],
    deal_offers: ["id", "conversation_id", "amount", "status", "order_id"],
    orders: ["id", "order_number", "payment_id", "transaction_id", "pg_tx_id", "refunded_amount", "delivered_at", "deal_offer_id", "coupon_id"],
    deliveries: ["id", "order_id", "file_url", "version"],
    processed_webhooks: ["id", "payment_id", "webhook_type", "webhook_timestamp"],
    expert_applications: ["id", "user_id", "id_verification_url", "business_registration_url"],
    coupons: ["id", "max_discount_amount", "total_issued", "total_used"],
    support_tickets: ["id", "ticket_number", "user_name", "user_email", "message", "admin_response"],
  };

  for (const [table, columns] of Object.entries(checks)) {
    const { error } = await admin.from(table).select(columns.join(",")).limit(1);
    if (error) fail(`${table} schema check: ${error.message}`);
    else ok(`${table} schema check`);
  }
}

const healthBaseUrl = process.env.PREOPEN_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
if (healthBaseUrl) {
  try {
    const res = await fetch(new URL("/api/health", healthBaseUrl));
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.status !== "ok") {
      fail(`/api/health is not ok: HTTP ${res.status} ${JSON.stringify(body.checks ?? body)}`);
    } else {
      ok("/api/health ok");
    }
  } catch (error) {
    fail(`/api/health request failed: ${error.message}`);
  }
} else {
  fail("PREOPEN_BASE_URL or NEXT_PUBLIC_APP_URL is required for health check");
}
