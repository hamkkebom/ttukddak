import { NextRequest, NextResponse } from "next/server";
import { assertConversationParticipant, isAdminUser, jsonError, requireUser } from "@/lib/api/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type DealOfferRow = {
  id: string;
  conversation_id: string;
  buyer_id: string;
  status: string;
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
    .select("id,conversation_id,buyer_id,status")
    .eq("id", id)
    .maybeSingle();

  if (!offerData) return jsonError("합의견적을 찾을 수 없습니다", 404);
  const offer = offerData as DealOfferRow;

  const participant = await assertConversationParticipant(offer.conversation_id, auth.user.id);
  if (!participant.ok) return participant.response;

  const isAdmin = await isAdminUser(auth.user.id);
  if (offer.buyer_id !== auth.user.id && !isAdmin) {
    return jsonError("고객만 합의견적을 거절할 수 있습니다", 403);
  }

  if (offer.status !== "pending") {
    return jsonError("대기 중인 합의견적만 거절할 수 있습니다", 409);
  }

  const rejectedAt = new Date().toISOString();
  const { error } = await admin
    .from("deal_offers")
    .update({
      status: "rejected",
      rejected_at: rejectedAt,
      updated_at: rejectedAt,
    })
    .eq("id", offer.id)
    .eq("status", "pending");

  if (error) return NextResponse.json({ error: "합의견적을 거절하지 못했습니다" }, { status: 500 });

  const message = "합의견적을 거절했습니다. 대화에서 조건을 다시 협의할 수 있습니다.";
  await admin.from("messages").insert({
    conversation_id: offer.conversation_id,
    sender_id: auth.user.id,
    content: message,
    message_type: "system",
  });
  await admin
    .from("conversations")
    .update({ last_message: message, last_message_at: new Date().toISOString() })
    .eq("id", offer.conversation_id);

  return NextResponse.json({ success: true });
}
