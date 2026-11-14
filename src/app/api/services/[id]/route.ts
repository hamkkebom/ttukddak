import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServiceByIdDB, updateService, deleteService, replaceServicePackages } from "@/lib/db-server";
import { parsePackages } from "@/lib/service-packages";
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
    .select("expert_id, status")
    .eq("id", id)
    .single();

  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (service.expert_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다" }, { status: 400 });
  }
  if (body.status !== undefined && !["draft", "pending_review", "deleted"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid service status" }, { status: 400 });
  }
  // 정지는 관리자가 건 조치다. 소유자는 내용 수정과 삭제는 할 수 있지만,
  // 심사 신청 등으로 상태를 되돌릴 수는 없다. 해제는 관리자만 한다.
  if (service.status === "suspended" && body.status !== undefined && body.status !== "deleted") {
    return NextResponse.json({ error: "정지된 서비스는 관리자만 해제할 수 있습니다" }, { status: 409 });
  }

  // 받은 값을 그대로 넘기지 않고 고칠 수 있는 칸만 골라 만든다.
  const updates: Parameters<typeof updateService>[1] = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.description === "string") updates.description = body.description;
  if (typeof body.categoryId === "string") updates.categoryId = body.categoryId;
  if (Array.isArray(body.tags)) updates.tags = body.tags.filter((t: unknown): t is string => typeof t === "string");
  // 가격은 요청에서 받지 않는다. 대표 가격은 패키지를 저장할 때 DB 함수가 정한다 (아래).
  if (body.status !== undefined) updates.status = body.status;
  // 반려 사유는 관리자가 적는다. 소유자는 다시 심사를 신청할 때 지우는 것(null)만 할 수 있다.
  if (body.rejectionReason === null) updates.rejectionReason = null;

  if (body.packages !== undefined) {
    // 임시 저장 상태로 남는 서비스만 패키지가 비어 있어도 된다.
    const staysDraft = service.status === "draft" && (body.status === undefined || body.status === "draft");
    const parsed = parsePackages(body.packages, { requireOne: !staysDraft && body.status !== "deleted" });
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const saved = await replaceServicePackages(id, parsed.packages);
    // 대표 가격(services.price)은 DB 함수가 패키지와 같은 트랜잭션에서 가장 싼 패키지 가격으로 맞춘다.
    if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  } else if (body.status === "pending_review") {
    // 패키지 없이 심사를 신청하면 승인돼도 살 수 있는 조건이 없다. 이미 저장된 패키지가 있어야 한다.
    const { count, error: countError } = await admin
      .from("service_packages")
      .select("id", { count: "exact", head: true })
      .eq("service_id", id);
    if (countError) {
      console.error("[PATCH /api/services/[id]] 패키지 수 조회 실패", id, countError);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
    if (!count) {
      return NextResponse.json({ error: "패키지를 하나 이상 저장한 뒤 심사를 신청해 주세요" }, { status: 400 });
    }
  }

  const ok = await updateService(id, updates);
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
