import { NextRequest, NextResponse } from "next/server";
import { getConversations } from "@/lib/db-server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { jsonError, requireUser } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const requestedUserId = new URL(req.url).searchParams.get("userId");
  if (requestedUserId && requestedUserId !== auth.user.id) {
    return jsonError("Forbidden", 403);
  }

  const data = await getConversations(auth.user.id);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { participant2, serviceId, quoteRequestId, orderId } = await req.json().catch(() => ({}));
  if (!participant2) return jsonError("participant2가 필요합니다");
  if (participant2 === auth.user.id) return jsonError("본인과의 대화는 만들 수 없습니다");

  const admin = createAdminSupabaseClient();
  const normalizedServiceId = typeof serviceId === "string" && serviceId.trim() ? serviceId.trim() : null;
  const normalizedQuoteRequestId = typeof quoteRequestId === "string" && quoteRequestId.trim() ? quoteRequestId.trim() : null;
  const normalizedOrderId = typeof orderId === "string" && orderId.trim() ? orderId.trim() : null;

  const { data: expert } = await admin
    .from("experts")
    .select("id")
    .eq("id", participant2)
    .maybeSingle();
  if (!expert) return jsonError("전문가를 찾을 수 없습니다", 404);

  if (normalizedServiceId) {
    const { data: service } = await admin
      .from("services")
      .select("id,expert_id,status")
      .eq("id", normalizedServiceId)
      .maybeSingle();
    if (!service) return jsonError("서비스를 찾을 수 없습니다", 404);
    if (service.expert_id !== participant2) return jsonError("서비스 담당 전문가가 일치하지 않습니다", 400);
    if (!normalizedOrderId && service.status !== "active") return jsonError("공개된 서비스에만 문의할 수 있습니다", 400);
  }

  if (normalizedQuoteRequestId) {
    const { data: quoteRequest } = await admin
      .from("quote_requests")
      .select("id,requester_id")
      .eq("id", normalizedQuoteRequestId)
      .maybeSingle();
    if (!quoteRequest) return jsonError("견적요청을 찾을 수 없습니다", 404);
    if (quoteRequest.requester_id !== auth.user.id) return jsonError("견적요청 소유자만 대화를 연결할 수 있습니다", 403);
  }

  if (normalizedOrderId) {
    const { data: order } = await admin
      .from("orders")
      .select("id,buyer_id,seller_id,service_id")
      .eq("id", normalizedOrderId)
      .maybeSingle();
    if (!order) return jsonError("주문을 찾을 수 없습니다", 404);
    if (order.buyer_id !== auth.user.id || order.seller_id !== participant2) {
      return jsonError("주문 참여자만 대화를 연결할 수 있습니다", 403);
    }
    if (normalizedServiceId && order.service_id !== normalizedServiceId) {
      return jsonError("주문 서비스가 대화 서비스와 일치하지 않습니다", 400);
    }
  }

  let existingQuery = admin
    .from("conversations")
    .select("id")
    .eq("buyer_id", auth.user.id)
    .eq("seller_id", participant2);
  existingQuery = normalizedServiceId ? existingQuery.eq("service_id", normalizedServiceId) : existingQuery.is("service_id", null);
  existingQuery = normalizedQuoteRequestId ? existingQuery.eq("quote_request_id", normalizedQuoteRequestId) : existingQuery.is("quote_request_id", null);
  existingQuery = normalizedOrderId ? existingQuery.eq("order_id", normalizedOrderId) : existingQuery.is("order_id", null);

  const { data: existing } = await existingQuery.limit(1).maybeSingle();
  if (existing?.id) return NextResponse.json({ id: existing.id }, { status: 200 });

  const { data, error } = await admin
    .from("conversations")
    .insert({
      buyer_id: auth.user.id,
      seller_id: participant2,
      service_id: normalizedServiceId,
      quote_request_id: normalizedQuoteRequestId,
      order_id: normalizedOrderId,
    })
    .select("id")
    .single();

  if (error || !data) return NextResponse.json({ error: "Failed" }, { status: 500 });
  const id = data.id as string;
  return NextResponse.json({ id }, { status: 201 });
}
