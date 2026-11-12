import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderStatus } from "@/lib/db-server";
import { assertOrderParticipant, canTransitionOrderStatus, isAdminUser, requireUser } from "@/lib/api/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const participant = await assertOrderParticipant(id, auth.user.id);
  if (!participant.ok) return participant.response;

  const order = await getOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const participant = await assertOrderParticipant(id, auth.user.id);
  if (!participant.ok) return participant.response;

  const body = await req.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : "";
  const isAdmin = await isAdminUser(auth.user.id);
  const actor = isAdmin
    ? "admin"
    : participant.order.buyer_id === auth.user.id
      ? "buyer"
      : "seller";

  if (!canTransitionOrderStatus(participant.order.status, status, actor)) {
    return NextResponse.json({ error: "허용되지 않은 주문 상태 변경입니다" }, { status: 409 });
  }

  // 확인한 상태에서만 바꾼다. 그 사이 상태가 달라졌다면 실패로 응답한다.
  const ok = await updateOrderStatus(id, status, participant.order.status);
  if (!ok) {
    return NextResponse.json({ error: "주문 상태가 변경되어 처리할 수 없습니다. 새로고침 후 다시 시도해 주세요" }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const participant = await assertOrderParticipant(id, auth.user.id);
  if (!participant.ok) return participant.response;
  if (participant.order.buyer_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 결제 전(pending) 주문만 여기서 취소할 수 있다. 결제된 주문은 환불 절차를 거쳐야 한다.
  if (!canTransitionOrderStatus(participant.order.status, "cancelled", "buyer")) {
    return NextResponse.json({ error: "취소할 수 없는 주문 상태입니다" }, { status: 409 });
  }

  const ok = await updateOrderStatus(id, "cancelled", participant.order.status);
  if (!ok) {
    return NextResponse.json({ success: false, error: "주문 상태가 변경되어 취소할 수 없습니다" }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
