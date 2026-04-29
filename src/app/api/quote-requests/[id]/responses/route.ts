import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";
import { jsonError, requireUser } from "@/lib/api/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { QuoteResponse } from "@/types";

type QuoteResponseListRow = {
  id: string;
  quote_request_id: string;
  expert_id: string;
  service_id?: string | null;
  profiles?: { name?: string | null; avatar_url?: string | null } | null;
  services?: { title?: string | null } | null;
  price: number;
  message: string;
  estimated_days: number;
  status: QuoteResponse["status"];
  created_at: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminSupabaseClient();

  const { data: quoteRequest } = await admin
    .from("quote_requests")
    .select("id,requester_id")
    .eq("id", id)
    .maybeSingle();

  if (!quoteRequest) return jsonError("Quote request not found", 404);

  let query = admin
    .from("quote_responses")
    .select("*, profiles!quote_responses_expert_id_fkey(name, avatar_url), services(title)")
    .eq("quote_request_id", id)
    .order("created_at", { ascending: true });

  if (quoteRequest.requester_id !== auth.user.id) {
    query = query.eq("expert_id", auth.user.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const responses: QuoteResponse[] = ((data || []) as QuoteResponseListRow[]).map((r) => ({
    id: r.id,
    quoteRequestId: r.quote_request_id,
    expertId: r.expert_id,
    serviceId: r.service_id || undefined,
    serviceTitle: r.services?.title || undefined,
    expertName: r.profiles?.name || undefined,
    expertAvatar: r.profiles?.avatar_url || undefined,
    price: r.price,
    message: r.message,
    estimatedDays: r.estimated_days,
    status: r.status,
    createdAt: r.created_at,
  }));

  return NextResponse.json(responses);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const admin = createAdminSupabaseClient();

  // Verify user is an expert
  const { data: expert } = await admin
    .from("experts")
    .select("id")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!expert) {
    return NextResponse.json({ error: "Only experts can submit quote responses" }, { status: 403 });
  }

  // Fetch quote request to get the requester's userId
  const { data: quoteRequest } = await admin
    .from("quote_requests")
    .select("id, requester_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!quoteRequest) {
    return NextResponse.json({ error: "Quote request not found" }, { status: 404 });
  }

  if (quoteRequest.status === "closed") {
    return NextResponse.json({ error: "Quote request is closed" }, { status: 400 });
  }

  const body = await req.json();
  const { price, message, estimatedDays, serviceId } = body;

  if (!price || !message || !estimatedDays || !serviceId) {
    return NextResponse.json({ error: "price, message, estimatedDays, serviceId are required" }, { status: 400 });
  }

  const { data: service } = await admin
    .from("services")
    .select("id,expert_id,status")
    .eq("id", serviceId)
    .maybeSingle();

  if (!service) return jsonError("서비스를 찾을 수 없습니다", 404);
  if (service.expert_id !== auth.user.id) return jsonError("본인 서비스로만 견적을 보낼 수 있습니다", 403);
  if (service.status && service.status !== "active") return jsonError("공개된 서비스로만 견적을 보낼 수 있습니다", 400);
  if (Number(price) <= 0 || Number(estimatedDays) <= 0) {
    return jsonError("견적 금액과 작업 기간은 1 이상이어야 합니다");
  }

  // Insert response
  const { data: inserted, error: insertError } = await admin
    .from("quote_responses")
    .insert({
      quote_request_id: id,
      expert_id: auth.user.id,
      service_id: serviceId,
      price: Number(price),
      message: String(message).trim(),
      estimated_days: Number(estimatedDays),
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message || "Failed to insert" }, { status: 500 });
  }

  // If this is the first response, update quote_request status to "matched"
  if (quoteRequest.status === "open") {
    const { count } = await admin
      .from("quote_responses")
      .select("id", { count: "exact", head: true })
      .eq("quote_request_id", id);

    if ((count || 0) <= 1) {
      await admin
        .from("quote_requests")
        .update({ status: "matched" })
        .eq("id", id);
    }
  }

  // Notify the quote requester
  await createNotification({
    userId: quoteRequest.requester_id,
    type: "system",
    title: "새 견적이 도착했어요",
    message: `전문가가 견적을 보냈습니다. 확인해보세요.`,
    link: `/dashboard/quotes/responses`,
  });

  return NextResponse.json({ success: true, data: inserted }, { status: 201 });
}
