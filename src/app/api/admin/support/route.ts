import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function checkAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") return { error: "Forbidden", status: 403, user: null };

  return { error: null, status: 200, user };
}

export async function GET(req: NextRequest) {
  const auth = await checkAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const admin = createAdminSupabaseClient();
  let query = admin
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const { data, error } = await query;

  if (error) {
    console.error("support tickets fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAdmin();
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { id, status, adminResponse } = body as {
    id: string;
    status?: string;
    adminResponse?: string;
  };

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) {
    payload.status = status;
    if (status === "resolved" || status === "closed") {
      payload.resolved_at = new Date().toISOString();
    }
  }
  if (adminResponse !== undefined) {
    payload.admin_response = adminResponse;
    payload.admin_id = auth.user!.id;
    if (!status) payload.status = "in_progress";
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("support_tickets")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("support ticket update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
