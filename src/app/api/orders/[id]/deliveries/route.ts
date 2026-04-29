import { NextRequest, NextResponse } from "next/server";
import { assertOrderParticipant, jsonError, requireUser } from "@/lib/api/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notifyDelivery } from "@/lib/notifications";

type DeliveryRow = {
  id: string;
  order_id: string;
  expert_id: string;
  file_url: string;
  file_name: string | null;
  message: string | null;
  version: number;
  created_at: string;
};

function mapDelivery(row: DeliveryRow) {
  return {
    id: row.id,
    order_id: row.order_id,
    expert_id: row.expert_id,
    message: row.message || "",
    files: [row.file_url],
    fileNames: row.file_name ? [row.file_name] : [],
    version: row.version,
    created_at: row.created_at,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const participant = await assertOrderParticipant(id, auth.user.id);
  if (!participant.ok) return participant.response;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("deliveries")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(((data || []) as DeliveryRow[]).map(mapDelivery));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const participant = await assertOrderParticipant(id, auth.user.id);
  if (!participant.ok) return participant.response;
  if (participant.order.seller_id !== auth.user.id) {
    return jsonError("프리랜서만 납품물을 등록할 수 있습니다", 403);
  }
  if (!["paid", "in_progress"].includes(participant.order.status)) {
    return jsonError("진행 중인 주문에만 납품할 수 있습니다", 409);
  }

  const body = await request.json().catch(() => ({}));
  const files = Array.isArray(body.files) ? body.files.filter(Boolean) as string[] : [];
  const fileNames = Array.isArray(body.fileNames) ? body.fileNames as string[] : [];
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (files.length === 0) return jsonError("납품 파일이 필요합니다");

  const admin = createAdminSupabaseClient();
  const { data: latest } = await admin
    .from("deliveries")
    .select("version")
    .eq("order_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = Number(latest?.version || 0) + 1;
  const rows = files.map((fileUrl, index) => ({
    order_id: id,
    expert_id: auth.user.id,
    file_url: fileUrl,
    file_name: fileNames[index] || fileUrl.split("/").pop() || null,
    message,
    version,
  }));

  const { data, error } = await admin
    .from("deliveries")
    .insert(rows)
    .select("*");

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "납품물을 저장하지 못했습니다" }, { status: 500 });
  }

  await admin
    .from("orders")
    .update({ status: "delivered", updated_at: new Date().toISOString() })
    .eq("id", id);

  const [{ data: orderInfo }, { data: expertProfile }] = await Promise.all([
    admin.from("orders").select("buyer_id, service_id").eq("id", id).maybeSingle(),
    admin.from("profiles").select("name").eq("id", auth.user.id).maybeSingle(),
  ]);
  if (orderInfo?.buyer_id && orderInfo?.service_id) {
    const { data: service } = await admin
      .from("services")
      .select("title")
      .eq("id", orderInfo.service_id)
      .maybeSingle();

    await notifyDelivery({
      buyerUserId: orderInfo.buyer_id,
      expertName: expertProfile?.name || "전문가",
      serviceName: service?.title || "주문",
      orderId: id,
    }).catch(() => {});
  }

  return NextResponse.json((data as DeliveryRow[]).map(mapDelivery), { status: 201 });
}
