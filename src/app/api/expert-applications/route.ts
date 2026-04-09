import { NextRequest, NextResponse } from "next/server";
import { getExpertApplications, createExpertApplication, updateApplicationStatus } from "@/lib/db-server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if admin — admins see all applications, users see only their own
  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const requestedUserId = new URL(req.url).searchParams.get("userId") || undefined;

  // Non-admins can only see their own applications
  const userId = isAdmin ? requestedUserId : user.id;

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
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin can approve/reject applications
  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await req.json();
  const ok = await updateApplicationStatus(id, status);
  if (!ok) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true });
}
