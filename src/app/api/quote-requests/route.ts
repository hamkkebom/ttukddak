import { NextRequest, NextResponse } from "next/server";
import { getQuoteRequests, createQuoteRequest } from "@/lib/db-server";

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId") || undefined;
  const status = new URL(req.url).searchParams.get("status") || undefined;
  const data = await getQuoteRequests({ userId, status });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ok = await createQuoteRequest(body);
  if (!ok) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
