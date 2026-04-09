import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
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

  const body = await req.json();
  const reason: string = body.reason || "";

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

  // Update status to rejected with reason
  const { error } = await adminSb
    .from("services")
    .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to reject service" }, { status: 500 });
  }

  // Notify the expert
  await createNotification({
    userId: service.expert_id,
    type: "system",
    title: "서비스 심사 반려",
    message: `"${service.title}" 서비스가 반려되었습니다.${reason ? ` 사유: ${reason}` : ""}`,
    link: `/dashboard/services/${service.id}/edit`,
  });

  return NextResponse.json({ success: true });
}
