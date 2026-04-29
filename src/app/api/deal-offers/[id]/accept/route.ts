import { NextRequest, NextResponse } from "next/server";
import { assertConversationParticipant, isAdminUser, jsonError, requireUser } from "@/lib/api/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type DealOfferRow = {
  id: string;
  conversation_id: string;
  service_id: string;
  quote_request_id: string | null;
  buyer_id: string;
  expert_id: string;
  title: string;
  scope: string;
  amount: number;
  delivery_days: number;
  revisions: number;
  memo: string | null;
  status: string;
  expires_at: string | null;
};

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const admin = createAdminSupabaseClient();
  const { data: offerData } = await admin
    .from("deal_offers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!offerData) return jsonError("합의견적을 찾을 수 없습니다", 404);
  const offer = offerData as DealOfferRow;

  const participant = await assertConversationParticipant(offer.conversation_id, auth.user.id);
  if (!participant.ok) return participant.response;

  const isAdmin = await isAdminUser(auth.user.id);
  if (offer.buyer_id !== auth.user.id && !isAdmin) {
    return jsonError("고객만 합의견적을 수락할 수 있습니다", 403);
  }

  if (offer.status !== "pending") {
    return jsonError("대기 중인 합의견적만 수락할 수 있습니다", 409);
  }

  if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
    await admin.from("deal_offers").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", offer.id);
    return jsonError("만료된 합의견적입니다", 409);
  }

  const acceptedAt = new Date().toISOString();
  const { data: acceptedOffer, error: acceptError } = await admin
    .from("deal_offers")
    .update({
      status: "accepted",
      accepted_at: acceptedAt,
      updated_at: acceptedAt,
    })
    .eq("id", offer.id)
    .eq("status", "pending")
    .select("id")
    .single();

  if (acceptError || !acceptedOffer) {
    return NextResponse.json({ error: "이미 수락된 합의견적이 있습니다" }, { status: 409 });
  }

  const requirements = [
    `[합의견적] ${offer.title}`,
    `작업 범위: ${offer.scope}`,
    `납기: ${offer.delivery_days}일`,
    `수정: ${offer.revisions}회`,
    offer.memo ? `메모: ${offer.memo}` : null,
  ].filter(Boolean).join("\n");

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      buyer_id: offer.buyer_id,
      seller_id: offer.expert_id,
      service_id: offer.service_id,
      package_id: null,
      amount: offer.amount,
      requirements,
      deal_offer_id: offer.id,
      status: "pending",
    })
    .select("id,status,amount")
    .single();

  if (orderError || !order) {
    await admin
      .from("deal_offers")
      .update({ status: "pending", accepted_at: null, updated_at: new Date().toISOString() })
      .eq("id", offer.id);
    return NextResponse.json({ error: "주문을 만들지 못했습니다" }, { status: 500 });
  }

  await admin
    .from("deal_offers")
    .update({ order_id: order.id, updated_at: new Date().toISOString() })
    .eq("id", offer.id);
  await admin
    .from("deal_offers")
    .update({ status: "rejected", rejected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("conversation_id", offer.conversation_id)
    .eq("status", "pending")
    .neq("id", offer.id);

  const message = `합의견적을 수락했습니다. 주문 ${order.id}가 생성되었습니다.`;
  await admin.from("messages").insert({
    conversation_id: offer.conversation_id,
    sender_id: auth.user.id,
    content: message,
    message_type: "system",
  });
  await admin
    .from("conversations")
    .update({
      order_id: order.id,
      last_message: message,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", offer.conversation_id);

  return NextResponse.json({
    orderId: order.id,
    conversationId: offer.conversation_id,
    dealOfferId: offer.id,
    amount: order.amount,
    status: order.status,
  });
}
