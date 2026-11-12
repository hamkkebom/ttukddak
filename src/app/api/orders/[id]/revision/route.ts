import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { BUYER_ACCEPTANCE_STATUSES } from "@/lib/order-status";
import { createNotification } from "@/lib/notifications";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// POST - request revision (buyer only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 2000) : "";

  // orders 테이블에는 사용자 UPDATE 정책이 없으므로, 권한을 확인한 뒤 service_role 로 쓴다.
  const admin = createAdminSupabaseClient();
  const { data: order } = await admin
    .from("orders")
    .select("buyer_id, seller_id, status, revision_count")
    .eq("id", id)
    .maybeSingle();

  if (!order || order.buyer_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 납품물을 받은 상태(납품 완료·검수 중)에서만 수정 요청할 수 있다.
  if (!BUYER_ACCEPTANCE_STATUSES.includes(order.status as string)) {
    return NextResponse.json({ error: "Order is not in delivered status" }, { status: 400 });
  }

  // 방금 확인한 상태에서만 다시 in_progress 로 돌린다 (중복 요청·동시 변경 방지).
  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({
      status: "in_progress",
      revision_count: ((order.revision_count as number | null) ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", order.status)
    .select("id");

  if (updateError) {
    console.error("[OrderRevision] update failed:", updateError);
    return NextResponse.json({ error: "수정 요청 처리에 실패했습니다" }, { status: 500 });
  }
  if ((updated?.length ?? 0) === 0) {
    return NextResponse.json({ error: "주문 상태가 변경되어 수정 요청할 수 없습니다" }, { status: 409 });
  }

  // 수정 요청 사유를 전문가에게 전달한다. 알림 실패가 요청 자체를 실패시키지는 않는다.
  if (order.seller_id) {
    await createNotification({
      userId: order.seller_id as string,
      type: "order",
      title: "수정 요청이 도착했습니다",
      message: reason || "고객이 납품물 수정을 요청했습니다.",
      link: "/dashboard/orders",
    }).catch((e) => console.error("[OrderRevision] notification failed:", e));
  }

  return NextResponse.json({ success: true, message: "수정 요청이 전달되었습니다" });
}
