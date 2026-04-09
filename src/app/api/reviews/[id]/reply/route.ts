import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// POST - expert reply to a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await request.json();
  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Reply content is required" }, { status: 400 });
  }

  // Verify user is the expert for the reviewed service
  const { data: review } = await sb
    .from("reviews")
    .select("service_id")
    .eq("id", id)
    .single();

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const { data: service } = await sb
    .from("services")
    .select("expert_id")
    .eq("id", review.service_id)
    .single();

  if (!service || service.expert_id !== user.id) {
    return NextResponse.json({ error: "Only the service expert can reply" }, { status: 403 });
  }

  // Update the review with expert reply
  const { error } = await sb
    .from("reviews")
    .update({
      expert_reply: content.trim(),
      expert_reply_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
