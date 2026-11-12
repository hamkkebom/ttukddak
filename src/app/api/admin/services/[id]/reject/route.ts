import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

  // Update status to rejected with reason.
  // 승인 대기 상태일 때만 반려한다. 공개 중인 서비스를 내릴 때는 정지를 쓴다.
  const { data: rejected, error } = await adminSb
    .from("services")
    .update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending_review")
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to reject service" }, { status: 500 });
  }
  if (!rejected || rejected.length === 0) {
    return NextResponse.json({ error: "승인 대기 중인 서비스만 반려할 수 있습니다" }, { status: 409 });
  }

  // 상태가 바뀌었으니 공개 상세 페이지 캐시를 무효화한다.
  revalidatePath(`/service/${id}`);

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
