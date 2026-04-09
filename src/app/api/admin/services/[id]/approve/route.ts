import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify the requesting user is an admin
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminSb = createAdminSupabaseClient();

  // Get the service to find the expert
  const { data: service, error: fetchError } = await adminSb
    .from("services")
    .select("id, expert_id, title")
    .eq("id", id)
    .single();

  if (fetchError || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  // Update status to active and clear rejection reason
  const { error } = await adminSb
    .from("services")
    .update({ status: "active", rejection_reason: null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to approve service" }, { status: 500 });
  }

  // Notify the expert
  await createNotification({
    userId: service.expert_id,
    type: "system",
    title: "서비스가 승인되었습니다",
    message: `"${service.title}" 서비스가 승인되어 활성화되었습니다.`,
    link: `/service/${service.id}`,
  });

  return NextResponse.json({ success: true });
}
