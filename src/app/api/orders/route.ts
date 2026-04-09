import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  // Force buyerId to authenticated user
  body.buyerId = user.id;

  // Verify the service exists and price matches DB
  const { data: service } = await sb
    .from("services")
    .select("id, price, expert_id")
    .eq("id", body.serviceId)
    .single();

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  if (service.price !== body.price) {
    return NextResponse.json({ error: "Price mismatch" }, { status: 400 });
  }

  // Set expertId from DB, not client
  body.expertId = service.expert_id;

  const order = await createOrder(body);
  if (!order) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  return NextResponse.json(order, { status: 201 });
}
