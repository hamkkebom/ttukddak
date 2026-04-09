import { NextRequest, NextResponse } from "next/server";
import { getExpertApplications, createExpertApplication, updateApplicationStatus } from "@/lib/db-server";

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId") || undefined;
  const data = await getExpertApplications(userId);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const ok = await createExpertApplication(body);
  if (!ok) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  const ok = await updateApplicationStatus(id, status);
  if (!ok) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
