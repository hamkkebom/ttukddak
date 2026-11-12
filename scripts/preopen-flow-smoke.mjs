import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

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

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.PREOPEN_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;

if (!supabaseUrl || !anonKey || !serviceRoleKey || !baseUrl) {
  console.error("FAIL Supabase env and PREOPEN_BASE_URL/NEXT_PUBLIC_APP_URL are required");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stamp = Date.now();
const password = `CodexTest!${stamp}`;
const buyerEmail = `codex-buyer-${stamp}@example.test`;
const sellerEmail = `codex-seller-${stamp}@example.test`;
const ids = {
  buyer: undefined,
  seller: undefined,
  category: `codex-gate-${stamp}`,
  service: undefined,
  conversation: undefined,
  offer: undefined,
  order: undefined,
  quoteRequest: undefined,
  quoteResponse: undefined,
  quoteOrder: undefined,
};

function ok(message) {
  console.log(`OK ${message}`);
}

function assert(condition, message, details) {
  if (!condition) throw new Error(`${message}${details ? `: ${details}` : ""}`);
  ok(message);
}

async function supa(label, promise) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function signInCookie(email) {
  const jar = new Map();
  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return [...jar].map(([name, value]) => ({ name, value }));
      },
      setAll(items) {
        for (const { name, value } of items) jar.set(name, value);
      },
    },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`sign in ${email}: ${error?.message || "no user"}`);
  const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
  if (!cookie) throw new Error(`sign in ${email}: auth cookie was not created`);
  return cookie;
}

