import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("support_tickets")
    .select("id, subject, category, priority, status, admin_response, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("support tickets fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { subject, category, message, priority } = body as {
    subject: string;
    category?: string;
    message?: string;
    priority?: string;
  };

  if (!subject) return NextResponse.json({ error: "subject is required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("support_tickets")
    .insert({
      user_id: user.id,
      user_name: profile?.name ?? null,
      user_email: profile?.email ?? user.email ?? null,
      subject,
      category: category ?? "general",
      message: message ?? null,
      priority: priority ?? "medium",
      status: "open",
    })
    .select()
    .single();

  if (error) {
    console.error("support ticket create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
