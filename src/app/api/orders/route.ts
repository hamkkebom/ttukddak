import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { computeOrderAmount } from "@/lib/payment/amount";

export async function GET(req: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get("buyerId") || undefined;
  const expertId = searchParams.get("expertId") || undefined;
  const status = searchParams.get("status") || undefined;

  // Users can only see orders where they are the buyer or seller.
  // If neither buyerId nor expertId is specified, default to buyer view.
  // Prevent users from querying other users' orders by overriding any
  // supplied ids with the authenticated user's id.
  const effectiveBuyerId = !expertId ? (buyerId || user.id) : buyerId;
  const effectiveExpertId = expertId || undefined;

  // Security: ensure the user is only querying their own data
  if (effectiveBuyerId && effectiveBuyerId !== user.id && effectiveExpertId && effectiveExpertId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (effectiveBuyerId && effectiveBuyerId !== user.id && !effectiveExpertId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (effectiveExpertId && effectiveExpertId !== user.id && !effectiveBuyerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await getOrders({ buyerId: effectiveBuyerId, expertId: effectiveExpertId, status });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // 보안: 클라이언트가 보낸 price/expertId/buyerId는 무시하고 서버에서 재계산한다.
  // 공격자가 1원에 고가 서비스를 결제하는 시나리오를 차단.
  const serviceId: string | undefined = body.serviceId;
  if (!serviceId) {
    return NextResponse.json({ error: "serviceId가 필요합니다" }, { status: 400 });
  }

  const computed = await computeOrderAmount({
    serviceId,
    packageName: body.packageName ?? null,
    userId: user.id,
    couponCode: body.couponCode ?? null,
  });

  if (!computed.ok) {
    return NextResponse.json({ error: computed.error }, { status: computed.status });
  }

  const order = await createOrder({
    buyerId: user.id,
    serviceId,
    expertId: computed.data.expertId,
    packageId: computed.data.packageId,
    packageName: computed.data.packageName ?? body.packageName ?? "",
    price: computed.data.totalAmount,
    requirements: body.requirements,
    couponId: computed.data.userCouponId,
  });

  if (!order) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  return NextResponse.json(order, { status: 201 });
}
