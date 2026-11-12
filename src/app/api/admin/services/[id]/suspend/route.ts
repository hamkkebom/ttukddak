import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { jsonError, requireAdmin } from "@/lib/api/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications";

// 관리자의 서비스 정지(POST)와 정지 해제(DELETE).
//
// 정지: 공개 중(active)인 서비스를 내린다. 정지된 서비스는 목록·상세에서 사라지고 새 주문을 받을 수 없다.
// 해제: 정지(suspended)된 서비스를 다시 공개한다.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Transition = {
  from: "active" | "suspended";
  to: "active" | "suspended";
  conflict: string;
  notifyTitle: string;
  notifyMessage: (title: string) => string;
};

const SUSPEND: Transition = {
  from: "active",
  to: "suspended",
  conflict: "공개 중인 서비스만 정지할 수 있습니다",
  notifyTitle: "서비스가 정지되었습니다",
  notifyMessage: (title) => `"${title}" 서비스가 관리자에 의해 정지되어 더 이상 노출되지 않습니다.`,
};

const RESUME: Transition = {
  from: "suspended",
  to: "active",
  conflict: "정지된 서비스만 해제할 수 있습니다",
  notifyTitle: "서비스 정지가 해제되었습니다",
  notifyMessage: (title) => `"${title}" 서비스의 정지가 해제되어 다시 노출됩니다.`,
};

async function changeStatus(id: string, transition: Transition) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  if (!UUID.test(id)) return jsonError("Service not found", 404);

  const adminSb = createAdminSupabaseClient();

  // 현재 상태가 기대한 값일 때만 바꾼다. 그 사이 다른 관리자가 처리했거나 전문가가
  // 상태를 바꾼 경우에는 0건이 되어, 엉뚱한 상태를 덮어쓰지 않는다.
  const { data: updated, error } = await adminSb
    .from("services")
    .update({ status: transition.to, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", transition.from)
    .select("id, expert_id, title");

  if (error) return jsonError("Failed to update service", 500);

  if (!updated || updated.length === 0) {
    const { data: existing } = await adminSb.from("services").select("id").eq("id", id).maybeSingle();
    return existing ? jsonError(transition.conflict, 409) : jsonError("Service not found", 404);
  }

  const service = updated[0];

  // 공개 상세 페이지는 캐시된다. 정지·해제가 바로 보이도록 무효화한다.
  revalidatePath(`/service/${id}`);

  await createNotification({
    userId: service.expert_id,
    type: "system",
    title: transition.notifyTitle,
    message: transition.notifyMessage(service.title),
    link: `/dashboard/services/${service.id}/edit`,
  });

  return NextResponse.json({ success: true });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return changeStatus(id, SUSPEND);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return changeStatus(id, RESUME);
}
