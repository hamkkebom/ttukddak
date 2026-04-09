import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GET - fetch user's notifications
export async function GET(request: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST - create a notification (admin/system only)
export async function POST(request: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin can create notifications for arbitrary users
  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, type, title, message, link } = body;

  if (!userId || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
  const adminSb = createAdminSupabaseClient();

  const { data, error } = await adminSb
    .from("notifications")
    .insert({
      user_id: userId,
      type: type || "system",
      title,
      description: message || "",
      link: link || null,
      is_read: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
