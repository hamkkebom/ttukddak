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

  const { status } = await req.json();
  const isAdmin = await isAdminUser(auth.user.id);
  const actor = isAdmin
    ? "admin"
    : participant.order.buyer_id === auth.user.id
      ? "buyer"
      : "seller";

  if (!canTransitionOrderStatus(participant.order.status, status, actor)) {
    return NextResponse.json({ error: "허용되지 않은 주문 상태 변경입니다" }, { status: 409 });
  }

  const ok = await updateOrderStatus(id, status);
  if (!ok) return NextResponse.json({ error: "Failed" }, { status: 500 });
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

  if (!canTransitionOrderStatus(participant.order.status, "cancelled", "buyer")) {
    return NextResponse.json({ error: "취소할 수 없는 주문 상태입니다" }, { status: 409 });
  }

  const ok = await updateOrderStatus(id, "cancelled");
  if (!ok) return NextResponse.json({ success: false, error: "Failed to cancel order" }, { status: 500 });
  return NextResponse.json({ success: true });
}
