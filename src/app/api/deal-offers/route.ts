import { NextRequest, NextResponse } from "next/server";
import { assertConversationParticipant, jsonError, requireUser } from "@/lib/api/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { CreateDealOfferInput, DealOffer } from "@/types";

type DealOfferRow = {
  id: string;
  conversation_id: string;
  service_id: string;
  quote_request_id: string | null;
  order_id: string | null;
  buyer_id: string;
  expert_id: string;
  title: string;
  scope: string;
  amount: number;
  delivery_days: number;
  revisions: number;
  memo: string | null;
  status: DealOffer["status"];
  expires_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapDealOffer(row: DealOfferRow): DealOffer {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    serviceId: row.service_id,
    quoteRequestId: row.quote_request_id || undefined,
    orderId: row.order_id || undefined,
    buyerId: row.buyer_id,
    expertId: row.expert_id,
    title: row.title,
    scope: row.scope,
    amount: row.amount,
    deliveryDays: row.delivery_days,
    revisions: row.revisions,
    memo: row.memo || undefined,
    status: row.status,
    expiresAt: row.expires_at || undefined,
    acceptedAt: row.accepted_at || undefined,
    rejectedAt: row.rejected_at || undefined,
    cancelledAt: row.cancelled_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const conversationId = new URL(req.url).searchParams.get("conversationId");
  if (!conversationId) return jsonError("conversationId가 필요합니다");

  const participant = await assertConversationParticipant(conversationId, auth.user.id);
  if (!participant.ok) return participant.response;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("deal_offers")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "합의견적을 불러오지 못했습니다" }, { status: 500 });
  return NextResponse.json((data || []).map((row) => mapDealOffer(row as DealOfferRow)));
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const input = (await req.json().catch(() => ({}))) as Partial<CreateDealOfferInput>;
  if (!input.conversationId || !input.serviceId) return jsonError("conversationId와 serviceId가 필요합니다");
  if (!input.title?.trim()) return jsonError("견적 제목이 필요합니다");
  if (!input.scope?.trim()) return jsonError("작업 범위가 필요합니다");

  const amount = Number(input.amount);
  const deliveryDays = Number(input.deliveryDays);
  const revisions = Number.isFinite(Number(input.revisions)) ? Number(input.revisions) : 1;
  if (!Number.isInteger(amount) || amount <= 0) return jsonError("금액은 1원 이상 정수여야 합니다");
  if (!Number.isInteger(deliveryDays) || deliveryDays <= 0) return jsonError("납기는 1일 이상이어야 합니다");
  if (!Number.isInteger(revisions) || revisions < 0) return jsonError("수정 횟수는 0 이상이어야 합니다");

  const participant = await assertConversationParticipant(input.conversationId, auth.user.id);
  if (!participant.ok) return participant.response;
  const conversation = participant.conversation;
  if (conversation.seller_id !== auth.user.id) return jsonError("프리랜서만 합의견적을 제안할 수 있습니다", 403);

  const admin = createAdminSupabaseClient();
  const { data: service } = await admin
    .from("services")
    .select("id,expert_id,title,status")
    .eq("id", input.serviceId)
    .maybeSingle();

  if (!service) return jsonError("서비스를 찾을 수 없습니다", 404);
  if (service.expert_id !== auth.user.id) return jsonError("본인 서비스로만 견적을 제안할 수 있습니다", 403);

  const { data, error } = await admin
    .from("deal_offers")
    .insert({
      conversation_id: input.conversationId,
      service_id: input.serviceId,
      quote_request_id: input.quoteRequestId || conversation.quote_request_id,
      buyer_id: conversation.buyer_id,
      expert_id: auth.user.id,
      title: input.title.trim(),
      scope: input.scope.trim(),
      amount,
      delivery_days: deliveryDays,
      revisions,
      memo: input.memo?.trim() || null,
      expires_at: input.expiresAt || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) return NextResponse.json({ error: "합의견적을 저장하지 못했습니다" }, { status: 500 });

  const message = `합의견적 제안: ${input.title.trim()} / ${amount.toLocaleString("ko-KR")}원 / ${deliveryDays}일`;
  await admin.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: auth.user.id,
    content: message,
    message_type: "deal_offer",
  });
  await admin
    .from("conversations")
    .update({ last_message: message, last_message_at: new Date().toISOString() })
    .eq("id", input.conversationId);

  return NextResponse.json(mapDealOffer(data as DealOfferRow), { status: 201 });
}
