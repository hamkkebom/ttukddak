import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  const { id, responseId } = await params;
  const sb = await createServerSupabaseClient();

  // Auth check
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user owns the quote request
  const { data: quoteRequest } = await sb
    .from("quote_requests")
    .select("id, requester_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!quoteRequest) {
    return NextResponse.json({ error: "Quote request not found" }, { status: 404 });
  }

  if (quoteRequest.requester_id !== user.id) {
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

  // Update the specific response
  const { error: updateError } = await sb
    .from("quote_responses")
    .update({ status })
    .eq("id", responseId)
    .eq("quote_request_id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (status === "accepted") {
    // Close the quote request
    await sb
      .from("quote_requests")
      .update({ status: "closed" })
      .eq("id", id);

    // Reject all other pending responses for this request
    await sb
      .from("quote_responses")
      .update({ status: "rejected" })
      .eq("quote_request_id", id)
      .eq("status", "pending")
      .neq("id", responseId);
  }

  return NextResponse.json({ success: true });
}
