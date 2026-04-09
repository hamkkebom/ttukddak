import { NextRequest, NextResponse } from "next/server";
import { getOrders, createOrder } from "@/lib/db-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get("buyerId") || undefined;
  const expertId = searchParams.get("expertId") || undefined;
  const status = searchParams.get("status") || undefined;
  const data = await getOrders({ buyerId, expertId, status });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const order = await createOrder(body);
  if (!order) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  return NextResponse.json(order, { status: 201 });
}
