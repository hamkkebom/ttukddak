import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

  // Update status to active and clear rejection reason.
  // 승인 대기 상태일 때만 승인한다. 정지·삭제된 서비스가 승인으로 다시 공개되지 않게 한다.
  const { data: approved, error } = await adminSb
    .from("services")
    .update({ status: "active", rejection_reason: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending_review")
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to approve service" }, { status: 500 });
  }
  if (!approved || approved.length === 0) {
    return NextResponse.json({ error: "승인 대기 중인 서비스만 승인할 수 있습니다" }, { status: 409 });
  }

  // 공개 상세 페이지는 캐시된다. 승인 직후부터 보이도록 무효화한다.
  revalidatePath(`/service/${id}`);

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
