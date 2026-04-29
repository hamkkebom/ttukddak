import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ApiAuthSuccess = {
  ok: true;
  user: User;
  sb: Awaited<ReturnType<typeof createServerSupabaseClient>>;
};

export type ApiAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type ApiAuthResult = ApiAuthSuccess | ApiAuthFailure;

export type ConversationParticipant = {
  id: string;
  buyer_id: string;
  seller_id: string;
  service_id: string | null;
  quote_request_id: string | null;
  order_id: string | null;
};

export type OrderParticipant = {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
};

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(): Promise<ApiAuthResult> {
  const sb = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await sb.auth.getUser();

  if (error || !user) {
    return { ok: false, response: jsonError("Unauthorized", 401) };
  }

  return { ok: true, user, sb };
}

export async function isAdminUser(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role === "admin";
}

export async function requireAdmin(): Promise<ApiAuthResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const isAdmin = await isAdminUser(auth.user.id);
  if (!isAdmin) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }

  return auth;
}

export async function assertConversationParticipant(
  conversationId: string,
  userId: string
): Promise<{ ok: true; conversation: ConversationParticipant } | ApiAuthFailure> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("conversations")
    .select("id,buyer_id,seller_id,service_id,quote_request_id,order_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, response: jsonError("Conversation not found", 404) };
  }

  const conversation = data as ConversationParticipant;
  if (conversation.buyer_id !== userId && conversation.seller_id !== userId && !(await isAdminUser(userId))) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }

  return { ok: true, conversation };
}

export async function assertOrderParticipant(
  orderId: string,
  userId: string
): Promise<{ ok: true; order: OrderParticipant } | ApiAuthFailure> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("orders")
    .select("id,buyer_id,seller_id,status")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, response: jsonError("Order not found", 404) };
  }

  const order = data as OrderParticipant;
  if (order.buyer_id !== userId && order.seller_id !== userId && !(await isAdminUser(userId))) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }

  return { ok: true, order };
}

export function canTransitionOrderStatus(current: string, next: string, actor: "buyer" | "seller" | "admin") {
  if (actor === "admin") return true;

  const transitions: Record<string, string[]> = {
    pending: ["cancelled", "paid"],
    virtual_account_issued: ["paid", "cancelled", "failed"],
    paid: actor === "seller" ? ["in_progress", "cancelled"] : ["cancelled"],
    in_progress: actor === "seller" ? ["delivered"] : ["cancelled"],
    delivered: actor === "buyer" ? ["completed", "review"] : [],
    review_pending: actor === "buyer" ? ["completed", "revision_requested"] : [],
    revision_requested: actor === "seller" ? ["delivered"] : [],
    review: actor === "buyer" ? ["completed"] : actor === "seller" ? ["delivered"] : [],
    completed: [],
    cancelled: [],
    failed: [],
    refund_requested: [],
    refunded: [],
  };

  return transitions[current]?.includes(next) ?? false;
}
