import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { jsonError, requireUser } from "@/lib/api/auth";

type QuoteResponseRow = {
  id: string;
  quote_request_id: string;
  expert_id: string;
  service_id: string | null;
  price: number;
  message: string;
  estimated_days: number;
  status: string;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  const { id, responseId } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const admin = createAdminSupabaseClient();

  // Verify user owns the quote request
  const { data: quoteRequest } = await admin
    .from("quote_requests")
    .select("id, requester_id, status, title")
    .eq("id", id)
    .maybeSingle();

  if (!quoteRequest) {
    return NextResponse.json({ error: "Quote request not found" }, { status: 404 });
  }

  if (quoteRequest.requester_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (quoteRequest.status === "closed") {
    return NextResponse.json({ error: "Quote request is already closed" }, { status: 400 });
  }

  const body = await req.json();
  const { status } = body as { status: "accepted" | "rejected" };

  if (status !== "accepted" && status !== "rejected") {
    return NextResponse.json({ error: "status must be 'accepted' or 'rejected'" }, { status: 400 });
  }

  const { data: responseData } = await admin
    .from("quote_responses")
    .select("id,quote_request_id,expert_id,service_id,price,message,estimated_days,status")
    .eq("id", responseId)
    .eq("quote_request_id", id)
    .maybeSingle();

  if (!responseData) return jsonError("Quote response not found", 404);
  const quoteResponse = responseData as QuoteResponseRow;
  if (quoteResponse.status !== "pending") {
    return jsonError("대기 중인 견적만 처리할 수 있습니다", 409);
  }
  if (status === "accepted" && !quoteResponse.service_id) {
    return jsonError("서비스가 연결되지 않은 견적은 주문으로 전환할 수 없습니다", 409);
  }

  if (status === "rejected") {
    const { error: updateError } = await admin
      .from("quote_responses")
      .update({ status: "rejected" })
      .eq("id", responseId)
      .eq("quote_request_id", id)
      .eq("status", "pending");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  let conversationId: string | undefined;
  let dealOfferId: string | undefined;
  let orderId: string | undefined;

  if (status === "accepted") {
    const conversationQuery = admin
      .from("conversations")
      .select("id")
      .eq("buyer_id", auth.user.id)
      .eq("seller_id", quoteResponse.expert_id)
      .eq("service_id", quoteResponse.service_id)
      .eq("quote_request_id", id);

    const { data: existingConversation } = await conversationQuery.limit(1).maybeSingle();
    conversationId = existingConversation?.id as string | undefined;

    if (!conversationId) {
      const { data: newConversation, error: conversationError } = await admin
        .from("conversations")
        .insert({
          buyer_id: auth.user.id,
          seller_id: quoteResponse.expert_id,
          service_id: quoteResponse.service_id,
          quote_request_id: id,
        })
        .select("id")
        .single();

      if (conversationError || !newConversation) {
        return NextResponse.json({ error: "대화방을 만들지 못했습니다" }, { status: 500 });
      }
      conversationId = newConversation.id;
    }

    const now = new Date().toISOString();
    const { data: dealOffer, error: dealOfferError } = await admin
      .from("deal_offers")
      .insert({
        conversation_id: conversationId,
        service_id: quoteResponse.service_id,
        quote_request_id: id,
        buyer_id: auth.user.id,
        expert_id: quoteResponse.expert_id,
        title: `견적요청: ${quoteRequest.title}`,
        scope: quoteResponse.message,
        amount: quoteResponse.price,
        delivery_days: quoteResponse.estimated_days,
        revisions: 1,
        status: "accepted",
        accepted_at: now,
      })
      .select("id")
      .single();

    if (dealOfferError || !dealOffer) {
      return NextResponse.json({ error: "합의견적을 만들지 못했습니다" }, { status: 500 });
    }
    dealOfferId = dealOffer.id;

    const requirements = [
      `[공개 견적 수락] ${quoteRequest.title}`,
      `작업 범위: ${quoteResponse.message}`,
      `납기: ${quoteResponse.estimated_days}일`,
    ].join("\n");

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        buyer_id: auth.user.id,
        seller_id: quoteResponse.expert_id,
        service_id: quoteResponse.service_id,
        package_id: null,
        amount: quoteResponse.price,
        requirements,
        deal_offer_id: dealOfferId,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "주문을 만들지 못했습니다" }, { status: 500 });
    }
    orderId = order.id;

    await admin.from("deal_offers").update({ order_id: orderId, updated_at: now }).eq("id", dealOfferId);
    const { error: acceptResponseError } = await admin
      .from("quote_responses")
      .update({ status: "accepted" })
      .eq("id", responseId)
      .eq("quote_request_id", id)
      .eq("status", "pending");

    if (acceptResponseError) {
      return NextResponse.json({ error: acceptResponseError.message }, { status: 500 });
    }

    await admin
      .from("quote_requests")
      .update({ status: "closed" })
      .eq("id", id);

    await admin
      .from("quote_responses")
      .update({ status: "rejected" })
      .eq("quote_request_id", id)
      .eq("status", "pending")
      .neq("id", responseId);

    const message = `공개 견적을 수락했습니다. 주문 ${orderId}가 생성되었습니다.`;
    await admin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: auth.user.id,
      content: message,
      message_type: "system",
    });
    await admin
      .from("conversations")
      .update({ order_id: orderId, last_message: message, last_message_at: now })
      .eq("id", conversationId);
  }

  return NextResponse.json({ success: true, conversationId, dealOfferId, orderId });
}
