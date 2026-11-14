import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { jsonError, requireUser } from "@/lib/api/auth";

type StartConversationBody = {
  expertId?: string;
  serviceId?: string;
  quoteRequestId?: string;
  initialMessage?: string;
};

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as StartConversationBody;
  const expertId = body.expertId?.trim();
  const serviceId = body.serviceId?.trim() || null;
  const quoteRequestId = body.quoteRequestId?.trim() || null;
  const initialMessage = body.initialMessage?.trim();

  if (!expertId) return jsonError("expertId가 필요합니다");
  if (expertId === auth.user.id) return jsonError("본인에게 문의할 수 없습니다");

  const admin = createAdminSupabaseClient();

  // 문의는 전문가에게만 보낼 수 있다. 서비스 없이 보내는 문의(전문가 화면)도 있으므로 여기서 확인한다.
  const { data: expert } = await admin.from("experts").select("id").eq("id", expertId).maybeSingle();
  if (!expert) return jsonError("전문가를 찾을 수 없습니다", 404);

  if (serviceId) {
    const { data: service } = await admin
      .from("services")
      .select("id,expert_id,status")
      .eq("id", serviceId)
      .maybeSingle();

    if (!service) return jsonError("서비스를 찾을 수 없습니다", 404);
    if (service.expert_id !== expertId) return jsonError("서비스 담당 전문가가 일치하지 않습니다", 400);
    if (service.status && service.status !== "active") return jsonError("공개된 서비스에만 문의할 수 있습니다", 400);
  }

  if (quoteRequestId) {
    const { data: quoteRequest } = await admin
      .from("quote_requests")
      .select("id,requester_id,status")
      .eq("id", quoteRequestId)
      .maybeSingle();

    if (!quoteRequest) return jsonError("견적요청을 찾을 수 없습니다", 404);
    if (quoteRequest.requester_id !== auth.user.id) return jsonError("견적요청 소유자만 대화를 시작할 수 있습니다", 403);
  }

  let existingQuery = admin
    .from("conversations")
    .select("id")
    .eq("buyer_id", auth.user.id)
    .eq("seller_id", expertId);

  existingQuery = serviceId ? existingQuery.eq("service_id", serviceId) : existingQuery.is("service_id", null);
  existingQuery = quoteRequestId ? existingQuery.eq("quote_request_id", quoteRequestId) : existingQuery.is("quote_request_id", null);

  const { data: existing } = await existingQuery.limit(1).maybeSingle();
  let conversationId = existing?.id as string | undefined;

  if (!conversationId) {
    const { data, error } = await admin
      .from("conversations")
      .insert({
        buyer_id: auth.user.id,
        seller_id: expertId,
        service_id: serviceId,
        quote_request_id: quoteRequestId,
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "대화방을 만들지 못했습니다" }, { status: 500 });
    }

    conversationId = data.id;
  }

  if (initialMessage) {
    const { error } = await admin.from("messages").insert({
      conversation_id: conversationId,
      sender_id: auth.user.id,
      content: initialMessage,
      message_type: "text",
    });

    if (error) return NextResponse.json({ error: "첫 문의 메시지를 저장하지 못했습니다" }, { status: 500 });

    await admin
      .from("conversations")
      .update({
        last_message: initialMessage,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  }

  return NextResponse.json({ id: conversationId, conversationId }, { status: existing ? 200 : 201 });
}
