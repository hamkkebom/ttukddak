import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import type { QuoteResponse } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = await createServerSupabaseClient();

  const { data, error } = await sb
    .from("quote_responses")
    .select("*, profiles!quote_responses_expert_id_fkey(name, avatar_url)")
    .eq("quote_request_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const responses: QuoteResponse[] = (data || []).map((r: any) => ({
    id: r.id,
    quoteRequestId: r.quote_request_id,
    expertId: r.expert_id,
    expertName: r.profiles?.name,
    expertAvatar: r.profiles?.avatar_url,
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
  const sb = await createServerSupabaseClient();

  // Auth check
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is an expert
  const { data: expert } = await sb
    .from("experts")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!expert) {
    return NextResponse.json({ error: "Only experts can submit quote responses" }, { status: 403 });
  }

  // Fetch quote request to get the requester's userId
  const { data: quoteRequest } = await sb
    .from("quote_requests")
    .select("id, user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!quoteRequest) {
    return NextResponse.json({ error: "Quote request not found" }, { status: 404 });
  }

  if (quoteRequest.status === "closed") {
    return NextResponse.json({ error: "Quote request is closed" }, { status: 400 });
  }

  const body = await req.json();
  const { price, message, estimatedDays } = body;

  if (!price || !message || !estimatedDays) {
    return NextResponse.json({ error: "price, message, estimatedDays are required" }, { status: 400 });
  }

  // Insert response
  const { data: inserted, error: insertError } = await sb
    .from("quote_responses")
    .insert({
      quote_request_id: id,
      expert_id: user.id,
      price: Number(price),
      message,
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
    const { count } = await sb
      .from("quote_responses")
      .select("id", { count: "exact", head: true })
      .eq("quote_request_id", id);

    if ((count || 0) <= 1) {
      await sb
        .from("quote_requests")
        .update({ status: "matched" })
        .eq("id", id);
    }
  }

  // Notify the quote requester
  await createNotification({
    userId: quoteRequest.user_id,
    type: "system",
    title: "새 견적이 도착했어요",
    message: `전문가가 견적을 보냈습니다. 확인해보세요.`,
    link: `/dashboard/quotes/responses`,
  });

  return NextResponse.json({ success: true, data: inserted }, { status: 201 });
}
