import { NextRequest, NextResponse } from "next/server";
import { updateProfile } from "@/lib/db-server";

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = await updateProfile(id, updates);
  if (!ok) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