async function api(label, cookie, path, init = {}) {
  const headers = {
    cookie,
    ...(init.body ? { "content-type": "application/json" } : {}),
    ...(init.headers || {}),
  };
  const res = await fetch(new URL(path, baseUrl), { ...init, headers });
  const text = await res.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status} ${JSON.stringify(body)}`);
  ok(`${label} (${res.status})`);
  return body;
}

async function cleanup() {
  try {
    if (ids.order) await admin.from("deliveries").delete().eq("order_id", ids.order);
    if (ids.quoteOrder) await admin.from("deliveries").delete().eq("order_id", ids.quoteOrder);
    if (ids.conversation) await admin.from("messages").delete().eq("conversation_id", ids.conversation);
    if (ids.quoteRequest) await admin.from("quote_responses").delete().eq("quote_request_id", ids.quoteRequest);
    if (ids.conversation) await admin.from("deal_offers").delete().eq("conversation_id", ids.conversation);
    if (ids.quoteRequest) await admin.from("deal_offers").delete().eq("quote_request_id", ids.quoteRequest);
    if (ids.order) await admin.from("orders").delete().eq("id", ids.order);
    if (ids.quoteOrder) await admin.from("orders").delete().eq("id", ids.quoteOrder);
    if (ids.conversation) await admin.from("conversations").delete().eq("id", ids.conversation);
    if (ids.quoteRequest) await admin.from("quote_requests").delete().eq("id", ids.quoteRequest);
    if (ids.service) await admin.from("service_packages").delete().eq("service_id", ids.service);
    if (ids.service) await admin.from("services").delete().eq("id", ids.service);
    if (ids.seller) await admin.from("experts").delete().eq("id", ids.seller);
    if (ids.category) await admin.from("categories").delete().eq("id", ids.category);
    if (ids.buyer) await admin.from("profiles").delete().eq("id", ids.buyer);
    if (ids.seller) await admin.from("profiles").delete().eq("id", ids.seller);
    if (ids.buyer) await admin.auth.admin.deleteUser(ids.buyer);
    if (ids.seller) await admin.auth.admin.deleteUser(ids.seller);
  } catch (error) {
    console.warn(`WARN cleanup: ${error.message}`);
  }
}

try {
  const requiredTables = ["deal_offers", "quote_responses", "deliveries", "processed_webhooks", "expert_applications"];
  for (const table of requiredTables) {
    const { error } = await admin.from(table).select("id").limit(1);
    if (error) throw new Error(`remote table ${table}: ${error.message}`);
    ok(`remote table ${table}`);
  }

  const buyerUser = await supa("create buyer", admin.auth.admin.createUser({
    email: buyerEmail,
    password,
    email_confirm: true,
    user_metadata: { name: "Codex Buyer" },
  }));
  const sellerUser = await supa("create seller", admin.auth.admin.createUser({
    email: sellerEmail,
    password,
    email_confirm: true,
    user_metadata: { name: "Codex Seller" },
  }));
  ids.buyer = buyerUser.user.id;
  ids.seller = sellerUser.user.id;

  await supa("upsert buyer profile", admin.from("profiles").upsert({ id: ids.buyer, name: "Codex Buyer", email: buyerEmail, role: "user" }));
  await supa("upsert seller profile", admin.from("profiles").upsert({ id: ids.seller, name: "Codex Seller", email: sellerEmail, role: "expert", is_expert_verified: true }));
  await supa("insert category", admin.from("categories").insert({ id: ids.category, name: "Codex Gate", slug: ids.category, description: "preopen smoke" }));
  await supa("insert expert", admin.from("experts").insert({ id: ids.seller, title: "Codex Seller - Gate", category_id: ids.category, introduction: "preopen smoke" }));
  const service = await supa("insert service", admin.from("services").insert({
    expert_id: ids.seller,
    category_id: ids.category,
    title: `Codex Gate Service ${stamp}`,
    description: "preopen smoke",
    price: 12000,
    status: "active",
    tags: ["codex-gate"],
  }).select("id").single());
  ids.service = service.id;
  await supa("insert package", admin.from("service_packages").insert({
    service_id: ids.service,
    name: "베이직",
    price: 12000,
    delivery_days: 3,
    revisions: 1,
    features: ["preopen"],
  }));

  const buyerCookie = await signInCookie(buyerEmail);
  const sellerCookie = await signInCookie(sellerEmail);
  ok("auth cookies");

  const conversation = await api("start service conversation", buyerCookie, "/api/conversations/start", {
    method: "POST",
    body: JSON.stringify({ expertId: ids.seller, serviceId: ids.service, initialMessage: "공개 테스트 문의입니다." }),
  });
  ids.conversation = conversation.conversationId || conversation.id;
  assert(Boolean(ids.conversation), "conversation id returned");

  const sellerMessages = await api("seller reads messages", sellerCookie, `/api/messages?conversationId=${ids.conversation}`);
  assert(Array.isArray(sellerMessages) && sellerMessages.some((m) => m.content.includes("공개 테스트 문의")), "initial message persisted");

  const offer = await api("seller creates deal offer", sellerCookie, "/api/deal-offers", {
    method: "POST",
    body: JSON.stringify({
      conversationId: ids.conversation,
      serviceId: ids.service,
      title: "게이트 합의견적",
      scope: "API smoke scope",
      amount: 12000,
      deliveryDays: 3,
      revisions: 1,
      memo: "preopen",
    }),
  });
  ids.offer = offer.id;

  const accepted = await api("buyer accepts deal offer", buyerCookie, `/api/deal-offers/${ids.offer}/accept`, { method: "PATCH" });
  ids.order = accepted.orderId;
  assert(Boolean(ids.order), "order created from deal offer");

  let blocked = false;
  try {
    await api("seller cannot accept deal offer", sellerCookie, `/api/deal-offers/${ids.offer}/accept`, { method: "PATCH" });
  } catch (error) {
    blocked = /HTTP 403|HTTP 409/.test(error.message);
  }
  assert(blocked, "seller accept blocked");

  await supa("mark order paid", admin.from("orders").update({ status: "paid" }).eq("id", ids.order));
  await api("seller posts delivery", sellerCookie, `/api/orders/${ids.order}/deliveries`, {
    method: "POST",
    body: JSON.stringify({ files: ["https://example.test/final.zip"], fileNames: ["final.zip"], message: "최종 납품입니다." }),
  });
  const delivered = await supa("read delivered order", admin.from("orders").select("status,delivered_at").eq("id", ids.order).single());
  assert(delivered.status === "delivered" && Boolean(delivered.delivered_at), "delivery updates order delivered", JSON.stringify(delivered));

  const quoteTitle = `Codex Gate Quote ${stamp}`;
  await api("buyer creates quote request", buyerCookie, "/api/quote-requests", {
    method: "POST",
    body: JSON.stringify({ title: quoteTitle, category: "AI영상", budgetMin: 10000, budgetMax: 20000, deadline: "2026-05-15", description: "공개 견적 smoke" }),
  });
  const quoteRequest = await supa("find quote request", admin.from("quote_requests").select("id").eq("requester_id", ids.buyer).eq("title", quoteTitle).single());
  ids.quoteRequest = quoteRequest.id;

  const quoteResponse = await api("seller responds quote request", sellerCookie, `/api/quote-requests/${ids.quoteRequest}/responses`, {
    method: "POST",
    body: JSON.stringify({ price: 15000, message: "공개 견적 응답입니다.", estimatedDays: 4, serviceId: ids.service }),
  });
  ids.quoteResponse = quoteResponse.data?.id;
  assert(Boolean(ids.quoteResponse), "quote response id returned");

  const acceptedQuote = await api("buyer accepts quote response", buyerCookie, `/api/quote-requests/${ids.quoteRequest}/responses/${ids.quoteResponse}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "accepted" }),
  });
  ids.quoteOrder = acceptedQuote.orderId;
  assert(Boolean(ids.quoteOrder), "quote acceptance created order");
} catch (error) {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  await cleanup();
}
