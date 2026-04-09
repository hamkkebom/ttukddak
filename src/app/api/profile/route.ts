import { NextRequest, NextResponse } from "next/server";
import { updateProfile } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await req.json();

  // Force id to authenticated user — user can only update own profile
  const ok = await updateProfile(user.id, updates);
  if (!ok) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
