import { NextRequest, NextResponse } from "next/server";
import { getQuoteRequests, createQuoteRequest } from "@/lib/db-server";
import { isAdminUser, jsonError, requireUser } from "@/lib/api/auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const searchParams = new URL(req.url).searchParams;
  const userId = searchParams.get("userId") || undefined;
  const status = searchParams.get("status") || undefined;
  const isAdmin = await isAdminUser(auth.user.id);

  if (userId && userId !== auth.user.id && !isAdmin) {
    return jsonError("Forbidden", 403);
  }

  const data = await getQuoteRequests({ userId, status });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await req.json();

  // Force userId from authenticated user
  body.userId = auth.user.id;

  const ok = await createQuoteRequest(body);
  if (!ok) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
