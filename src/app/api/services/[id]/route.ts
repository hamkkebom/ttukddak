import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServiceByIdDB, updateService, deleteService } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/api/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = await getServiceByIdDB(id);

  if (!service) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Service not found",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: service,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify user is the expert who owns the service
  const admin = createAdminSupabaseClient();
  const { data: service } = await admin
    .from("services")
    .select("expert_id")
    .eq("id", id)
    .single();

  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (service.expert_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (body.status && !["draft", "pending_review", "deleted"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid service status" }, { status: 400 });
  }
  const ok = await updateService(id, body);
  if (!ok) return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  // 상세 페이지는 캐시되므로, 수정한 내용이 다음 방문에 바로 보이도록 무효화한다.
  revalidatePath(`/service/${id}`);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify user is the expert who owns the service
  const admin = createAdminSupabaseClient();
  const { data: service } = await admin
    .from("services")
    .select("expert_id")
    .eq("id", id)
    .single();

  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // 소유자 본인 또는 관리자만 삭제할 수 있다.
  if (service.expert_id !== user.id && !(await isAdminUser(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ok = await deleteService(id);
  if (!ok) return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  revalidatePath(`/service/${id}`);
  return NextResponse.json({ success: true });
}
