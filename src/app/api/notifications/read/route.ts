import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// PATCH - mark notifications as read
export async function PATCH(request: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await request.json();

  if (ids && Array.isArray(ids)) {
    // Mark specific notifications as read
    await sb
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids)
      .eq("user_id", user.id);
  } else {
    // Mark all as read
    await sb
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
  }

  return NextResponse.json({ success: true });
}
